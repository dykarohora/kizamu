import { ArrowRight, SettingsIcon } from 'lucide-react'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { Card } from '~/shared/components/ui/card'
import { Fieldset } from '~/shared/components/ui/fieldset'
import { LinkButton } from '~/shared/components/ui/link-button'

// スタイル定義を上部にまとめる 🎨
const cardStyles = css({
  transition: 'all 0.2s ease-in-out',
  bg: 'bg.default',
  boxShadow: 'md',
  rounded: 'md',
  border: '1px solid',
  borderColor: 'border.default',
  _hover: {
    boxShadow: 'lg',
  },
})

const cardHeaderStyles = css({
  px: '6',
  py: '4',
})

const cardBodyStyles = css({
  px: '6',
  pb: '0',
})

const footerStyles = css({
  px: '4',
  pt: '2',
  pb: '4',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '2',
})

// カード情報グリッドのスタイル
const cardInfoGridStyles = grid({
  gridTemplateColumns: '1fr 1fr',
  gap: '2',
  w: 'full',
})

// フィールドセットのスタイル
const fieldsetStyles = css({
  border: 'none',
  p: '0',
  m: '0',
})

// フィールドのスタイル
const fieldStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
})

// デッキデータの型定義
export type DeckCardProps = {
  id: string
  name: string
  description: string
  totalCards: number
  dueCards: number
  lastStudied?: string // ISO形式の日付文字列（例: "2023-05-15"）
}

export const DeckCard = ({ id, name, description, totalCards, dueCards, lastStudied }: DeckCardProps) => {
  // 日付フォーマット用のヘルパー関数を分離 📅
  const formatLastStudied = (date?: string) => {
    if (!date) {
      return '未学習'
    }

    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card.Root className={cardStyles}>
      <Card.Header className={cardHeaderStyles}>
        <Card.Title>{name}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>

      <Card.Body className={cardBodyStyles}>
        <div className={cardInfoGridStyles}>
          <Fieldset.Root className={fieldsetStyles}>
            <Fieldset.Legend>カード総数</Fieldset.Legend>
            <Fieldset.HelperText className={fieldStyles}>{totalCards}枚</Fieldset.HelperText>
          </Fieldset.Root>

          <Fieldset.Root className={fieldsetStyles}>
            <Fieldset.Legend>学習予定</Fieldset.Legend>
            <Fieldset.HelperText className={fieldStyles}>{dueCards}枚</Fieldset.HelperText>
          </Fieldset.Root>

          <Fieldset.Root className={fieldsetStyles}>
            <Fieldset.Legend>最終学習</Fieldset.Legend>
            <Fieldset.HelperText className={fieldStyles}>{formatLastStudied(lastStudied)}</Fieldset.HelperText>
          </Fieldset.Root>
        </div>
      </Card.Body>

      <Card.Footer className={footerStyles}>
        <LinkButton variant="ghost" size="sm" to={`/decks/${id}`} viewTransition>
          <SettingsIcon size={12} />
          カード管理
        </LinkButton>
        <LinkButton variant="solid" size="sm" to={`/decks/${id}/study`} viewTransition>
          学習する
          <ArrowRight size={16} />
        </LinkButton>
      </Card.Footer>
    </Card.Root>
  )
}
