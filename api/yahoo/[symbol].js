import { proxyToYahoo } from '../_yahooProxy.js'

export default async function handler(req, res) {
  const { symbol, ...rest } = req.query
  await proxyToYahoo(res, `/v8/finance/chart/${encodeURIComponent(symbol)}`, rest)
}
