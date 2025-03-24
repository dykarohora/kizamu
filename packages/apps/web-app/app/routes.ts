import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
  layout('routes/layouts/MainLayout.tsx', [index('routes/Home.tsx'), route('/secret', 'routes/Secret.tsx')]),
  route('/login', 'routes/auth/Login.tsx'),
  route('/callback', 'routes/auth/Callback.tsx'),
] satisfies RouteConfig
