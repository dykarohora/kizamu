import { ChevronLeft, ChevronRight } from 'lucide-react'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { Button } from '~/shared/components/ui/styled/button'
import { usePaginationState } from './hooks'

// ページネーションコンポーネントのプロパティ
interface PaginationProps {
  metadata: {
    total: number       // 総アイテム数
    nextCursor?: string // 次ページのカーソル（存在しない場合は最終ページ）
  }
  currentItemsCount: number // 現在のページに表示されているアイテム数
}

/**
 * ページネーションコンポーネント
 * カーソルベースのページングUIを提供し、前後のページ移動と現在の表示範囲を表示する
 * @param props - ページネーションに必要なデータ
 * @returns ページネーションUI（前後のページがない場合はnullを返す）
 */
export const Pagination: React.FC<PaginationProps> = ({ metadata, currentItemsCount }) => {
  // ページネーション状態とハンドラーを取得
  const { displayRange, handleNextPage, handlePrevPage, hasPrevPage, hasNextPage } = usePaginationState({
    metadata,
    currentItemsCount,
  })

  // 前後のページが存在しない場合は非表示
  if (!hasPrevPage && !hasNextPage) {
    return null
  }

  return (
    <div
      className={flex({
        mt: '6',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4',
      })}
    >
      {/* 前のページボタン */}
      <Button variant="outline" size="md" onClick={handlePrevPage} disabled={!hasPrevPage}>
        <span className={flex({ alignItems: 'center', gap: '2' })}>
          <ChevronLeft size={16} />
          前のページ
        </span>
      </Button>

      {/* 現在の表示範囲情報 */}
      <span className={css({ color: 'gray.600', fontSize: 'sm' })}>
        全{metadata.total}件中、現在は{displayRange.start}-{displayRange.end}を表示
      </span>

      {/* 次のページボタン */}
      <Button variant="outline" size="md" onClick={handleNextPage} disabled={!hasNextPage}>
        <span className={flex({ alignItems: 'center', gap: '2' })}>
          次のページ
          <ChevronRight size={16} />
        </span>
      </Button>
    </div>
  )
}
