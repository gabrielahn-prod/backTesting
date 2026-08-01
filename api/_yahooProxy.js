// Shared proxy logic for Vercel serverless functions that forward to Yahoo
// Finance's unofficial API. Mirrors the dev-time proxy in vite.config.js —
// that one only runs under `npm run dev`, this is what actually serves
// requests once deployed (Vercel, etc).

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

export async function proxyToYahoo(res, path, query) {
  const qs = new URLSearchParams(query).toString()
  const url = `https://query1.finance.yahoo.com${path}${qs ? `?${qs}` : ''}`

  let upstream
  try {
    upstream = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  } catch (e) {
    res.status(502).json({ error: `Yahoo Finance 요청 실패: ${e.message}` })
    return
  }

  const body = await upstream.text()
  res.status(upstream.status)
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
  res.send(body)
}
