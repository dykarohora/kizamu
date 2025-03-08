import { Data } from 'effect'

export class DuplicateDeckError extends Data.TaggedError('DuplicateDeckError')<{
  deckId: string
}> {}

