import { Data } from 'effect'

export class NotFoundUserError extends Data.TaggedError('NotFoundUserError')<{
  userId: string
}> {}

export class DuplicateUserError extends Data.TaggedError('DuplicateUserError')<{
  userId: string
}> {}
