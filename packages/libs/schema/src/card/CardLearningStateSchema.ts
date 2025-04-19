import { Schema } from 'effect'

/**
 * カード学習状況集約のスキーマ定義
 * 学習状況は独立した集約ルートとして扱う
 */
export const CardLearningStateSchema = Schema.Struct({
  cardId: Schema.NonEmptyString,
  studiedBy: Schema.NonEmptyString,
  easeFactor: Schema.Number.pipe(Schema.greaterThanOrEqualTo(1.3)),
  interval: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
  nextStudyDate: Schema.DateFromSelf,
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
})

/**
 * カード学習状況集約の型定義
 */
export type CardLearningState = Schema.Schema.Type<typeof CardLearningStateSchema>
