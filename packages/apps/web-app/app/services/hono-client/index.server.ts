import type { ApiServerType } from '@api-types/types'
import { Context, Layer } from 'effect'
import { hc } from 'hono/client'

type HonoClient = ReturnType<typeof hc<ApiServerType>>

export class HonoClientService extends Context.Tag('HonoClientService')<HonoClientService, HonoClient>() {}

export const HonoClientServiceLive = Layer.suspend(() =>
  Layer.succeed(
    HonoClientService,
    // 開発環境では直接APIを叩き、それ以外の環境ではService Bindingを使用
    process.env.NODE_ENV === 'development'
      ? hc<ApiServerType>(new URL('/api', 'http://localhost:8787').toString(), {})
      : hc<ApiServerType>(new URL('/api', 'http://localhost:8787').toString(), {
          // @ts-expect-error
          fetch: process.env.SERVER.fetch.bind(process.env.SERVER),
        }),
  ),
)
