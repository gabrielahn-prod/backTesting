import { getISOWeek, getISOWeekYear } from 'date-fns'

// ---- moving average -------------------------------------------------------

export function computeSMA(rows, period) {
  const out = new Array(rows.length).fill(null)
  let sum = 0
  for (let i = 0; i < rows.length; i++) {
    sum += rows[i].close
    if (i >= period) sum -= rows[i - period].close
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

// ---- contribution schedule --------------------------------------------

function groupKey(dateStr, frequency) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  if (frequency === 'weekly') return `${getISOWeekYear(d)}-W${getISOWeek(d)}`
  if (frequency === 'monthly') return `${d.getUTCFullYear()}-${d.getUTCMonth()}`
  return dateStr // daily: every trading day is its own group
}

export function contributionDates(tradingDates, frequency) {
  const out = []
  let lastKey = null
  for (const date of tradingDates) {
    const key = groupKey(date, frequency)
    if (key !== lastKey) {
      out.push(date)
      lastKey = key
    }
  }
  return out
}

// ---- FX lookup (forward-fill on nearest prior date) ------------------------

function makeFxLookup(fxRows) {
  if (!fxRows || fxRows.length === 0) return () => 1
  let i = 0
  return (date) => {
    while (i + 1 < fxRows.length && fxRows[i + 1].date <= date) i++
    return fxRows[i].close
  }
}

// ---- XIRR (Newton-Raphson w/ bisection fallback) --------------------------

export function xirr(cashflows) {
  if (cashflows.length < 2) return null
  const t0 = new Date(`${cashflows[0].date}T00:00:00Z`).getTime()
  const years = cashflows.map(
    (cf) => (new Date(`${cf.date}T00:00:00Z`).getTime() - t0) / (365 * 86400000)
  )
  const amounts = cashflows.map((cf) => cf.amount)

  const f = (r) => amounts.reduce((s, a, i) => s + a / Math.pow(1 + r, years[i]), 0)
  const fp = (r) =>
    amounts.reduce((s, a, i) => s - (years[i] * a) / Math.pow(1 + r, years[i] + 1), 0)

  let r = 0.1
  let converged = false
  for (let iter = 0; iter < 100; iter++) {
    const fr = f(r)
    const fpr = fp(r)
    if (Math.abs(fpr) < 1e-10) break
    let rNext = r - fr / fpr
    if (rNext <= -0.999) rNext = -0.999 + 1e-6
    if (!isFinite(rNext)) break
    if (Math.abs(rNext - r) < 1e-9) {
      r = rNext
      converged = true
      break
    }
    r = rNext
  }

  if (!converged || !isFinite(r) || Math.abs(f(r)) > Math.abs(amounts[amounts.length - 1]) * 1e-4) {
    let lo = -0.99
    let hi = 20
    let flo = f(lo)
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2
      const fmid = f(mid)
      if (Math.sign(fmid) === Math.sign(flo)) {
        lo = mid
        flo = fmid
      } else {
        hi = mid
      }
    }
    r = (lo + hi) / 2
  }
  return r
}

// ---- core simulation --------------------------------------------------

function simulate({ tradingDates, closesByDate, smaByDate, getFx, buyDates, baseAmount, activeRules }) {
  let totalInvested = 0
  let shares = 0
  const cashflows = []
  const series = []
  const ruleStats = activeRules.map((r) => ({ ...r, days: 0, invested: 0 }))
  const events = []
  const buyDateSet = new Set(buyDates)

  let minRatio = Infinity
  let minRatioDate = null

  for (const date of tradingDates) {
    const close = closesByDate.get(date)
    const fx = getFx(date)

    if (buyDateSet.has(date)) {
      // base contribution
      shares += baseAmount / fx / close
      totalInvested += baseAmount
      cashflows.push({ date, amount: -baseAmount })

      // stacked MA-threshold extra buys
      activeRules.forEach((rule, idx) => {
        const smaVal = smaByDate.get(rule.period)?.get(date)
        if (smaVal != null && close < smaVal) {
          shares += rule.amount / fx / close
          totalInvested += rule.amount
          cashflows.push({ date, amount: -rule.amount })
          ruleStats[idx].days += 1
          ruleStats[idx].invested += rule.amount
          events.push({ date, period: rule.period, amount: rule.amount, close })
        }
      })
    }

    const portfolioValue = shares * close * fx
    series.push({ date, close, portfolioValue, invested: totalInvested })

    if (totalInvested > 0) {
      const ratio = portfolioValue / totalInvested
      if (ratio < minRatio) {
        minRatio = ratio
        minRatioDate = date
      }
    }
  }

  const last = series[series.length - 1]
  const finalValue = last ? last.portfolioValue : 0
  if (last) cashflows.push({ date: last.date, amount: finalValue })

  return {
    totalInvested,
    finalValue,
    multiple: totalInvested > 0 ? finalValue / totalInvested : null,
    irr: xirr(cashflows),
    ruleStats,
    events,
    series,
    minRatio: isFinite(minRatio) ? minRatio : null,
    minRatioDate,
  }
}

