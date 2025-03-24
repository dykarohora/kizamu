import { Context, Effect, Layer, Schema, pipe } from 'effect'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { makeReactRouterRuntime } from '../../effect/index.server'
import { Auth0ServiceLive } from '../auth/index.server'
import { HonoClientServiceLive } from '../hono-client/index.server'
import { makeWorkersKVSessionStorageLive } from '../session/index.server'

type RequestPrams = Pick<LoaderFunctionArgs & ActionFunctionArgs, 'request' | 'params'>

export class RequestContext extends Context.Tag('RequestContext')<RequestContext, RequestPrams>() {}

export class LoaderContext extends Context.Tag('LoaderContext')<LoaderContext, LoaderFunctionArgs>() {}

export class ActionContext extends Context.Tag('ActionContext')<ActionContext, ActionFunctionArgs>() {}

const SessionServiceLive = makeWorkersKVSessionStorageLive({ kvBindingKey: 'kizamu_session' })
const layer = Layer.mergeAll(SessionServiceLive, Auth0ServiceLive, HonoClientServiceLive)

export const { effectAction, effectLoader } = makeReactRouterRuntime(layer)

export const getFormDataEntries = pipe(
  ActionContext,
  Effect.flatMap(({ request }) => Effect.promise(() => request.formData())),
  Effect.map((formData) => Object.fromEntries(formData)),
)

export const getFormData = <T>(schema: Schema.Schema<T>) =>
  pipe(
    getFormDataEntries,
    Effect.flatMap((entries) => Schema.validate(schema)(entries)),
  )
