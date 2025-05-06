import { css } from 'styled-system/css'
import type { CardItemProps } from './CardItem'
import { CardItem } from './CardItem'

type CardListProps = {
  cards: Omit<CardItemProps, 'onEdit' | 'onDelete'>[]
  onDeleteCard?: (cardId: string) => void
}

export const CardList = ({ cards, onDeleteCard }: CardListProps) => {
  return (
    <div className={css({ mb: '6' })}>
      <h2 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: '4' })}>カード一覧</h2>

      {cards.length === 0 ? (
        <div
          className={css({
            padding: '8',
            textAlign: 'center',
            bg: 'bg.subtle',
            rounded: 'md',
            color: 'fg.subtle',
          })}
        >
          カードがありません。「新規カード」ボタンからカードを追加してください。
        </div>
      ) : (
        <div className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}>
          {cards.map((card) => (
            <CardItem key={card.id} {...card} onDelete={onDeleteCard} />
          ))}
        </div>
      )}
    </div>
  )
}
