import {
  buildASTSchema,
  buildSchema,
  DocumentNode,
  execute,
  ExecutionResult,
  GraphQLSchema,
  introspectionFromSchema,
  isSchema,
} from 'graphql';
import type { Plugin } from 'graphql-yoga';
import {
  createExecutablePlanForOperation,
  ExecutableOperationPlan,
  executeOperationPlan,
  extractSubgraphFromSupergraph,
  serializeExecutableOperationPlan,
} from '@graphql-mesh/fusion-execution';
import {
  ExecutionRequest,
  Executor,
  getDirective,
  isPromise,
  memoize2of4,
} from '@graphql-tools/utils';

export type TransportEntry = {
  kind: string;
  location: string;
  headers: Record<string, string>;
  options: any;
};

export function getSubgraphTransportMapFromSupergraph(supergraph: GraphQLSchema) {
  const subgraphTransportEntryMap: Record<string, TransportEntry> = {};
  const transportDirectives = getDirective(supergraph, supergraph, 'transport');
  if (transportDirectives?.length) {
    for (const { kind, subgraph, location, headers, ...options } of transportDirectives) {
      subgraphTransportEntryMap[subgraph] = {
        kind,
        location,
        headers,
        options,
      };
    }
  }
  return subgraphTransportEntryMap;
}

export const getMemoizedExecutionPlanForOperation = memoize2of4(
  function getMemoizedExecutionPlanForOperation(
    supergraph: GraphQLSchema,
    document: DocumentNode,
    operationName?: string,
    _random?: number,
  ) {
    return createExecutablePlanForOperation({
      supergraph,
      document,
      operationName,
    });
  },
);

export function getExecutorForSupergraph(
  supergraph: GraphQLSchema,
  getTransportExecutor: (
    transportEntry: TransportEntry,
    getSubgraph: () => GraphQLSchema,
    subgraphName: string,
  ) => Executor | Promise<Executor>,
  plugins?: SupergraphPlugin[],
): Executor {
  const onSubgraphExecuteHooks: OnSubgraphExecuteHook[] = [];
  if (plugins) {
    for (const plugin of plugins) {
      if (plugin.onSubgraphExecute) {
        onSubgraphExecuteHooks.push(plugin.onSubgraphExecute);
      }
    }
  }
  const transportEntryMap = getSubgraphTransportMapFromSupergraph(supergraph);
  const executorMap: Record<string, Executor> = {};
  return function supergraphExecutor(execReq: ExecutionRequest) {
    function onSubgraphExecute(
      subgraphName: string,
      document: DocumentNode,
      variables: any,
      context: any,
    ) {
      let executor: Executor = executorMap[subgraphName];
      if (executor == null) {
        const transportEntry = transportEntryMap[subgraphName];
        // eslint-disable-next-line no-inner-declarations
        function wrapExecutorWithHooks(currentExecutor: Executor) {
          if (onSubgraphExecuteHooks.length) {
            return async function executorWithHooks(subgraphExecReq: ExecutionRequest) {
              const onSubgraphExecuteDoneHooks: OnSubgraphExecuteDoneHook[] = [];
              for (const onSubgraphExecute of onSubgraphExecuteHooks) {
                const onSubgraphExecuteDoneHook = await onSubgraphExecute({
                  supergraph,
                  subgraphName,
                  transportKind: transportEntry?.kind,
                  transportLocation: transportEntry?.location,
                  transportHeaders: transportEntry?.headers,
                  transportOptions: transportEntry?.options,
                  executionRequest: subgraphExecReq,
                  executor: currentExecutor,
                  setExecutor(newExecutor: Executor) {
                    currentExecutor = newExecutor;
                  },
                });
                if (onSubgraphExecuteDoneHook) {
                  onSubgraphExecuteDoneHooks.push(onSubgraphExecuteDoneHook);
                }
              }
              if (onSubgraphExecuteDoneHooks.length) {
                let currentResult = await currentExecutor(subgraphExecReq);
                for (const onSubgraphExecuteDoneHook of onSubgraphExecuteDoneHooks) {
                  await onSubgraphExecuteDoneHook({
                    result: currentResult as ExecutionResult,
                    setResult(newResult: ExecutionResult) {
                      currentResult = newResult;
                    },
                  });
                }
                return currentResult;
              }
              return currentExecutor(subgraphExecReq);
            };
          }
          return currentExecutor;
        }
        executor = function lazyExecutor(subgraphExecReq: ExecutionRequest) {
          const executor$ = getTransportExecutor(
            transportEntry,
            function getSubgraph() {
              return extractSubgraphFromSupergraph(subgraphName, supergraph);
            },
            subgraphName,
          );
          if (isPromise(executor$)) {
            return executor$.then(executor_ => {
              executor = wrapExecutorWithHooks(executor_);
              executorMap[subgraphName] = executor;
              return executor(subgraphExecReq);
            });
          }
          executor = wrapExecutorWithHooks(executor$);
          executorMap[subgraphName] = executor;
          return executor(subgraphExecReq);
        };
      }
      return executor({ document, variables, context });
    }

    const executablePlan = getMemoizedExecutionPlanForOperation(
      supergraph,
      execReq.document,
      execReq.operationName,
    );

    function handleOpExecResult(opExecRes: ExecutionResult): any {
      if (globalThis.process?.env?.DEBUG) {
        return {
          ...opExecRes,
          extensions: {
            operationPlan: serializeExecutableOperationPlan(executablePlan),
          },
        };
      }
      return opExecRes;
    }
    const opExecRes$ = executeOperationPlan({
      executablePlan,
      onExecute: onSubgraphExecute,
      variables: execReq.variables,
      context: execReq.context,
    });
    if (isPromise(opExecRes$)) {
      return opExecRes$.then(handleOpExecResult);
    }
    return handleOpExecResult(opExecRes$);
  };
}

