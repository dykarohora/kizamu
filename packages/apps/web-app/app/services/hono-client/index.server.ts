import { Context, Layer } from 'effect'
import { hc } from 'hono/client'
import type { HonoClient } from 'load-context'
import type { ApiServerType } from '../../../../api-server/src'

export class HonoClientService extends Context.Tag('HonoClientService')<HonoClientService, HonoClient>() {}

export const HonoClientServiceLive = Layer.suspend(() =>
  Layer.succeed(
    HonoClientService,
    hc<ApiServerType>(new URL('/api', 'http://local').toString(), {
      fetch: process.bindings.SERVER.fetch.bind(process.bindings.SERVER),
    }),
  ),
)
