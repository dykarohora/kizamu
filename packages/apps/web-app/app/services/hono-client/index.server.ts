import type { ApiServerType } from '@api-types/types'
import { Context, Layer } from 'effect'
import { hc } from 'hono/client'

type HonoClient = ReturnType<typeof hc<ApiServerType>>

export class HonoClientService extends Context.Tag('HonoClientService')<HonoClientService, HonoClient>() {}

export const HonoClientServiceLive = Layer.suspend(() =>
  Layer.succeed(
    HonoClientService,
    // hc<ApiServerType>(new URL('/api', 'http://localhost:8787').toString(), {
    //   fetch: process.env.SERVER.fetch.bind(process.env.SERVER)
    // }),
    hc<ApiServerType>(new URL('/api', 'http://localhost:8787').toString(), {}),
  ),
)
