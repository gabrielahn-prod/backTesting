import { proxyToYahoo } from './_yahooProxy.js'

export default async function handler(req, res) {
  await proxyToYahoo(res, '/v1/finance/search', req.query)
}
