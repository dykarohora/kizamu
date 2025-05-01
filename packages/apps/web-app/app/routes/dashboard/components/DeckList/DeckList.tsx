import { Plus } from 'lucide-react'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { LinkButton } from '~/shared/components/ui/link-button'
import { DeckCard, type DeckCardProps } from './DeckCard'

export type Deck = Omit<DeckCardProps, 'onManage' | 'onStudy'>

const containerStyles = css({
  width: '100%',
})

const headerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4',
})

const titleStyles = css({
  fontSize: '2xl',
  fontWeight: 'bold',
})

const emptyStateStyles = css({
  padding: '8',
  textAlign: 'center',
  bg: 'bg.subtle',
  rounded: 'md',
  color: 'fg.subtle',
})

const deckGridStyles = grid({
  gap: '4',
  gridTemplateColumns: {
    base: '1fr',
    lg: 'repeat(2, 1fr)',
  },
})

type DeckListProps = {
  decks: Deck[]
}

export const DeckList = ({ decks }: DeckListProps) => (
  <div className={containerStyles}>
    <div className={headerStyles}>
      <h2 className={titleStyles}>デッキ一覧</h2>
      <LinkButton variant="outline" size="sm" to="/decks/new" viewTransition>
        <Plus size={16} />
        新規デッキ
      </LinkButton>
    </div>

    {decks.length === 0 ? (
      <div className={emptyStateStyles}>デッキがありません。「新規デッキ」ボタンからデッキを作成してください。</div>
    ) : (
      <div className={deckGridStyles}>
        {decks.map((deck) => (
          <DeckCard key={deck.id} {...deck} />
        ))}
      </div>
    )}
  </div>
)
