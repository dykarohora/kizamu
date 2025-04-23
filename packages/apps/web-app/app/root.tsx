import { Links, type LinksFunction, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import stylesheet from '~/app.css?url'

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

export function ErrorBoundary(a) {
  console.log(a)
  console.log('error occurred')
  return <div>Error</div>
}
