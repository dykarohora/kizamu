import { ArrowLeft } from 'lucide-react'
import { css } from 'styled-system/css'
import { LinkButton } from '~/shared/components/ui/link-button'

type DeckHeaderProps = {
  name: string
  description: string
}

export const DeckHeader = ({ name, description }: DeckHeaderProps) => {
  return (
    <div
      className={css({
        mb: '8',
        px: '4',
        py: '2',
        borderLeft: '24px solid',
        borderLeftColor: 'colorPalette.default',
        borderBottom: '1px dotted',
        borderBottomColor: 'border.subtle',
        borderTop: '1px dotted',
        borderTopColor: 'border.subtle',
        borderRight: '1px dotted',
        borderRightColor: 'border.subtle',
        backgroundColor: 'bg.subtle',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      })}
    >
      <div>
        <h1
          className={css({
            fontSize: '3xl',
            fontWeight: 'bold',
          })}
        >
          {name}
        </h1>
        <p className={css({ color: 'fg.muted', mt: '1' })}>{description}</p>
      </div>
      <LinkButton variant="ghost" size="sm" to="/dashboard" viewTransition>
        <ArrowLeft size={36} />
      </LinkButton>
    </div>
  )
}
