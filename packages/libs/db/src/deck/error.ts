import { Data } from 'effect'

/**
 * デッキが重複している場合のエラー
 */
export class DuplicateDeckError extends Data.TaggedError('DuplicateDeckError')<{
  deckId: string
}> {}

/**
 * デッキが見つからない場合のエラー
 */
export class NotFoundDeckError extends Data.TaggedError('NotFoundDeckError')<{
  deckId: string
}> {}
