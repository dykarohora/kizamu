import { isbot } from 'isbot'
import { renderToReadableStream } from 'react-dom/server'
import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  let statusCode = responseStatusCode
  const body = await renderToReadableStream(<ServerRouter context={remixContext} url={request.url} />, {
    signal: request.signal,
    onError(error: unknown) {
      console.error(error)
      statusCode = 500
    },
  })

  if (isbot(request.headers.get('user-agent') || '')) {
    await body.allReady
  }

  responseHeaders.set('Content-Type', 'text/html')
  return new Response(body, {
    headers: responseHeaders,
    status: statusCode,
  })
}
