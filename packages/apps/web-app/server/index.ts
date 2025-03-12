import { Hono } from 'hono'
import type { Env } from '../load-context'

const app = new Hono<Env>()

app.use(async (_, next) => {
  await next()
})

export default app
