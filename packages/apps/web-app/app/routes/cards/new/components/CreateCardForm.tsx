import type { FC } from 'react'
import { useFetcher } from 'react-router'
import { css } from 'styled-system/css'
import { Button } from '~/shared/components/ui/button'
import { LinkButton } from '~/shared/components/ui/link-button'
import * as Field from '~/shared/components/ui/styled/field'
import type { Route } from '../+types/CreateCard'
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
  deckId: string
}

/**
 * カード作成フォームコンポーネント
 * @description
 * カードの新規作成に必要な情報を入力するフォームを提供：
 * - 表面（front）入力フィールド（必須）
 * - 裏面（back）入力フィールド（必須）
 * - タグ入力フィールド（任意）
 * - 保存/キャンセルボタン
 *
 * バリデーションエラーがある場合は、各フィールドの下にエラーメッセージを表示
 *
 * @example
 * ```tsx
 * <CreateCardForm onCancel={() => navigate('/decks/1')} />
 * ```
 */
export const CreateCardForm: FC<Props> = ({ deckId }) => {
  // フォームの状態管理
  const fetcher = useFetcher<ActionData>()
  const errors = fetcher.data?.errors

  return (
    <fetcher.Form method="post">
      <Field.Root className={css({ mb: '6' })} invalid={errors?.frontContent !== undefined}>
        <Field.Label htmlFor="card-front">表面</Field.Label>
        <Field.Textarea
          id="card-front"
          name="frontContent"
          placeholder="カードの表面に表示するテキストを入力"
          rows={3}
          className={css({
            borderColor: errors?.frontContent ? 'red.9' : undefined,
            resize: 'vertical',
          })}
        />
        <Field.HelperText>単語、質問、またはヒントを入力してください</Field.HelperText>
        {errors?.frontContent && <Field.ErrorText>{errors.frontContent}</Field.ErrorText>}
      </Field.Root>

      <Field.Root className={css({ mb: '6' })} invalid={errors?.backContent !== undefined}>
        <Field.Label htmlFor="card-back">裏面</Field.Label>
        <Field.Textarea
          id="card-back"
          name="backContent"
          placeholder="カードの裏面に表示するテキストを入力"
          rows={5}
          className={css({
            borderColor: errors?.backContent ? 'red.9' : undefined,
            resize: 'vertical',
          })}
        />
        <Field.HelperText>答えや説明を入力してください</Field.HelperText>
        {errors?.backContent && <Field.ErrorText>{errors.backContent}</Field.ErrorText>}
      </Field.Root>

      <Field.Root className={css({ mb: '6' })} invalid={errors?.tags !== undefined}>
        <Field.Label htmlFor="card-tags">タグ（任意）</Field.Label>
        <Field.Input
          id="card-tags"
          name="tags"
          placeholder="カンマ区切りでタグを入力（例: 文法, 初級）"
          className={css({
            borderColor: errors?.tags ? 'red.9' : undefined,
          })}
        />
        <Field.HelperText>複数のタグはカンマで区切ってください</Field.HelperText>
        {errors?.tags && <Field.ErrorText>{errors.tags}</Field.ErrorText>}
      </Field.Root>

      <div className={css({ mt: '8', display: 'flex', justifyContent: 'flex-end', gap: '3' })}>
        <LinkButton variant="outline" size="sm" to={`/decks/${deckId}`} viewTransition>
          キャンセル
        </LinkButton>
        <Button type="submit" size="sm">
          保存
        </Button>
      </div>
    </fetcher.Form>
  )
}
