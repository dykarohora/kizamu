import { useCallback } from 'react'
import { useNavigate } from 'react-router'

export const useDeckNavigation = () => {
  const navigate = useNavigate()

  // デッキ管理画面に遷移
  const handleManageDeck = useCallback(
    (id: string) => {
      navigate(`/decks/${id}`)
    },
    [navigate],
  )

  // 学習画面に遷移
  const handleStudyDeck = useCallback(
    (id: string) => {
      navigate(`/decks/${id}/study`)
    },
    [navigate],
  )

  // 新規デッキ作成画面に遷移
  const handleCreateDeck = useCallback(() => {
    navigate('/decks/new')
  }, [navigate])

  return {
    handleManageDeck,
    handleStudyDeck,
    handleCreateDeck,
  }
}
