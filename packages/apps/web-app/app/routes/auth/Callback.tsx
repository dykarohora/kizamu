import { Effect } from 'effect'
import { effectLoader } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'

export const loader = effectLoader(
  Effect.gen(function* () {
    const { authenticate } = yield* OAuth2Service
    return yield* authenticate('/dashboard')
  }),
)
