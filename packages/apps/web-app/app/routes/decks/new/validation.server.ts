import { Effect, Either, Schema } from 'effect'

/**
 * デッキ作成フォームのスキーマ定義
 * @description
 * - name: デッキのタイトル（必須）
 * - description: デッキの説明文（必須）
 */
export const formSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
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
 * - name?: タイトルのエラーメッセージ
 * - description?: 説明文のエラーメッセージ
 */
export type FormErrors = {
  name?: string
  description?: string
}

/**
 * デッキ作成フォームのバリデーション関数
 * @description
 * フォームの入力値を検証し、以下の条件をチェック：
 * - タイトルが空でないこと（空白文字を除く）
 * - 説明文が空でないこと（空白文字を除く）
 *
 * @param input - フォームの入力値
 * @param input.name - デッキのタイトル
 * @param input.description - デッキの説明文
 * @returns Effect<Either<void, FormErrors>>
 * - Either.right(void): バリデーション成功
 * - Either.left(FormErrors): バリデーション失敗時のエラー情報
 */
export const validateDeckForm = ({ name, description }: FormInput): Effect.Effect<Either.Either<void, FormErrors>> =>
  Effect.sync(() =>
    name.trim() === '' || description.trim() === ''
      ? Either.left({
          ...(name.trim() === '' && { name: 'デッキ名を入力してください' }),
          ...(description.trim() === '' && { description: 'デッキの説明文を入力してください' }),
        })
      : Either.void,
  )
