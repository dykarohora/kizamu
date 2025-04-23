import { Effect, Layer, Schema, pipe } from 'effect'
import { Auth0ServiceLive } from '~/services/auth/index.server'
import { HonoClientServiceLive } from '~/services/hono-client/index.server'
import { ActionContext } from '~/services/react-router/index.server'
import { makeWorkersKVSessionStorageLive } from '~/services/session/index.server'
import { makeReactRouterRuntime } from './makeReactRouterRuntime.server'

const SessionServiceLive = makeWorkersKVSessionStorageLive({ kvBindingKey: 'kizamu_session' })
// const SessionServiceLive = makeCookieSessionStorageLive({
//   cookie: {
//     name: '__kizamu_sid', // セッションIDを保存するCookieの名前
//     secrets: ['secret'], // Cookieの署名に使用する秘密鍵
//     sameSite: 'lax', // CSRF対策のためのSameSite属性
//     httpOnly: true, // JavaScriptからのアクセスを防ぐ
//     secure: false,
//   },
// })

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
