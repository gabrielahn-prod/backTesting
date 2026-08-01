// Thin client for Yahoo Finance's unofficial chart endpoint, reached through
// the dev-server proxy configured in vite.config.js (see /api/yahoo/*).
// No API key needed. Symbols use Yahoo's format, e.g. "QLD", "AAPL", "005930.KS".

const DAY_SECONDS = 86400

function toUnix(dateStr) {
  return Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000)
}

/**
 * Fetches daily OHLC history for a symbol between two ISO dates (inclusive-ish;
 * Yahoo trims to actual trading days). Throws with a friendly message on failure.
 */
export async function fetchDailyHistory(symbol, startDate, endDate) {
  const period1 = toUnix(startDate)
  const period2 = toUnix(endDate) + DAY_SECONDS
  const url = `/api/yahoo/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d&events=div,splits`

  let res
  try {
    res = await fetch(url)
  } catch {
    throw new Error(`${symbol} 데이터 요청에 실패했습니다 (네트워크 오류). 개발 서버(npm run dev)가 실행 중인지 확인하세요.`)
  }

  if (!res.ok) {
    if (res.status === 404) throw new Error(`"${symbol}" 종목을 찾을 수 없습니다. Yahoo Finance 심볼 형식을 확인하세요 (예: QLD, AAPL, 005930.KS).`)
    throw new Error(`${symbol} 데이터 요청 실패 (HTTP ${res.status})`)
  }

  const json = await res.json()
  const err = json?.chart?.error
  if (err) throw new Error(`${symbol}: ${err.description || err.code}`)

  const result = json?.chart?.result?.[0]
  if (!result || !result.timestamp) {
    throw new Error(`"${symbol}"에 대한 데이터가 없습니다.`)
  }

  const { timestamp, indicators, meta } = result
  const closes = indicators?.quote?.[0]?.close || []
  const adjClose = indicators?.adjclose?.[0]?.adjclose || closes

  const rows = []
  for (let i = 0; i < timestamp.length; i++) {
    const close = adjClose[i] ?? closes[i]
    if (close == null) continue
    const date = new Date(timestamp[i] * 1000).toISOString().slice(0, 10)
    rows.push({ date, close })
  }

  return {
    symbol,
    currency: meta?.currency || 'USD',
    exchange: meta?.exchangeName,
    firstTradeDate: meta?.firstTradeDate
      ? new Date(meta.firstTradeDate * 1000).toISOString().slice(0, 10)
      : rows[0]?.date,
    rows,
  }
}

/** USD/KRW daily FX rate history via Yahoo's "KRW=X" pseudo-ticker. */
export async function fetchUsdKrwHistory(startDate, endDate) {
  const { rows } = await fetchDailyHistory('KRW=X', startDate, endDate)
  return rows
}

/**
 * Symbol lookup for the autocomplete dropdown. Returns up to 8 matches:
 * { symbol, name, exchange, type }.
 */
export async function searchSymbols(query) {
  const q = query.trim()
  if (!q) return []

  const url = `/api/symbol-search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`
  let res
  try {
    res = await fetch(url)
  } catch {
    return []
  }
  if (!res.ok) return []

  const json = await res.json()
  const quotes = json?.quotes || []
  return quotes
    .filter((item) => item.symbol)
    .map((item) => ({
      symbol: item.symbol,
      name: item.shortname || item.longname || item.symbol,
      exchange: item.exchDisp || item.exchange,
      type: item.typeDisp || item.quoteType,
    }))
}
