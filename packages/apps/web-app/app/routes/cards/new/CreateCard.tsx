import { Effect, Either } from 'effect'
import { data, redirect } from 'react-router'
import { css } from 'styled-system/css'
import { effectAction, effectLoader, getFormData } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { HonoClientService } from '~/services/hono-client/index.server'
import { ActionContext, LoaderContext } from '~/services/react-router/index.server'
import type { Route } from './+types/CreateCard'
import { CreateCardForm } from './components/CreateCardForm'
import { CreateCardHint } from './components/CreateCardHint'
import { formSchema, validateCardForm } from './validation.server'
/**
 * 新規カード作成ページのデータローダー
 * @description
 * 以下の処理を実行：
 * 1. ユーザーの認証状態を確認
 * 2. 未認証の場合はホームページにリダイレクト
 * 3. URLからデッキIDを取得
 * 4. デッキの存在確認（オプション）
 * 5. 認証済みの場合、カード作成フォームを表示
 *
 * @returns Effect<deckId>
 * @throws 認証エラー時はリダイレクトレスポンス
 */
export const loader = effectLoader(
  Effect.gen(function* (_) {
    // 認証関連のサービスを取得
    const { requireAuth } = yield* OAuth2Service
    yield* requireAuth('/')

    // URLからデッキIDを取得
    const { params } = yield* LoaderContext
    const deckId = params.deckId

    if (!deckId) {
      return yield* Effect.succeed(redirect('/dashboard'))
    }

    return yield* Effect.succeed(data({ deckId }))
  }),
)

/**
 * カード作成フォームの送信処理
 * @description
 * 以下の処理を実行：
 * 1. ユーザーの認証確認
 * 2. フォームデータのバリデーション
 * 3. APIを使用したカードの作成
 * 4. 作成成功時はデッキ詳細ページへリダイレクト
 *
 * @returns Effect<データ | リダイレクト>
 * @throws 認証エラーまたはAPIエラー
 */
export const action = effectAction(
  Effect.gen(function* () {
    const { requireAuth, getAccessToken } = yield* OAuth2Service
    yield* requireAuth('/')

    const formData = yield* getFormData(formSchema)
    const validationResult = yield* validateCardForm(formData)

    if (Either.isLeft(validationResult)) {
      return yield* Effect.succeed(data({ errors: validationResult.left }, 400))
    }

    const { params } = yield* ActionContext
    const deckId = params.deckId

    if (!deckId) {
      return yield* Effect.succeed(redirect('/dashboard'))
    }

    const { accessToken, setCookieHeaderValue } = yield* getAccessToken
    const hc = yield* HonoClientService

    const response = yield* Effect.promise(async () =>
      hc.decks[':deckId'].cards.$post(
        {
          param: { deckId },
          json: { frontContent: formData.frontContent.trim(), backContent: formData.backContent.trim() },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    )

    if (response.status === 201) {
      return yield* Effect.succeed(
        redirect(`/decks/${deckId}`, {
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
 * 新規カード作成ページコンポーネント
 * @description
 * カード作成に必要な以下の要素を提供：
 * - ページヘッダー
 * - カード作成フォーム
 * - 使い方のヒント
 *
 * @example
 * ```tsx
 * <CreateCard />
 * ```
 */
const CreateCard = ({ loaderData: { deckId } }: Route.ComponentProps) => (
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
        新規カード作成
      </h1>
    </div>

    {/* メインコンテンツ */}
    <div className={css({ backgroundColor: 'white', borderRadius: 'lg', p: '6', boxShadow: 'sm' })}>
      <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: '6' })}>カード情報</h2>

      <div className={css({ mb: '8' })}>
        <CreateCardForm deckId={deckId} />
      </div>

      <CreateCardHint />
    </div>
  </div>
)

export default CreateCard
