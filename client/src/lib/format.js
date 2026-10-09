const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fmt = n => Number(n).toLocaleString('en-US')
export const pct = (a, b, digits = 1) => (b ? `${((a / b) * 100).toFixed(digits)}%` : '—')
export const monthName = (ym, withYear = true) => `${MON[+ym.slice(5, 7) - 1]}${withYear ? ' ' + ym.slice(0, 4) : ''}`
export const lastDayOfMonth = ym => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).toISOString().slice(0, 10)

/** Date presets anchored to the data's latest date, so they stay meaningful on a static extract. */
export function presets(meta) {
  const back = n => {
    const d = new Date(meta.maxDate + 'T00:00:00Z')
    d.setUTCMonth(d.getUTCMonth() - n)
    d.setUTCDate(d.getUTCDate() + 1)
    return d.toISOString().slice(0, 10)
  }
  return [
    { id: 'l3', label: 'Last 3 mo', from: back(3), to: meta.maxDate },
    { id: 'l6', label: 'Last 6 mo', from: back(6), to: meta.maxDate },
    { id: 'ytd', label: 'YTD', from: meta.maxDate.slice(0, 4) + '-01-01', to: meta.maxDate },
    { id: 'all', label: 'All', from: meta.minDate, to: meta.maxDate },
  ]
}

export const defaultFilters = meta => ({ from: meta.minDate, to: meta.maxDate, recruiter: '', position: '', client: '' })
