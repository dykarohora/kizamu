import { Data } from 'effect'

export class AuthenticationServiceError extends Data.TaggedError('AuthenticatonServiceError')<{
  message: string
  error?: unknown
}> {}
