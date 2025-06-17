import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { DEFAULT_LIMIT, calculateDisplayRange, updateSearchParams } from './utils'

/**
 * ページネーション履歴をセッションストレージで管理するカスタムフック
 * デッキごとに独立した履歴を保持し、ブラウザの戻る/進むボタンのような動作を提供
 * @param deckId - 履歴を管理するデッキのID
 * @returns pageHistory - ページ履歴の配列、updatePageHistory - 履歴更新関数
 */
const usePaginationHistory = () => {
  // ページ履歴の状態管理。初回はセッションストレージから復元、デフォルトは[null]
  const [pageHistory, setPageHistory] = useState<(string | null)[]>([null])

  // ページ履歴を更新し、セッションストレージに永続化する関数
  const updatePageHistory = useCallback((newHistory: (string | null)[]) => {
    setPageHistory(newHistory)
  }, [])

  return { pageHistory, updatePageHistory }
}

/**
 * URLパラメータからページネーションの設定を取得するフック
 * @returns currentCursor - 現在のカーソル、limit - 1ページあたりの件数、setSearchParams - URLパラメータ更新関数
 */
const usePaginationParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // URLからカーソルとリミットを取得
  const currentCursor = searchParams.get('cursor')
  const limit = Number(searchParams.get('limit')) || DEFAULT_LIMIT

  return { currentCursor, limit, setSearchParams }
}

/**
 * ページネーションのナビゲーション機能を提供するフック
 * @param params - ナビゲーションに必要なパラメータ
 * @returns handleNextPage - 次ページへの移動関数、handlePrevPage - 前ページへの移動関数
 */
const usePaginationNavigation = ({
  pageHistory,
  updatePageHistory,
  currentPageIndex,
  limit,
  setSearchParams,
  nextCursor,
}: {
  pageHistory: (string | null)[]
  updatePageHistory: (newHistory: (string | null)[]) => void
  currentPageIndex: number
  limit: number
  setSearchParams: (updater: (prev: URLSearchParams) => URLSearchParams) => void
  nextCursor?: string
}) => {
  // 次のページに移動する処理
  const handleNextPage = useCallback(() => {
    if (nextCursor) {
      // 履歴に新しいカーソルを追加
      const newHistory = [...pageHistory, nextCursor]
      updatePageHistory(newHistory)
      // URLパラメータを更新してページ遷移
      updateSearchParams(setSearchParams, nextCursor, limit)
    }
  }, [nextCursor, pageHistory, updatePageHistory, setSearchParams, limit])

  // 前のページに移動する処理
  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      // 履歴から前のカーソルを取得
      const prevCursor = pageHistory[currentPageIndex - 1]
      // URLパラメータを更新してページ遷移
      updateSearchParams(setSearchParams, prevCursor, limit)
    }
  }, [currentPageIndex, pageHistory, setSearchParams, limit])

  return { handleNextPage, handlePrevPage }
}

/**
 * ページネーションの全体的な状態を管理する統合フック
 * @param params - ページネーション状態に必要なパラメータ
 * @returns ページネーションUIに必要な全ての状態と操作関数
 */
const usePaginationState = ({
  metadata,
  currentItemsCount,
}: {
  metadata: { total: number; nextCursor?: string }
  currentItemsCount: number
}) => {
  // 各種フックから必要な機能を取得
  const { pageHistory, updatePageHistory } = usePaginationHistory()
  const { currentCursor, limit, setSearchParams } = usePaginationParams()

  // 現在のページインデックスを履歴から計算
  const currentPageIndex = useMemo(() => {
    return pageHistory.findIndex((cursor) => cursor === currentCursor)
  }, [pageHistory, currentCursor])

  // 表示範囲の計算（例: "1-10 of 100"）
  const displayRange = useMemo(
    () =>
      calculateDisplayRange({
        currentPageIndex,
        pageHistoryLength: pageHistory.length,
        limit,
        currentItemsCount,
        total: metadata.total,
      }),
    [currentPageIndex, pageHistory.length, limit, currentItemsCount, metadata.total],
  )

  // ナビゲーション機能を取得
  const { handleNextPage, handlePrevPage } = usePaginationNavigation({
    pageHistory,
    updatePageHistory,
    currentPageIndex,
    limit,
    setSearchParams,
    nextCursor: metadata.nextCursor,
  })

  // ページ存在チェック
  const hasPrevPage = currentPageIndex > 0
  const hasNextPage = !!metadata.nextCursor

  return {
    displayRange,
    handleNextPage,
    handlePrevPage,
    hasPrevPage,
    hasNextPage,
  }
}

export { usePaginationHistory, usePaginationParams, usePaginationNavigation, usePaginationState }
