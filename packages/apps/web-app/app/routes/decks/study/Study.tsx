import { type Card, CardSchema } from '@kizamu/schema'
import { Effect, Schema } from 'effect'
import { data, redirect, useFetcher } from 'react-router'
import { css } from 'styled-system/css'
import { effectAction, effectLoader, getFormData } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { HonoClientService } from '~/services/hono-client/index.server'
import { ActionContext, LoaderContext } from '~/services/react-router/index.server'
import { Button } from '~/shared/components/ui/button'
import { LinkButton } from '~/shared/components/ui/link-button'
import type { Route } from './+types/Study'
import { useStudySession } from './hooks/useStudySession'

// 学習結果送信用のフォームスキーマ
const studyFormSchema = Schema.Struct({
  cardId: Schema.String,
  grade: Schema.String,
})

/**
 * 学習画面のデータローダー
 * @description
 * - ユーザーの認証状態を確認し、未認証の場合はホームページにリダイレクト
 * - デッキIDを使用して、学習対象のカード一覧を取得する
 *
 * @throws {Error} APIリクエストが失敗した場合
 * @returns {Promise<{ studyCards: Array<Card>, deckId: string }>} 学習対象カード情報とデッキID
 */
export const loader = effectLoader(
  Effect.gen(function* () {
    // 認証関連のサービスを取得
    const { requireAuth, getAccessToken } = yield* OAuth2Service
    yield* requireAuth('/')

    const { params } = yield* LoaderContext
    // アクセストークンを取得してAPIクライアントを初期化
    const { accessToken, setCookieHeaderValue } = yield* getAccessToken
    const hc = yield* HonoClientService

    // パラメータからデッキIDを取得
    const deckId = params.deckId
    if (!deckId) {
      return yield* Effect.fail(new Error('デッキIDが指定されていません'))
    }

    // 学習対象カードを取得
    const studyCardsResponse = yield* Effect.promise(async () =>
      hc.decks[':deckId'].study.cards.$get(
        { param: { deckId }, query: { limit: '20' } },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    )

    if (studyCardsResponse.status !== 200) {
      const error = yield* Effect.promise(async () => await studyCardsResponse.json())
      return yield* Effect.fail(error)
    }

    const { cards } = yield* Effect.promise(async () => await studyCardsResponse.json())

    return yield* Effect.succeed(
      data(
        { studyCards: cards.map((card) => Schema.decodeUnknownSync(CardSchema)(card)), deckId },
        { ...(setCookieHeaderValue !== undefined && { headers: { 'Set-Cookie': setCookieHeaderValue } }) },
      ),
    )
  }),
)

/**
 * 学習結果の記録アクション
 * @description
 * - カードの学習結果をAPIに送信
 * - 送信データ: grade(評価)とstudiedAt(学習日時)
 * - 学習日時はサーバー側で生成する
 *
 * @returns {Promise<{ success: boolean }>} 成功・失敗の結果
 */
export const action = effectAction(
  Effect.gen(function* () {
    console.log('call server study action')
    // 認証関連のサービスを取得
    const { requireAuth, getAccessToken } = yield* OAuth2Service
    yield* requireAuth('/')

    const { params } = yield* ActionContext
    // アクセストークンを取得
    const { accessToken, setCookieHeaderValue } = yield* getAccessToken
    const hc = yield* HonoClientService

    console.log('accessToken:', accessToken)

    // デッキIDとカードIDを取得
    const deckId = params.deckId

    if (!deckId) {
      return yield* Effect.succeed(
        data(
          {
            success: false as const,
            error: { code: 'INVALID_PARAMS', message: 'デッキIDまたはカードIDが指定されていません' },
          },
          400,
        ),
      )
    }

    // フォームデータを取得
    const { cardId, grade } = yield* getFormData(studyFormSchema)

    // 学習結果をAPIに送信
    const response = yield* Effect.promise(async () =>
      hc.decks[':deckId'].cards[':cardId'].study.$post(
        {
          param: { deckId, cardId },
          json: { grade: Number.parseInt(grade), studiedAt: new Date().toISOString() },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    )

    if (response.status === 200) {
      const result = yield* Effect.promise(async () => await response.json())
      return yield* Effect.succeed(
        data(
          { success: true as const, result, cardId },
          { ...(setCookieHeaderValue !== undefined && { headers: { 'Set-Cookie': setCookieHeaderValue } }) },
        ),
      )
    }

    const error = yield* Effect.promise(async () => await response.json())
    return yield* Effect.succeed(data({ success: false as const, error }, 400))
  }),
)

let initialRequest = true
let loaderData: { studyCards: Card[]; deckId: string }

export const clientAction = async ({ serverAction, request }: Route.ClientActionArgs) => {
  const url = new URL(request.url)
  const completed = url.searchParams.get('completed')

  if (completed) {
    initialRequest = true
    return redirect('/dashboard')
  }

  return await serverAction()
}

export const clientLoader = async ({ serverLoader }: Route.ClientLoaderArgs) => {
  if (initialRequest) {
    initialRequest = false
    loaderData = await serverLoader()
    return loaderData
  }

  if (initialRequest === false && loaderData) {
    return loaderData
  }

  return await serverLoader()
}
clientLoader.hydrate = true as const

/**
 * 学習画面コンポーネント
 * @description
 * フラッシュカードの学習機能を提供する画面
 * - カードの表面・裏面の表示切り替え
 * - 学習進捗の記録と表示
 * - 自己評価による学習効果の最適化
 */
const Study = ({ loaderData: { studyCards, deckId } }: Route.ComponentProps) => {
  // useStudySessionフックを使用して学習状態を管理
  const { currentCard, currentIndex, isFlipped, isCompleted, totalCards, progress, flipCard, submitGrade } =
    useStudySession({ cards: studyCards })

  const fetcher = useFetcher()

  // キーボードでカードを裏返す処理
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      flipCard()
    }
  }

  // カードがない場合
  if (studyCards.length === 0) {
    return (
      <div className={css({ padding: '6', textAlign: 'center' })}>
        <p>学習対象のカードがありません。</p>
        <LinkButton to="/dashboard" variant="solid" size="md">
          デッキ一覧に戻る
        </LinkButton>
      </div>
    )
  }

  // 学習完了時
  if (isCompleted) {
    return (
      <div className={css({ padding: '6', maxWidth: '600px', margin: '0 auto', textAlign: 'center' })}>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: '6' })}>
          すべてのカードの学習が完了しました！🎉
        </h1>
        <p className={css({ mb: '8' })}>お疲れ様でした！学習結果は記録されました。</p>
        <fetcher.Form method="post" action={`/decks/${deckId}/study?completed=true`}>
          <Button>デッキ一覧に戻る</Button>
        </fetcher.Form>
      </div>
    )
  }

  return (
    <div className={css({ padding: '6', maxWidth: '1200px', margin: '0 auto' })}>
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: '4' })}>学習中</h1>

      {/* 進捗表示 */}
      <div className={css({ mb: '6' })}>
        <div className={css({ display: 'flex', justifyContent: 'space-between', mb: '2' })}>
          <p>
            進捗: {currentIndex} / {totalCards}
          </p>
          <p>{Math.round(progress)}%</p>
        </div>
        <div className={css({ w: '100%', h: '8px', bg: 'gray.100', borderRadius: 'full', overflow: 'hidden' })}>
          <div
            className={css({
              h: '100%',
              bg: 'colorPalette.default',
              transition: 'width 0.3s ease-in-out',
            })}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* カード表示エリア */}
      <Button
        variant="outline"
        className={css({
          minHeight: '300px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          mb: '6',
          padding: '6',
          borderRadius: 'md',
        })}
        onClick={flipCard}
        onKeyDown={handleKeyPress}
        disabled={submitGrade.state !== 'idle'}
      >
        <div className={css({ fontSize: 'xl', textAlign: 'center' })}>
          {isFlipped ? currentCard?.backContent : currentCard?.frontContent}
        </div>
        <div className={css({ mt: '4', fontSize: 'sm', color: 'fg.muted' })}>
          {isFlipped ? '（クリックして表面に戻る）' : '（クリックして裏面を見る）'}
        </div>
      </Button>

      {/* 評価ボタンエリア - カードを裏返した時のみ表示 */}
      {isFlipped && (
        <div className={css({ display: 'flex', justifyContent: 'center', gap: '4' })}>
          <submitGrade.Form method="post" action={`/decks/${deckId}/study`}>
            <input type="hidden" name="grade" value="0" />
            <input type="hidden" name="cardId" value={currentCard?.id} />
            <Button
              type="submit"
              variant="solid"
              colorPalette="red"
              size="md"
              className={css({ minWidth: '100px' })}
              disabled={submitGrade.state !== 'idle'}
              loading={submitGrade.state === 'submitting'}
            >
              やり直し
            </Button>
          </submitGrade.Form>

          <submitGrade.Form method="post" action={`/decks/${deckId}/study`}>
            <input type="hidden" name="grade" value="1" />
            <input type="hidden" name="cardId" value={currentCard?.id} />
            <Button
              type="submit"
              variant="solid"
              colorPalette="orange"
              size="md"
              className={css({ minWidth: '100px' })}
              disabled={submitGrade.state !== 'idle'}
              loading={submitGrade.state === 'submitting'}
            >
              難しい
            </Button>
          </submitGrade.Form>

          <submitGrade.Form method="post" action={`/decks/${deckId}/study`}>
            <input type="hidden" name="grade" value="2" />
            <input type="hidden" name="cardId" value={currentCard?.id} />
            <Button
              type="submit"
              variant="solid"
              colorPalette="blue"
              size="md"
              className={css({ minWidth: '100px' })}
              disabled={submitGrade.state !== 'idle'}
              loading={submitGrade.state === 'submitting'}
            >
              簡単
            </Button>
          </submitGrade.Form>

          <submitGrade.Form method="post" action={`/decks/${deckId}/study`}>
            <input type="hidden" name="grade" value="3" />
            <input type="hidden" name="cardId" value={currentCard?.id} />
            <Button
              type="submit"
              variant="solid"
              colorPalette="green"
              size="md"
              className={css({ minWidth: '100px' })}
              disabled={submitGrade.state !== 'idle'}
              loading={submitGrade.state === 'submitting'}
            >
              完璧
            </Button>
          </submitGrade.Form>
        </div>
      )}
    </div>
  )
}

export default Study
