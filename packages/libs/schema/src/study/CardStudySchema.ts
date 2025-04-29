import { Schema } from 'effect'

/**
 * 学習理解度を表す型
 * 0: 全然わからなかった（完全に忘れていた）
 * 1: なんとなく思い出せた（ヒントあり）
 * 2: 思い出せたけど時間がかかった
 * 3: すぐに思い出せた（完璧）
 */
export const GradeSchema = Schema.Number.pipe(Schema.int(), Schema.between(0, 3))

/**
 * 学習進捗情報を表すスキーマ
 * SM-2アルゴリズムによる計算結果を格納
 */
export const LearningProgressSchema = Schema.Struct({
  // 難易度係数（1.3～2.5の範囲）
  easeFactor: Schema.Number.pipe(Schema.greaterThanOrEqualTo(1.3), Schema.lessThanOrEqualTo(2.5)),
  // 次回学習までの間隔（日数）
  interval: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
  // 次回学習予定日
  nextStudyDate: Schema.DateFromSelf,
})

/**
 * カード学習を表すドメインオブジェクトのスキーマ
 * 学習イベントと学習状態の両方の情報を含む
 */
export const CardStudySchema = Schema.Struct({
  // 学習イベントの一意識別子
  id: Schema.NonEmptyString,
  // 学習したカードのID
  cardId: Schema.NonEmptyString,
  // 学習したユーザーのID
  studiedBy: Schema.NonEmptyString,
  // デッキID（学習イベント記録用）
  deckId: Schema.NonEmptyString,
  // 学習した日時
  studiedAt: Schema.DateFromSelf,
  // 理解度評価（0-3の整数）
  grade: GradeSchema,
  // 学習進捗情報
  learningProgress: LearningProgressSchema,
})

/**
 * カード学習ドメインオブジェクトの型
 */
export type CardStudy = Schema.Schema.Type<typeof CardStudySchema>

/**
 * 学習理解度の型
 */
export type Grade = Schema.Schema.Type<typeof GradeSchema>

/**
 * 学習進捗情報の型
 */
export type LearningProgress = Schema.Schema.Type<typeof LearningProgressSchema>
