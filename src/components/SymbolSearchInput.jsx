import { useEffect, useRef, useState } from 'react'
import { searchSymbols } from '../lib/yahooApi'

const DEBOUNCE_MS = 250

export default function SymbolSearchInput({ value, onChange, required }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const timerRef = useRef(null)
  const boxRef = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleInput(next) {
    onChange(next.toUpperCase())
    setActiveIndex(-1)
    clearTimeout(timerRef.current)
    if (!next.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      const results = await searchSymbols(next)
      setSuggestions(results)
      setOpen(results.length > 0)
    }, DEBOUNCE_MS)
  }

  function pick(item) {
    onChange(item.symbol)
    setOpen(false)
    setSuggestions([])
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      pick(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="symbol-search" ref={boxRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="QLD, AAPL, 005930.KS"
        autoComplete="off"
        required={required}
      />
      {open && (
        <ul className="symbol-suggestions">
          {suggestions.map((item, i) => (
            <li
              key={`${item.symbol}-${i}`}
              className={i === activeIndex ? 'active' : ''}
              onMouseDown={() => pick(item)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="sym">{item.symbol}</span>
              <span className="name">{item.name}</span>
              {item.exchange && <span className="exch">{item.exchange}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
