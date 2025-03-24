import type { Context } from 'hono'
import type { hc } from 'hono/client'
import type { SessionData, SessionStorage } from 'react-router'
import type { PlatformProxy } from 'wrangler'
import type { ApiServerType } from '../api-server/src/index'

// export type HonoType = unknown
export type HonoClient = ReturnType<typeof hc<ApiServerType>>

export type WorkersEnv = {
  Bindings: {
    kizamu_session: KVNamespace
    NODE_ENV: string
    SERVER: Fetcher
  }
  Variables: {
    SESSION_STORAGE: SessionStorage<SessionData, SessionData>
    HONO_CLIENT: HonoClient
  }
}

type GetLoadContextArgs = {
  request: Request
  context: {
    cloudflare: Omit<PlatformProxy<WorkersEnv['Bindings']>, 'dispose' | 'caches' | 'cf'> & {
      caches: PlatformProxy<WorkersEnv>['caches'] | CacheStorage
      cf: Request['cf']
    }
    hono: {
      context: Context<WorkersEnv>
    }
  }
}

declare module 'react-router' {
  interface AppLoadContext extends ReturnType<typeof getLoadContext> {
    // This will merge the result of `getLoadContext` into the `AppLoadContext`
    extra: string
    hono: {
      context: Context<WorkersEnv>
    }
  }
}

export function getLoadContext({ context }: GetLoadContextArgs) {
  return {
    ...context,
    extra: 'stuff',
  }
}
