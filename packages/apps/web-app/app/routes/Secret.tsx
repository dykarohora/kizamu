import { Effect, Schema } from 'effect'
import { data } from 'react-router'
import { effectAction, effectLoader, getFormData } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { HonoClientService } from '~/services/hono-client/index.server'
import { Button } from '~/shared/components/ui/button'
import type { Route } from './+types/Secret'

export const loader = effectLoader(
  Effect.gen(function* () {
    const { requireAuth, getAccessToken } = yield* OAuth2Service
    yield* requireAuth('/')

    const { accessToken } = yield* getAccessToken

    const hc = yield* HonoClientService

    const result = yield* Effect.promise(async () =>
      hc.decks.$get({ query: { limit: '1' } }, { headers: { Authorization: `Bearer ${accessToken}` } }),
    )

    if (result.status === 200) {
      const decks = yield* Effect.promise(async () => await result.json())
      console.log(decks)
    } else {
      const error = yield* Effect.promise(async () => await result.json())
      console.log(error)
    }
    return yield* Effect.succeed(data({ isAuthenticated: true }))
  }),
)

export const action = effectAction(
  Effect.gen(function* () {
    const { logout } = yield* OAuth2Service
    const schema = Schema.Struct({
      _action: Schema.Union(Schema.Literal('logout'), Schema.Literal('access-token'), Schema.Literal('refresh-token')),
    })
    const { _action } = yield* getFormData(schema)
    switch (_action) {
      case 'logout': {
        return yield* logout('/')
      }
      // case 'access-token': {
      //   const { accessToken, setCookieHeaderValue } = yield* getAccessToken
      //   console.log(accessToken)

      //   return setCookieHeaderValue
      //     ? yield* Effect.succeed(
      //         data({ message: 'Access Token' }, { headers: { 'Set-Cookie': setCookieHeaderValue } }),
      //       )
      //     : yield* Effect.succeed(data({ message: 'Access Token' }))
      // }
      // case 'refresh-token': {
      //   const { accessToken, setCookieHeaderValue } = yield* refreshAccessToken
      //   console.log(accessToken)
      //   return yield* Effect.succeed(
      //     data({ message: 'Refresh Token' }, { headers: { 'Set-Cookie': setCookieHeaderValue } }),
      //   )
      // }
      // default:
      //   throw new Error(`invalid action ${_action satisfies never}`)
    }
  }),
)

const Secret = ({ loaderData: { isAuthenticated }, actionData }: Route.ComponentProps) => {
  console.log(`actionData: ${JSON.stringify(actionData)}`)
  return (
    <div>
      <h1>Secret</h1>
      {isAuthenticated ? <div>Authenticated</div> : <div>Not Authenticated</div>}
      <div>
        <form action="/secret" method="post">
          <input type="hidden" name="_action" value="logout" />
          <Button type="submit">Logout</Button>
        </form>
        <form action="/secret" method="post">
          <input type="hidden" name="_action" value="access-token" />
          <Button type="submit">Get Access Token</Button>
        </form>
        <form action="/secret" method="post">
          <input type="hidden" name="_action" value="refresh-token" />
          <Button type="submit">Refresh Token</Button>
        </form>
      </div>
    </div>
  )
}

export default Secret
