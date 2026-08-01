import SymbolSearchInput from './SymbolSearchInput'

const FREQUENCIES = [
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매달' },
]

export default function ControlsForm({ form, onChange, onSubmit, loading }) {
  const set = (patch) => onChange({ ...form, ...patch })

  const updateRule = (idx, patch) => {
    const rules = form.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    set({ rules })
  }

  const addRule = () => {
    const last = form.rules[form.rules.length - 1]
    set({
      rules: [...form.rules, { period: (last?.period || 200) + 100, amount: last?.amount || 50000 }],
    })
  }

  const removeRule = (idx) => {
    set({ rules: form.rules.filter((_, i) => i !== idx) })
  }

  return (
    <form
      className="controls"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="field-row">
        <label className="field">
          <span>종목 심볼 (Yahoo Finance 형식)</span>
          <SymbolSearchInput value={form.symbol} onChange={(symbol) => set({ symbol })} required />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>시작일</span>
          <input type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} required />
        </label>
        <label className="field">
          <span>종료일</span>
          <input type="date" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} required />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>적립 주기</span>
          <select value={form.frequency} onChange={(e) => set({ frequency: e.target.value })}>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>기본 매수금액 (원)</span>
          <input
            type="number"
            min="1000"
            step="1000"
            value={form.baseAmount}
            onChange={(e) => set({ baseAmount: Number(e.target.value) })}
            required
          />
        </label>
      </div>

      <div className="rules-block">
        <div className="rules-header">
          <span>이동평균선 하회 시 추가매수 (조건 성립 시 누적 적용)</span>
          <button type="button" className="btn-ghost" onClick={addRule}>
            + 규칙 추가
          </button>
        </div>
        {form.rules.length === 0 && <p className="muted">추가매수 규칙 없음 — 기본 적립만 시뮬레이션합니다.</p>}
        {form.rules.map((rule, idx) => (
          <div className="rule-row" key={idx}>
            <span>종가가</span>
            <input
              type="number"
              min="5"
              value={rule.period}
              onChange={(e) => updateRule(idx, { period: Number(e.target.value) })}
            />
            <span>일 이동평균선 아래로 떨어지면</span>
            <input
              type="number"
              min="1000"
              step="1000"
              value={rule.amount}
              onChange={(e) => updateRule(idx, { amount: Number(e.target.value) })}
            />
            <span>원 추가매수</span>
            <button type="button" className="btn-icon" onClick={() => removeRule(idx)} aria-label="규칙 삭제">
              ✕
            </button>
          </div>
        ))}
      </div>

      <label className="checkbox-row">
        <input type="checkbox" checked={form.taxEnabled} onChange={(e) => set({ taxEnabled: e.target.checked })} />
        <span>해외주식 양도세 22% 반영 (원화 종목이 아닌 경우에만 적용)</span>
      </label>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? '계산 중...' : '백테스트 실행'}
      </button>
    </form>
  )
}
