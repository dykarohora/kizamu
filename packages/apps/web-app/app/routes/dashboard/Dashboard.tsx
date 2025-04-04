import { Effect } from 'effect'
import { useMemo } from 'react'
import { data } from 'react-router'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { effectLoader } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { HonoClientService } from '~/services/hono-client/index.server'
import type { Route } from './+types/Dashboard'
import { DeckList } from './components/DeckList/DeckList'
import { useDeckNavigation } from './hooks/useDeckNavigation'

/**
 * ダッシュボードページのデータローダー
 * @description
 * - ユーザーの認証状態を確認し、未認証の場合はホームページにリダイレクト
 * - 認証済みの場合、ユーザーのデッキ一覧を取得（最大20件）
 * - 取得したデッキ情報をコンポーネントに渡す
 *
 * @throws {Error} APIリクエストが失敗した場合
 * @returns {Promise<{ decks: Array<Deck> }>} デッキ一覧データ
 */
export const loader = effectLoader(
  Effect.gen(function* () {
    // 認証関連のサービスを取得
    const { requireAuth, getAccessToken } = yield* OAuth2Service
    yield* requireAuth('/')

    // アクセストークンを取得してAPIクライアントを初期化
    const { accessToken, setCookieHeaderValue } = yield* getAccessToken
    const hc = yield* HonoClientService

    // デッキ一覧を取得（最大20件）
    const response = yield* Effect.promise(async () =>
      hc.decks.$get({ query: { limit: '20' } }, { headers: { Authorization: `Bearer ${accessToken}` } }),
    )

    if (response.status === 200) {
      const { decks } = yield* Effect.promise(async () => await response.json())
      return yield* Effect.succeed(
        data(
          { decks },
          { ...(setCookieHeaderValue !== undefined && { headers: { 'Set-Cookie': setCookieHeaderValue } }) },
        ),
      )
    }

    const error = yield* Effect.promise(async () => await response.json())
    return yield* Effect.fail(error)
  }),
)

/**
 * ダッシュボードコンポーネント
 * @description
 * ユーザーのデッキ一覧と学習統計を表示するメインページ
 * - デッキ一覧：作成済みのデッキを表示し、各デッキの管理・学習機能を提供
 * - 学習統計：ユーザーの学習進捗や成績を表示（実装予定）
 *
 * @param {Object} props
 * @param {Array<Deck>} props.loaderData.decks - APIから取得したデッキ一覧
 */
const Dashboard = ({ loaderData: { decks } }: Route.ComponentProps) => {
  // ナビゲーション関連の処理をカスタムフックから取得
  const { handleManageDeck, handleStudyDeck, handleCreateDeck } = useDeckNavigation()

  // APIから取得したデッキデータをUI表示用に整形
  // パフォーマンス最適化のため、decksが変更された時のみ再計算
  const formattedDecks = useMemo(
    () =>
      decks.map((deck) => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        totalCards: deck.totalCards,
        dueCards: deck.dueCards,
        // TODO: 学習日時をAPIから取得できるようにする
        lastStudied: new Date().toISOString(),
      })),
    [decks],
  )

  return (
    <div className={css({ padding: '6', maxWidth: '1200px', margin: '0 auto' })}>
      {/* ページヘッダー */}
      <div
        className={css({
          mb: '8',
          px: '4',
          py: '2',
          borderLeft: '24px solid',
          borderLeftColor: 'colorPalette.default',
          borderBottom: '1px dotted',
          borderBottomColor: 'border.subtle',
          borderTop: '1px dotted',
          borderTopColor: 'border.subtle',
          borderRight: '1px dotted',
          borderRightColor: 'border.subtle',
          backgroundColor: 'bg.subtle',
        })}
      >
        <h1
          className={css({
            fontSize: '3xl',
            fontWeight: 'bold',
          })}
        >
          Your Dock
        </h1>
      </div>

      {/* メインコンテンツ：デッキ一覧と統計情報 */}
      <div
        className={grid({
          gap: '6',
          gridTemplateColumns: { base: '1fr', md: '2fr 1fr' },
        })}
      >
        {/* 左カラム: デッキ一覧 */}
        <DeckList
          decks={formattedDecks}
          onManageDeck={handleManageDeck}
          onStudyDeck={handleStudyDeck}
          onCreateDeck={handleCreateDeck}
        />

        {/* 右カラム: 学習統計（実装予定） */}
        <div
          className={css({
            border: '1px solid',
            borderColor: 'gray.200',
            borderRadius: 'md',
            padding: '4',
            backgroundColor: 'white',
          })}
        >
          <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', marginBottom: '4' })}>学習統計</h2>
          <div className={css({ color: 'gray.500', textAlign: 'center', padding: '8' })}>
            学習統計情報がここに表示されます
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
