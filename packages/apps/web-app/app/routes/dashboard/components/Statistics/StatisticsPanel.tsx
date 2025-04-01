import { css } from 'styled-system/css'
import { vstack } from 'styled-system/patterns'
import { AccuracyStats } from './AccuracyStats'
import { StudyTimeStats } from './StudyTimeStats'
import { TodayStats } from './TodayStats'

export type StatisticsData = {
  todayCards: number
  streakDays: number
  studyTimeMinutes: number
  accuracy: number
  accuracyTrend: number // パーセンテージポイントの増減（例: +3, -2）
}

type StatisticsPanelProps = {
  data: StatisticsData
}

export const StatisticsPanel = ({ data }: StatisticsPanelProps) => {
  return (
    <div
      className={css({
        border: '1px solid',
        borderColor: 'gray.200',
        borderRadius: 'md',
        padding: '4',
        backgroundColor: 'white',
      })}
    >
      <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', marginBottom: '4' })}>学習統計</h2>

      <div className={vstack({ gap: '4', alignItems: 'stretch' })}>
        <TodayStats todayCards={data.todayCards} streakDays={data.streakDays} />
        <StudyTimeStats studyTimeMinutes={data.studyTimeMinutes} />
        <AccuracyStats accuracy={data.accuracy} accuracyTrend={data.accuracyTrend} />
      </div>
    </div>
  )
}