export interface PlanCache {
  get(documentStr: string): Promise<ExecutableOperationPlan> | ExecutableOperationPlan;
  set(documentStr: string, plan: ExecutableOperationPlan): Promise<any> | any;
}

export interface YogaSupergraphPluginOptions {
  getSupergraph():
    | GraphQLSchema
    | DocumentNode
    | string
    | Promise<GraphQLSchema | string | DocumentNode>;
  getTransportExecutor(
    transportEntry: TransportEntry,
    getSubgraph: () => GraphQLSchema,
    subgraphName: string,
  ): Executor | Promise<Executor>;
  planCache?: PlanCache;
  polling?: number;
}

function ensureSchema(source: GraphQLSchema | DocumentNode | string) {
  if (isSchema(source)) {
    return source;
  }
  if (typeof source === 'string') {
    return buildSchema(source, { noLocation: true, assumeValidSDL: true, assumeValid: true });
  }
  return buildASTSchema(source, { assumeValidSDL: true, assumeValid: true });
}

function getExecuteFnFromExecutor(executor: Executor): typeof execute {
  return function executeFnFromExecutor({
    document,
    variableValues,
    contextValue,
    rootValue,
    operationName,
  }) {
    return executor({
      document,
      variables: variableValues,
      context: contextValue,
      operationName,
      rootValue,
    }) as Promise<ExecutionResult>;
  };
}

export function useSupergraph(
  opts: YogaSupergraphPluginOptions,
): Plugin & { invalidateSupergraph(): void } {
  let supergraph: GraphQLSchema;
  let executeFn: typeof execute;
  let plugins: SupergraphPlugin[];
  function getAndSetSupergraph(): Promise<void> | void {
    const supergraph$ = opts.getSupergraph();
    if (isPromise(supergraph$)) {
      return supergraph$.then(supergraph_ => {
        supergraph = ensureSchema(supergraph_);
        const executor = getExecutorForSupergraph(supergraph, opts.getTransportExecutor, plugins);
        executeFn = getExecuteFnFromExecutor(executor);
      });
    } else {
      supergraph = ensureSchema(supergraph$);
      const executor = getExecutorForSupergraph(supergraph, opts.getTransportExecutor, plugins);
      executeFn = getExecuteFnFromExecutor(executor);
    }
  }
  if (opts.polling) {
    setInterval(getAndSetSupergraph, opts.polling);
  }

  let initialSupergraph$: Promise<void> | void;

  return {
    onYogaInit({ yoga }) {
      plugins = yoga.getEnveloped._plugins as SupergraphPlugin[];
    },
    onRequestParse() {
      return {
        onRequestParseDone() {
          initialSupergraph$ ||= getAndSetSupergraph();
          return initialSupergraph$;
        },
      };
    },
    onEnveloped({ setSchema }: { setSchema: (schema: GraphQLSchema) => void }) {
      setSchema(supergraph);
    },
    onExecute({ setExecuteFn, args, setResultAndStopExecution }) {
      if (args.operationName === 'IntrospectionQuery') {
        setResultAndStopExecution({
          data: introspectionFromSchema(supergraph) as any,
        });
        return;
      }
      setExecuteFn(executeFn);
    },
    invalidateSupergraph() {
      return getAndSetSupergraph();
    },
  };
}

export interface SupergraphPlugin {
  onSubgraphExecute?: OnSubgraphExecuteHook;
}

export type OnSubgraphExecuteHook = (
  payload: OnSupergraphExecutePayload,
) => Promise<OnSubgraphExecuteDoneHook> | OnSubgraphExecuteDoneHook;

export interface OnSupergraphExecutePayload {
  supergraph: GraphQLSchema;
  subgraphName: string;
  transportKind: string;
  transportLocation: string;
  transportHeaders: Record<string, string>;
  transportOptions: any;
  executionRequest: ExecutionRequest;
  executor: Executor;
  setExecutor(executor: Executor): void;
}

export interface OnSubgraphExecuteDonePayload {
  result: ExecutionResult;
  setResult(result: ExecutionResult): void;
}

export type OnSubgraphExecuteDoneHook = (
  payload: OnSubgraphExecuteDonePayload,
) => Promise<void> | void;
