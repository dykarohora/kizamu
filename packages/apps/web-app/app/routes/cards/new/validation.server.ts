import { Effect, Either, Schema } from 'effect'

/**
 * カード作成フォームのスキーマ定義
 * @description
 * - front: カードの表面（必須）
 * - back: カードの裏面（必須）
 * - tags: カードのタグ（任意）
 */
export const formSchema = Schema.Struct({
  frontContent: Schema.String,
  backContent: Schema.String,
  tags: Schema.optional(Schema.String),
})

/**
 * フォームの入力値の型定義
 * @description スキーマから生成される型
 */
export type FormInput = Schema.Schema.Type<typeof formSchema>

/**
 * バリデーションエラーの型定義
 * @description
 * 各フィールドのエラーメッセージを格納するオブジェクト
 * - front?: 表面のエラーメッセージ
 * - back?: 裏面のエラーメッセージ
 * - tags?: タグのエラーメッセージ
 */
export type FormErrors = {
  frontContent?: string
  backContent?: string
  tags?: string
}

/**
 * カード作成フォームのバリデーション関数
 * @description
 * フォームの入力値を検証し、以下の条件をチェック：
 * - 表面が空でないこと（空白文字を除く）
 * - 裏面が空でないこと（空白文字を除く）
 * - タグは任意だが、入力された場合は正しいフォーマットであること
 *
 * @param input - フォームの入力値
 * @param input.front - カードの表面
 * @param input.back - カードの裏面
 * @param input.tags - カードのタグ（カンマ区切り）
 * @returns Effect<Either<void, FormErrors>>
 * - Either.right(void): バリデーション成功
 * - Either.left(FormErrors): バリデーション失敗時のエラー情報
 */
export const validateCardForm = ({
  frontContent,
  backContent,
}: FormInput): Effect.Effect<Either.Either<void, FormErrors>> =>
  Effect.sync(() =>
    frontContent.trim() === '' || backContent.trim() === ''
      ? Either.left({
          ...(frontContent.trim() === '' && { frontContent: 'カードの表面を入力してください' }),
          ...(backContent.trim() === '' && { backContent: 'カードの裏面を入力してください' }),
        })
      : Either.void,
  )
