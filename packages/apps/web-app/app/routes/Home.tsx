import { Effect } from 'effect'
import { data } from 'react-router'
import { css } from 'styled-system/css'
import { effectLoader } from '~/effect/index.server'
import type { Route } from './+types/Home'

export const loader = effectLoader(
  Effect.gen(function* () {
    return yield* Effect.succeed(data({ message: 'Final' }))
  }),
)

const Home = ({ loaderData: { message } }: Route.ComponentProps) => {
  return (
    <div>
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold' })}>Home</h1>
      <div>{message}</div>
      <div>Hello kizamu!!!</div>
    </div>
  )
}

export default Home
