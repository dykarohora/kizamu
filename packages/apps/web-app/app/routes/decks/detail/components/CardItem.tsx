import { Pencil, Trash } from 'lucide-react'
import { css } from 'styled-system/css'
import { flex, grid } from 'styled-system/patterns'
import { Button } from '~/shared/components/ui/button'
import { Card as CardComponent } from '~/shared/components/ui/card'

export type CardItemProps = {
  id: string
  frontContent: string
  backContent: string
  deckId: string
  onEdit?: (cardId: string) => void
  onDelete?: (cardId: string) => void
}

// 共通スタイルを定数として定義
const cardRootStyle = css({
  border: '1px solid',
  borderColor: 'border.default',
  transition: 'all 0.2s ease-in-out',
  _hover: { boxShadow: 'md' },
})

const labelStyle = css({
  fontSize: 'sm',
  color: 'fg.muted',
  mb: '1',
})

const contentStyle = css({
  p: '3',
  bg: 'bg.subtle',
  rounded: 'md',
  minHeight: '100px',
  whiteSpace: 'pre-wrap',
})

const buttonIconStyle = flex({
  alignItems: 'center',
  gap: '1',
})

const actionContainerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  justifyContent: 'center',
})

export const CardItem = ({ id, frontContent, backContent, onEdit, onDelete }: CardItemProps) => {
  return (
    <CardComponent.Root className={cardRootStyle}>
      <div
        className={grid({
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr auto' },
          gap: '4',
          p: '4',
        })}
      >
        {/* 表面 */}
        <div>
          <div className={labelStyle}>表面</div>
          <div className={contentStyle}>{frontContent}</div>
        </div>

        {/* 裏面 */}
        <div>
          <div className={labelStyle}>裏面</div>
          <div className={contentStyle}>{backContent}</div>
        </div>

        {/* アクションボタン */}
        <div className={actionContainerStyle}>
          <Button variant="ghost" size="sm" onClick={() => onEdit?.(id)}>
            <span className={buttonIconStyle}>
              <Pencil size={16} />
              編集
            </span>
          </Button>
          <Button variant="ghost" size="sm" colorPalette="red" onClick={() => onDelete?.(id)}>
            <span className={buttonIconStyle}>
              <Trash size={16} />
              削除
            </span>
          </Button>
        </div>
      </div>
    </CardComponent.Root>
  )
}
