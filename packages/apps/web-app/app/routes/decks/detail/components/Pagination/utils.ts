// ページネーションのデフォルト表示件数
const DEFAULT_LIMIT = 6

// 表示範囲を表すインターフェース（例: "1-10 of 100"の1と10）
interface DisplayRange {
  start: number
  end: number
}

/**
 * 現在のページ情報から表示範囲を計算する
 * @param params - 表示範囲計算に必要なパラメータ
 * @returns 表示範囲オブジェクト（開始位置と終了位置）
 */
const calculateDisplayRange = ({
  currentPageIndex,
  pageHistoryLength,
  limit,
  currentItemsCount,
  total,
}: {
  currentPageIndex: number
  pageHistoryLength: number
  limit: number
  currentItemsCount: number
  total: number
}): DisplayRange => {
  // 現在のページインデックスを正規化（-1の場合は最新ページとして扱う）
  let pageIndex = currentPageIndex
  if (pageIndex === -1) {
    pageIndex = pageHistoryLength
  }

  // 表示開始位置を計算（1ベースのインデックス）
  const start = pageIndex * limit + 1
  // 表示終了位置を計算（実際のアイテム数と総数の小さい方）
  const end = Math.min(start + currentItemsCount - 1, total)
  return { start, end }
}

/**
 * URLパラメータを更新してページネーション状態を反映する
 * @param setSearchParams - URLパラメータ更新関数
 * @param cursor - 設定するカーソル値（nullの場合は削除）
 * @param limit - 1ページあたりの表示件数
 */
const updateSearchParams = (
  setSearchParams: (updater: (prev: URLSearchParams) => URLSearchParams) => void,
  cursor: string | null,
  limit: number,
): void => {
  setSearchParams((prev) => {
    // 既存のパラメータをコピー
    const newParams = new URLSearchParams(prev)

    // カーソルの設定または削除
    if (cursor) {
      newParams.set('cursor', cursor)
    } else {
      newParams.delete('cursor')
    }

    // リミットを設定
    newParams.set('limit', limit.toString())
    return newParams
  })
}

export { DEFAULT_LIMIT, calculateDisplayRange, updateSearchParams }
export type { DisplayRange }
