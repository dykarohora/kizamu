import { Effect } from 'effect'
import { Plus } from 'lucide-react'
import { data } from 'react-router'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { effectLoader } from '~/effect/index.server'
import { OAuth2Service } from '~/services/auth/index.server'
import { HonoClientService } from '~/services/hono-client/index.server'
import { LoaderContext } from '~/services/react-router/index.server'
import { LinkButton } from '~/shared/components/ui/link-button'
import type { Route } from './+types/DeckDetail'
import { CardList, DeckHeader, DeleteCardDialog, Pagination } from './components'
import { useDeckActions } from './hooks'

/**
 * デッキ詳細ページのデータローダー
 * @description
 * - ユーザーの認証状態を確認し、未認証の場合はホームページにリダイレクト
 * - デッキIDを使用して、デッキの詳細情報とカード一覧を取得する
 *
 * @throws {Error} APIリクエストが失敗した場合
 * @returns {Promise<{ deck: Deck, cards: Array<Card> }>} デッキとカード情報
 */
export const loader = effectLoader(
  Effect.gen(function* () {
    // 認証関連のサービスを取得
    const { requireAuth, getAccessToken } = yield* OAuth2Service
    yield* requireAuth('/')

    const { params, request } = yield* LoaderContext
    // アクセストークンを取得してAPIクライアントを初期化
    const { accessToken, setCookieHeaderValue } = yield* getAccessToken
    const hc = yield* HonoClientService

    // パラメータからデッキIDを取得
    const deckId = params.deckId
    if (!deckId) {
      return yield* Effect.fail(new Error('デッキIDが指定されていません'))
    }

    // デッキ情報を取得するEffect
    const fetchDeckTask = Effect.gen(function* () {
      const deckResponse = yield* Effect.promise(async () =>
        hc.decks[':deckId'].$get({ param: { deckId } }, { headers: { Authorization: `Bearer ${accessToken}` } }),
      )

      if (deckResponse.status !== 200) {
        const error = yield* Effect.promise(async () => await deckResponse.json())
        return yield* Effect.fail(error)
      }

      return yield* Effect.promise(async () => await deckResponse.json())
    })

    // URLSearchParamsからページング情報を取得
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor') || undefined
    const limit = url.searchParams.get('limit') ?? '6'

    // カード情報を取得するEffect
    const fetchCardsTask = Effect.gen(function* () {
      const cardsResponse = yield* Effect.promise(async () =>
        hc.decks[':deckId'].cards.$get(
          {
            param: { deckId },
            query: {
              limit,
              ...(cursor && { cursor })
            }
          },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      )

      if (cardsResponse.status !== 200) {
        const error = yield* Effect.promise(async () => await cardsResponse.json())
        return yield* Effect.fail(error)
      }

      const cardsData = yield* Effect.promise(async () => await cardsResponse.json())
      return {
        cards: cardsData.data.map((card) => ({
          id: card.id,
          frontContent: card.frontContent,
          backContent: card.backContent,
          deckId: card.deckId,
        })),
        metadata: cardsData.metadata
      }
    })

    // デッキ情報とカード情報を取得するEffectを並行実行
    const [deck, cardsData] = yield* Effect.all([fetchDeckTask, fetchCardsTask], { concurrency: 'unbounded' })

    return yield* Effect.succeed(
      data(
        { deck, cards: cardsData.cards, metadata: cardsData.metadata },
        { ...(setCookieHeaderValue !== undefined && { headers: { 'Set-Cookie': setCookieHeaderValue } }) },
      ),
    )
  }),
)

/**
 * デッキ詳細コンポーネント
 * @description
 * デッキに含まれるカード一覧を表示し、カードの管理機能を提供する
 * - カード一覧表示
 * - カードの追加・編集・削除機能
 */
const DeckDetail = ({ loaderData: { deck, cards, metadata } }: Route.ComponentProps) => {
  const { handleDeleteCard, confirmDeleteCard, closeDeleteDialog, isDeleteDialogOpen } = useDeckActions(deck.id)

  return (
    <div className={css({ padding: '6', maxWidth: '1200px', margin: '0 auto' })}>
      {/* ページヘッダー */}
      <DeckHeader name={deck.name} description={deck.description} />

      {/* カード追加ボタン */}
      <div className={css({ mb: '6', display: 'flex', justifyContent: 'flex-end' })}>
        <LinkButton variant="solid" size="md" to={`/decks/${deck.id}/cards/new`} viewTransition>
          <span className={flex({ alignItems: 'center', gap: '1' })}>
            <Plus size={16} />
            新規カード
          </span>
        </LinkButton>
      </div>

      {/* カード一覧 */}
      <CardList cards={cards} onDeleteCard={handleDeleteCard} />

      {/* ページング */}
      <Pagination
        metadata={{
          total: metadata.total,
          nextCursor: metadata.nextCursor ?? undefined
        }}
        currentItemsCount={cards.length}
      />

      {/* 削除確認ダイアログ */}
      <DeleteCardDialog isOpen={isDeleteDialogOpen} onClose={closeDeleteDialog} onConfirm={confirmDeleteCard} />
    </div>
  )
}

export default DeckDetail