// ---- public entry point --------------------------------------------------

/**
 * @param {Object} p
 * @param {{date:string, close:number}[]} p.priceRows ascending by date, includes warmup history before startDate
 * @param {{date:string, close:number}[]|null} p.fxRows USD/KRW rows if the ticker isn't KRW-denominated
 * @param {string} p.currency ticker currency code (from Yahoo meta)
 * @param {string} p.startDate ISO date requested by the user
 * @param {string} p.endDate ISO date requested by the user
 * @param {'daily'|'weekly'|'monthly'} p.frequency
 * @param {number} p.baseAmount KRW per contribution
 * @param {{period:number, amount:number}[]} p.rules ascending by period, stacked/cumulative
 */
export function runBacktest(p) {
  const { priceRows, fxRows, currency, startDate, endDate, frequency, baseAmount, rules } = p
  if (!priceRows.length) throw new Error('가격 데이터가 없습니다.')

  const maxPeriod = rules.reduce((m, r) => Math.max(m, r.period), 0)
  const warnings = []

  const listingDate = priceRows[0].date
  const warmupDate = maxPeriod > 0 ? priceRows[Math.min(maxPeriod - 1, priceRows.length - 1)].date : listingDate

  let effectiveStart = startDate
  if (effectiveStart < listingDate) {
    warnings.push(`종목 데이터가 ${listingDate}부터 존재해 시작일을 해당 날짜로 조정했습니다.`)
    effectiveStart = listingDate
  }
  if (effectiveStart < warmupDate) {
    warnings.push(`${maxPeriod}일 이동평균선 계산에 필요한 과거 데이터 확보를 위해 시작일을 ${warmupDate}로 조정했습니다.`)
    effectiveStart = warmupDate
  }

  const lastDate = priceRows[priceRows.length - 1].date
  let effectiveEnd = endDate
  if (effectiveEnd > lastDate) {
    warnings.push(`최신 데이터가 ${lastDate}까지만 있어 종료일을 해당 날짜로 조정했습니다.`)
    effectiveEnd = lastDate
  }

  if (effectiveStart > effectiveEnd) {
    throw new Error('선택한 기간에는 백테스트에 사용할 데이터가 없습니다. 기간을 조정해주세요.')
  }

  const closesByDate = new Map(priceRows.map((r) => [r.date, r.close]))
  const smaByDate = new Map()
  for (const period of new Set(rules.map((r) => r.period))) {
    const values = computeSMA(priceRows, period)
    const m = new Map()
    priceRows.forEach((row, i) => m.set(row.date, values[i]))
    smaByDate.set(period, m)
  }

  const tradingDates = priceRows.map((r) => r.date).filter((d) => d >= effectiveStart && d <= effectiveEnd)
  const buyDates = contributionDates(tradingDates, frequency)

  const sortedRules = [...rules].sort((a, b) => a.period - b.period)

  const scenarios = []
  for (let k = 0; k <= sortedRules.length; k++) {
    const activeRules = sortedRules.slice(0, k)
    // Fresh FX lookup per scenario run: its internal pointer only walks forward,
    // so reusing one instance across simulate() calls would carry the pointer
    // from the previous (already-fully-walked) run and read stale/late FX rates
    // for every early date in this run.
    const getFx = makeFxLookup(fxRows)
    const result = simulate({ tradingDates, closesByDate, smaByDate, getFx, buyDates, baseAmount, activeRules })
    scenarios.push({
      label:
        k === 0
          ? '기본 적립만'
          : `+ ${activeRules[activeRules.length - 1].period}일선 하회 시 추가매수`,
      activeRules,
      ...result,
    })
  }

  const main = scenarios[scenarios.length - 1]
  main.chartData = tradingDates.map((date) => {
    const row = { date, close: closesByDate.get(date) }
    for (const period of new Set(sortedRules.map((r) => r.period))) {
      row[`ma${period}`] = smaByDate.get(period)?.get(date) ?? null
    }
    return row
  })
  main.maPeriods = [...new Set(sortedRules.map((r) => r.period))]

  return {
    currency,
    effectiveStart,
    effectiveEnd,
    warnings,
    buyCount: buyDates.length,
    main,
    scenarios,
  }
}
