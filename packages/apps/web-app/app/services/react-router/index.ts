import { Context, Layer } from 'effect'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { makeReactRouterRuntime } from '~/effect'
import { Auth0ServiceLive } from '../auth'
import { makeWorkersKVSessionStorageLive } from '../session'

type RequestPrams = Pick<LoaderFunctionArgs & ActionFunctionArgs, 'request' | 'params'>

export class RequestContext extends Context.Tag('RequestContext')<RequestContext, RequestPrams>() {}

export class LoaderContext extends Context.Tag('LoaderContext')<LoaderContext, LoaderFunctionArgs>() {}

export class ActionContext extends Context.Tag('ActionContext')<ActionContext, ActionFunctionArgs>() {}

const SessionServiceLive = makeWorkersKVSessionStorageLive({ kvBindingKey: 'rrv7_session' })
const layer = Layer.mergeAll(SessionServiceLive, Auth0ServiceLive)

export const { effectAction, effectLoader } = makeReactRouterRuntime(layer)
