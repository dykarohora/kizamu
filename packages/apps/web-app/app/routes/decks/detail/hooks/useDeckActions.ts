import { useCallback, useState } from 'react'
import { useFetcher } from 'react-router'

/**
 * 削除対象のカード状態を管理する型
 */
type DeleteCardState = {
  cardId: string | undefined
  isDialogOpen: boolean
}

/**
 * デッキアクション結果の型
 */
type DeckActionsResult = {
  handleDeleteCard: (cardId: string) => void
  confirmDeleteCard: () => void
  closeDeleteDialog: () => void
  isDeleteDialogOpen: boolean
}

/**
 * デッキに対するカード操作アクションを提供するカスタムフック
 * @param deckId - 操作対象のデッキID
 * @returns カード操作に関する関数と状態
 */
export const useDeckActions = (deckId: string): DeckActionsResult => {
  const fetcher = useFetcher()

  // 削除対象のカード状態を一つのオブジェクトで管理
  const [deleteState, setDeleteState] = useState<DeleteCardState>({
    cardId: undefined,
    isDialogOpen: false,
  })

  /**
   * カード削除ダイアログを開く
   */
  const handleDeleteCard = useCallback((cardId: string) => {
    setDeleteState({
      cardId,
      isDialogOpen: true,
    })
  }, [])

  /**
   * カード削除の確認ダイアログで「削除する」ボタンを押したときの処理
   */
  const confirmDeleteCard = useCallback(() => {
    const { cardId } = deleteState

    if (!cardId) {
      return
    }

    // APIを呼び出して削除を実行
    fetcher.submit(
      { cardId },
      {
        method: 'DELETE',
        action: `/decks/${deckId}/cards/${cardId}`,
      },
    )

    // 状態をリセット
    setDeleteState({
      cardId: undefined,
      isDialogOpen: false,
    })
  }, [deleteState, deckId, fetcher])

  /**
   * 削除ダイアログを閉じる
   */
  const closeDeleteDialog = useCallback(() => {
    setDeleteState({
      cardId: undefined,
      isDialogOpen: false,
    })
  }, [])

  return {
    handleDeleteCard,
    confirmDeleteCard,
    closeDeleteDialog,
    isDeleteDialogOpen: deleteState.isDialogOpen,
  }
}
