import { Data } from 'effect'

/**
 * 許可されていない操作を試みた場合のエラー
 */
export class ForbiddenError extends Data.TaggedError('ForbiddenError')<{ message: string }> {}
