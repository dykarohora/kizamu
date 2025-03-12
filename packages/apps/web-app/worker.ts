import handle from 'hono-react-router-adapter/cloudflare-workers'
import { getLoadContext } from './load-context'
import * as build from './build/server'
import app from './server'

export default handle(build, app, { getLoadContext })
