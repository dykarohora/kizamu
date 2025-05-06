import { Links, type LinksFunction, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import stylesheet from '~/app.css?url'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { LinkButton } from '~/shared/components/ui/link-button'

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary() {
  return (
    <div
      className={flex({
        width: '100%',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '4',
      })}
    >
      <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'red.500', mb: '2' })}>
        エラーが発生しました 😵
      </div>
      <div className={css({ fontSize: 'md', color: 'fg.muted', mb: '6', textAlign: 'center' })}>
        予期せぬエラーが発生しました。
        <br />
        お手数ですが、再度ログインを試してください。
      </div>
      <LinkButton to="/logout" variant="solid" size="md">
        トップページへ
      </LinkButton>
    </div>
  )
}
