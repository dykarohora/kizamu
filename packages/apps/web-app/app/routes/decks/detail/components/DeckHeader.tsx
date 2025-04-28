import { css } from 'styled-system/css'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

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
      <Link
        to="/dashboard"
        className={css({
          p: '2',
          borderRadius: 'md',
          color: 'colorPalette.default',
          transition: 'all 0.2s',
          _hover: {
            border: '1px solid',
            borderColor: 'colorPalette.default',
          },
        })}
        aria-label="ダッシュボードに戻る"
      >
        <ArrowLeft size={24} />
      </Link>
    </div>
  )
}
