import { Calendar, Flame } from 'lucide-react'
import { css } from 'styled-system/css'
import { hstack } from 'styled-system/patterns'

type TodayStatsProps = {
  todayCards: number
  streakDays: number
}

export const TodayStats = ({ todayCards, streakDays }: TodayStatsProps) => {
  return (
    <div
      className={css({
        border: '1px solid',
        borderColor: 'gray.200',
        borderRadius: 'md',
        padding: '3',
        backgroundColor: 'gray.50',
      })}
    >
      <h3 className={css({ fontSize: 'md', fontWeight: 'medium', color: 'gray.600', marginBottom: '2' })}>
        今日の学習
      </h3>

      <div className={hstack({ gap: '4', justifyContent: 'space-around' })}>
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1',
          })}
        >
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              width: '10',
              height: '10',
              borderRadius: 'full',
              boxShadow: 'sm',
            })}
          >
            <Calendar size={20} className={css({ color: 'brand.500' })} />
          </div>
          <div className={css({ fontWeight: 'bold', fontSize: 'xl' })}>{todayCards}</div>
          <div className={css({ fontSize: 'xs', color: 'gray.500' })}>カード</div>
        </div>

        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1',
          })}
        >
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              width: '10',
              height: '10',
              borderRadius: 'full',
              boxShadow: 'sm',
            })}
          >
            <Flame size={20} className={css({ color: 'orange.500' })} />
          </div>
          <div className={css({ fontWeight: 'bold', fontSize: 'xl' })}>{streakDays}</div>
          <div className={css({ fontSize: 'xs', color: 'gray.500' })}>連続日数</div>
        </div>
      </div>
    </div>
  )
}
