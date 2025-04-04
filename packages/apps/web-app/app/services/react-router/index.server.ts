import { Context } from 'effect'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'

type RequestPrams = Pick<LoaderFunctionArgs & ActionFunctionArgs, 'request' | 'params'>

export class RequestContext extends Context.Tag('RequestContext')<RequestContext, RequestPrams>() {}

export class LoaderContext extends Context.Tag('LoaderContext')<LoaderContext, LoaderFunctionArgs>() {}

export class ActionContext extends Context.Tag('ActionContext')<ActionContext, ActionFunctionArgs>() {}
