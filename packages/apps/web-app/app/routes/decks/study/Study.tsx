import { CardSchema } from '@kizamu/schema'
import { Effect, Schema } from 'effect'
import { data, redirect } from 'react-router'
import { css } from 'styled-system/css'
import { effectAction, effectLoader, getFormData } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { HonoClientService } from '~/services/hono-client/index.server'
import { ActionContext, LoaderContext } from '~/services/react-router/index.server'
import { useEffect } from 'react'
import { StudyProgress } from './components/StudyProgress'
import { FlashCard } from './components/FlashCard'
import { GradeButtons } from './components/GradeButtons'
import { StudyCompletion } from './components/StudyCompletion'
import { EmptyDeck } from './components/EmptyDeck'
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
    // 認証関連のサービスを取得
    const { requireAuth, getAccessToken } = yield* OAuth2Service
    yield* requireAuth('/')

    const { params } = yield* ActionContext
    // アクセストークンを取得
    const { accessToken, setCookieHeaderValue } = yield* getAccessToken
    const hc = yield* HonoClientService

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

const CACHE_KEY = 'study-session'
export const clientAction = async ({ serverAction, request }: Route.ClientActionArgs) => {
  const url = new URL(request.url)
  const completed = url.searchParams.get('completed')

  if (completed) {
    sessionStorage.removeItem(CACHE_KEY)
    return redirect('/dashboard')
  }

  return await serverAction()
}

export const clientLoader = async ({ serverLoader }: Route.ClientLoaderArgs) => {
  const cachedData = sessionStorage.getItem(CACHE_KEY)
  if (cachedData) {
    return JSON.parse(cachedData)
  }

  const data = await serverLoader()
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))

  return data
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
  useEffect(() => {
    return () => {
      sessionStorage.removeItem(CACHE_KEY)
    }
  }, [])

  // useStudySessionフックを使用して学習状態を管理
  const { currentCard, currentIndex, isFlipped, isCompleted, totalCards, progress, flipCard, submitGrade } =
    useStudySession({ cards: studyCards })

  // カードがない場合
  if (studyCards.length === 0) {
    return <EmptyDeck deckId={deckId} />
  }

  // 学習完了時
  if (isCompleted) {
    return <StudyCompletion deckId={deckId} />
  }

  return (
    <div className={css({ padding: '6', maxWidth: '1200px', margin: '0 auto' })}>
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: '4' })}>学習中</h1>

      {/* 進捗表示 */}
      <StudyProgress currentIndex={currentIndex} totalCards={totalCards} progress={progress} />

      {/* カード表示エリア */}
      <FlashCard
        currentCard={currentCard}
        isFlipped={isFlipped}
        flipCard={flipCard}
        isLoading={submitGrade.state !== 'idle'}
      />

      {/* 評価ボタンエリア - アニメーションはCSSで制御 */}
      <div
        className={css({
          position: 'relative',
          opacity: isFlipped ? 1 : 0,
          overflow: 'hidden',
          transition: 'opacity 0.2s ease-out',
          marginTop: '6rem',
        })}
      >
        <GradeButtons deckId={deckId} currentCard={currentCard} submitGrade={submitGrade} />
      </div>
    </div>
  )
}

export default Study
