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

export const CardItem = ({ id, frontContent, backContent, onEdit, onDelete }: CardItemProps) => {
  return (
    <CardComponent.Root
      className={css({
        border: '1px solid',
        borderColor: 'border.default',
        transition: 'all 0.2s ease-in-out',
        _hover: { boxShadow: 'md' },
      })}
    >
      <div
        className={grid({
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr auto' },
          gap: '4',
          p: '4',
        })}
      >
        {/* 表面 */}
        <div>
          <div className={css({ fontSize: 'sm', color: 'fg.muted', mb: '1' })}>表面</div>
          <div
            className={css({
              p: '3',
              bg: 'bg.subtle',
              rounded: 'md',
              minHeight: '100px',
            })}
          >
            {frontContent}
          </div>
        </div>

        {/* 裏面 */}
        <div>
          <div className={css({ fontSize: 'sm', color: 'fg.muted', mb: '1' })}>裏面</div>
          <div
            className={css({
              p: '3',
              bg: 'bg.subtle',
              rounded: 'md',
              minHeight: '100px',
            })}
          >
            {backContent}
          </div>
        </div>

        {/* アクションボタン */}
        <div className={css({ display: 'flex', flexDirection: 'column', gap: '2', justifyContent: 'center' })}>
          <Button variant="ghost" size="sm" onClick={() => onEdit?.(id)}>
            <span className={flex({ alignItems: 'center', gap: '1' })}>
              <Pencil size={16} />
              編集
            </span>
          </Button>
          <Button variant="ghost" size="sm" colorPalette="red" onClick={() => onDelete?.(id)}>
            <span className={flex({ alignItems: 'center', gap: '1' })}>
              <Trash size={16} />
              削除
            </span>
          </Button>
        </div>
      </div>
    </CardComponent.Root>
  )
}
