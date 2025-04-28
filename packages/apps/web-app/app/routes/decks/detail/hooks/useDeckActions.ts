import { useCallback } from 'react'
import { useNavigate } from 'react-router'

export const useDeckActions = (deckId: string) => {
  const navigate = useNavigate()

  const handleAddCard = useCallback(() => navigate(`/decks/${deckId}/cards/new`), [navigate, deckId])

  const handleEditCard = useCallback(
    (cardId: string) => navigate(`/decks/${deckId}/cards/${cardId}/edit`),
    [navigate, deckId],
  )

  const handleDeleteCard = useCallback((cardId: string) => {
    // ここに削除処理を実装する（または削除確認モーダルを表示）
    console.log('削除:', cardId)
  }, [])

  return {
    handleAddCard,
    handleEditCard,
    handleDeleteCard,
  }
}
