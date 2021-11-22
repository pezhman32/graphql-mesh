---
title: 'Config'
---

# Interface: Config

[types/src](../modules/types_src).[YamlConfig](../modules/types_src.YamlConfig).Config

This file was automatically generated by json-schema-to-typescript.
DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
and run json-schema-to-typescript to regenerate this file.

## Table of contents

### Properties

- [additionalResolvers](types_src.YamlConfig.Config#additionalresolvers)
- [additionalTypeDefs](types_src.YamlConfig.Config#additionaltypedefs)
- [cache](types_src.YamlConfig.Config#cache)
- [documents](types_src.YamlConfig.Config#documents)
- [liveQueryInvalidations](types_src.YamlConfig.Config#livequeryinvalidations)
- [logger](types_src.YamlConfig.Config#logger)
- [merger](types_src.YamlConfig.Config#merger)
- [pubsub](types_src.YamlConfig.Config#pubsub)
- [require](types_src.YamlConfig.Config#require)
- [sdk](types_src.YamlConfig.Config#sdk)
- [serve](types_src.YamlConfig.Config#serve)
- [skipSSLValidation](types_src.YamlConfig.Config#skipsslvalidation)
- [sources](types_src.YamlConfig.Config#sources)
- [transforms](types_src.YamlConfig.Config#transforms)

## Properties

### additionalResolvers

• `Optional` **additionalResolvers**: (`string` \| [`AdditionalStitchingResolverObject`](types_src.YamlConfig.AdditionalStitchingResolverObject) \| [`AdditionalStitchingBatchResolverObject`](types_src.YamlConfig.AdditionalStitchingBatchResolverObject) \| [`AdditionalSubscriptionObject`](types_src.YamlConfig.AdditionalSubscriptionObject))[]

Additional resolvers, or resolvers overrides you wish to add to the schema mesh (Any of: String, AdditionalStitchingResolverObject, AdditionalStitchingBatchResolverObject, AdditionalSubscriptionObject)

#### Defined in

[packages/types/src/config.ts:27](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L27)

___

### additionalTypeDefs

• `Optional` **additionalTypeDefs**: `any`

Additional type definitions, or type definitions overrides you wish to add to the schema mesh

#### Defined in

[packages/types/src/config.ts:23](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L23)

___

### cache

• `Optional` **cache**: [`Cache`](types_src.YamlConfig.Cache)

#### Defined in

[packages/types/src/config.ts:33](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L33)

___

### documents

• `Optional` **documents**: `string`[]

Provide a query or queries for GraphQL Playground, validation and SDK Generation
The value can be the file path, glob expression for the file paths or the SDL.
(.js, .jsx, .graphql, .gql, .ts and .tsx files are supported.
But TypeScript support is only available if `ts-node` is installed and `ts-node/register` is added under `require` parameter)

#### Defined in

[packages/types/src/config.ts:52](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L52)

___

### liveQueryInvalidations

• `Optional` **liveQueryInvalidations**: [`LiveQueryInvalidation`](types_src.YamlConfig.LiveQueryInvalidation)[]

Live Query Invalidations

#### Defined in

[packages/types/src/config.ts:45](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L45)

___

### logger

• `Optional` **logger**: `any`

Logger instance that matches `Console` interface of NodeJS

#### Defined in

[packages/types/src/config.ts:56](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L56)

___

### merger

• `Optional` **merger**: `string`

Merge method

#### Defined in

[packages/types/src/config.ts:37](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L37)

___

### pubsub

• `Optional` **pubsub**: `string` \| [`PubSubConfig`](types_src.YamlConfig.PubSubConfig)

PubSub Implementation (Any of: String, PubSubConfig)

#### Defined in

[packages/types/src/config.ts:41](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L41)

___

### require

• `Optional` **require**: `string`[]

#### Defined in

[packages/types/src/config.ts:11](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L11)

___

### sdk

• `Optional` **sdk**: [`SDKConfig`](types_src.YamlConfig.SDKConfig)

#### Defined in

[packages/types/src/config.ts:10](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L10)

___

### serve

• `Optional` **serve**: [`ServeConfig`](types_src.YamlConfig.ServeConfig)

#### Defined in

[packages/types/src/config.ts:9](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L9)

___

### skipSSLValidation

• `Optional` **skipSSLValidation**: `boolean`

Allow connections to an SSL endpoint without certificates

#### Defined in

[packages/types/src/config.ts:60](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L60)

___

### sources

• **sources**: [`Source`](types_src.YamlConfig.Source)[]

Defines the list of your external data sources for your API mesh

#### Defined in

[packages/types/src/config.ts:15](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L15)

___

### transforms

• `Optional` **transforms**: [`Transform`](types_src.YamlConfig.Transform)[]

Transform to apply to the unified mesh schema

#### Defined in

[packages/types/src/config.ts:19](https://github.com/Urigo/graphql-mesh/blob/master/packages/types/src/config.ts#L19)