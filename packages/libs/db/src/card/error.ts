import { Data } from 'effect'

/**
 * カードが重複している場合のエラー
 */
export class DuplicateCardError extends Data.TaggedError('DuplicateCardError')<{ cardId: string }> {}

/**
 * カードが見つからない場合のエラー
 */
export class NotFoundCardError extends Data.TaggedError('NotFoundCardError')<{ cardId: string }> {}
