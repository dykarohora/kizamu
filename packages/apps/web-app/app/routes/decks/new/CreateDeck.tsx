import { Effect, Either } from 'effect'
import { useCallback } from 'react'
import { data, redirect, useNavigate } from 'react-router'
import { css } from 'styled-system/css'
import { effectAction, effectLoader, getFormData } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { HonoClientService } from '~/services/hono-client/index.server'
import type { Route } from './+types/CreateDeck'
import { CreateDeckForm } from './components/CreateDeckForm'
import { CreateDeckHint } from './components/CreateDeckHint'
import { formSchema, validateDeckForm } from './validation.server'

/**
 * 新規デッキ作成ページのデータローダー
 * @description
 * 以下の処理を実行：
 * 1. ユーザーの認証状態を確認
 * 2. 未認証の場合はホームページにリダイレクト
 * 3. 認証済みの場合、デッキ作成フォームを表示
 *
 * @returns Effect<データなし>
 * @throws 認証エラー時はリダイレクトレスポンス
 */
export const loader = effectLoader(
  Effect.gen(function* () {
    // 認証関連のサービスを取得
    const { requireAuth } = yield* OAuth2Service
    yield* requireAuth('/')

    return yield* Effect.succeed(data({}))
  }),
)

/**
 * デッキ作成フォームの送信処理
 * @description
 * 以下の処理を実行：
 * 1. ユーザーの認証確認
 * 2. フォームデータのバリデーション
 * 3. APIを使用したデッキの作成
 * 4. 作成成功時はダッシュボードへリダイレクト
 *
 * @returns Effect<データ | リダイレクト>
 * @throws 認証エラーまたはAPIエラー
 */
export const action = effectAction(
  Effect.gen(function* () {
    const { requireAuth, getAccessToken } = yield* OAuth2Service
    yield* requireAuth('/')

    const formData = yield* getFormData(formSchema)
    const validationResult = yield* validateDeckForm(formData)

    if (Either.isLeft(validationResult)) {
      return yield* Effect.succeed(data({ errors: validationResult.left }, 400))
    }

    const { accessToken, setCookieHeaderValue } = yield* getAccessToken
    const hc = yield* HonoClientService

    const response = yield* Effect.promise(async () =>
      hc.decks.$post(
        { json: { name: formData.name.trim(), description: formData.description.trim() } },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    )

    if (response.status === 201) {
      return yield* Effect.succeed(
        redirect('/dashboard', {
          ...(setCookieHeaderValue !== undefined && {
            headers: { 'Set-Cookie': setCookieHeaderValue },
          }),
        }),
      )
    }

    const error = yield* Effect.promise(async () => await response.json())
    return yield* Effect.fail(error)
  }),
)

/**
 * 新規デッキ作成ページコンポーネント
 * @description
 * デッキ作成に必要な以下の要素を提供：
 * - ページヘッダー（戻るボタン付き）
 * - デッキ作成フォーム
 * - 使い方のヒント
 *
 * @example
 * ```tsx
 * <CreateDeck />
 * ```
 */
const CreateDeck = (_: Route.ComponentProps) => {
  const navigate = useNavigate()
  const handleCancel = useCallback(() => navigate('/dashboard'), [navigate])

  return (
    <div className={css({ padding: '6', maxWidth: '800px', margin: '0 auto' })}>
      {/* ページヘッダー */}
      <div
        className={css({
          mb: '8',
          display: 'flex',
          alignItems: 'center',
          gap: '2',
        })}
      >
        <h1
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
          })}
        >
          新規デッキ作成
        </h1>
      </div>

      {/* メインコンテンツ */}
      <div className={css({ backgroundColor: 'white', borderRadius: 'lg', p: '6', boxShadow: 'sm' })}>
        <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: '6' })}>デッキ情報</h2>

        <div className={css({ mb: '8' })}>
          <CreateDeckForm onCancel={handleCancel} />
        </div>

        <CreateDeckHint />
      </div>
    </div>
  )
}

export default CreateDeck
