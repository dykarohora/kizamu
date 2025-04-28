import { useCallback } from 'react'
import { useNavigate } from 'react-router'

export const useDeckNavigation = () => {
  const navigate = useNavigate()

  // 学習画面に遷移
  const handleStudyDeck = useCallback(
    (id: string) => {
      navigate(`/decks/${id}/study`)
    },
    [navigate],
  )

  return {
    handleStudyDeck,
  }
}
