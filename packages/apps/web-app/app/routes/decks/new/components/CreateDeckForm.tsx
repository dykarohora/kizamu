import type { FC } from 'react'
import { useFetcher } from 'react-router'
import { css } from 'styled-system/css'
import { Button } from '~/shared/components/ui/button'
import * as Field from '~/shared/components/ui/styled/field'
import type { Route } from '../+types/CreateDeck'

/**
 * アクションデータの型定義
 * @description
 * フォーム送信後のレスポンスデータ型
 * - errors?: バリデーションエラー情報
 */
type ActionData = NonNullable<Route.ComponentProps['actionData']>

/**
 * コンポーネントのプロパティ型定義
 * @description
 * - onCancel: キャンセルボタンクリック時のコールバック関数
 */
type Props = {
  onCancel: () => void
}

/**
 * デッキ作成フォームコンポーネント
 * @description
 * デッキの新規作成に必要な情報を入力するフォームを提供：
 * - タイトル入力フィールド（必須）
 * - 説明文入力フィールド（必須）
 * - 保存/キャンセルボタン
 *
 * バリデーションエラーがある場合は、各フィールドの下にエラーメッセージを表示
 *
 * @example
 * ```tsx
 * <CreateDeckForm onCancel={() => navigate('/dashboard')} />
 * ```
 */
export const CreateDeckForm: FC<Props> = ({ onCancel }) => {
  // フォームの状態管理
  const fetcher = useFetcher<ActionData>()
  const errors = fetcher.data?.errors

  return (
    <fetcher.Form method="post">
      <Field.Root className={css({ mb: '6' })} invalid={errors?.name !== undefined}>
        <Field.Label htmlFor="deck-name">タイトル</Field.Label>
        <Field.Input
          id="deck-name"
          name="name"
          placeholder="デッキのタイトルを入力"
          className={css({
            borderColor: errors?.name ? 'red.9' : undefined,
          })}
        />
        {errors?.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
      </Field.Root>

      <Field.Root className={css({ mb: '6' })} invalid={errors?.description !== undefined}>
        <Field.Label htmlFor="deck-description">説明</Field.Label>
        <Field.Textarea
          id="deck-description"
          name="description"
          placeholder="デッキの説明を入力（任意）"
          rows={5}
          className={css({
            borderColor: errors?.description ? 'red.9' : undefined,
            resize: 'vertical',
          })}
        />
        {errors?.description && <Field.ErrorText>{errors.description}</Field.ErrorText>}
      </Field.Root>

      <div className={css({ mt: '8', display: 'flex', justifyContent: 'flex-end', gap: '3' })}>
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </fetcher.Form>
  )
}
