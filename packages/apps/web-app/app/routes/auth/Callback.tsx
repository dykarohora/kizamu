import { Effect } from 'effect'
import { OAuth2Service } from '~/services/auth/index.server'
import { effectLoader } from '~/services/react-router/index.server'

export const loader = effectLoader(
  Effect.gen(function* () {
    const { authenticate } = yield* OAuth2Service
    return yield* authenticate('/secret')
  }),
)
