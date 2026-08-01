export function formatKRW(n) {
  if (n == null || !isFinite(n)) return '-'
  return `${Math.round(n).toLocaleString('ko-KR')}원`
}

export function formatKRWCompact(n) {
  if (n == null || !isFinite(n)) return '-'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const eok = Math.floor(abs / 100_000_000)
  const man = Math.round((abs % 100_000_000) / 10_000)
  if (eok > 0) return `${sign}${eok}억 ${man.toLocaleString('ko-KR')}만원`
  return `${sign}${man.toLocaleString('ko-KR')}만원`
}

export function formatPercent(n, digits = 1) {
  if (n == null || !isFinite(n)) return '-'
  return `${(n * 100).toFixed(digits)}%`
}

export function formatMultiple(n, digits = 2) {
  if (n == null || !isFinite(n)) return '-'
  return `${n.toFixed(digits)}배`
}

export function formatDate(d) {
  return d || '-'
}
