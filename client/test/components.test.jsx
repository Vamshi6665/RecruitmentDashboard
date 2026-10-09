import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KpiRow } from '../src/components/KpiRow.jsx'
import { FilterBar } from '../src/components/FilterBar.jsx'
import { RecruiterTable } from '../src/components/RecruiterTable.jsx'
import { CommandPalette } from '../src/components/CommandPalette.jsx'
import { PositionsPanel } from '../src/components/PositionsPanel.jsx'

const meta = {
  minDate: '2024-01-01', maxDate: '2026-10-05', asOf: '2026-10-05',
  recruiters: [{ id: 'R04', name: 'Alex' }, { id: 'R05', name: 'Maya' }],
  positions: ['Data Engineer', 'QA Engineer'], clients: ['Demo Client 01'],
}
const filters = { from: '2024-01-01', to: '2026-10-05', recruiter: '', position: '', client: '' }
const report = {
  filters,
  kpis: { reached: 16730, submissions: 9622, interviewed: 5456, hires: 1892, newRequirements: 340, outreachAttempts: 41086 },
  recruiters: [
    { id: 'R04', name: 'Alex', team: 'SE', reached: 1658, submissions: 976, interviewed: 598, hires: 205 },
    { id: 'R05', name: 'Maya', team: 'DA', reached: 1675, submissions: 1047, interviewed: 657, hires: 203 },
  ],
}

describe('PositionsPanel', () => {
  const positions = { requirements: 340, liveRequirements: 32, openings: 2598, filled: 1892, cancelled: 524, openNow: 182, onHold: 43, fillRate: 1892 / 2598 }
  it('shows requirements vs positions and what happened to them', () => {
    render(<PositionsPanel positions={positions} />)
    expect(screen.getByTestId('pos-Positions requested')).toHaveTextContent('2,598')
    expect(screen.getByTestId('pos-Open positions')).toHaveTextContent('182')
    expect(screen.getByText('72.8% fill rate')).toBeInTheDocument()
    expect(screen.getByText('incl. 43 on hold')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName(/2,598 positions: Filled 1,892, Cancelled at closure 524, Still open 182/)
  })
  it('renders nothing when the source has no positions', () => {
    const { container } = render(<PositionsPanel positions={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('KpiRow', () => {
  it('shows the six Power BI measures', () => {
    render(<KpiRow kpis={report.kpis} />)
    expect(screen.getByTestId('kpi-Candidates Reached')).toHaveTextContent('16,730')
    expect(screen.getByTestId('kpi-Outreach Attempts')).toHaveTextContent('41,086')
    expect(screen.getByText('19.7% of submissions')).toBeInTheDocument()
  })
})

describe('FilterBar', () => {
  it('applies a year and a recruiter', async () => {
    const onChange = vi.fn()
    render(<FilterBar meta={meta} filters={filters} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Year'), '2026')
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, from: '2026-01-01', to: '2026-10-05' })
    await userEvent.selectOptions(screen.getByLabelText('Recruiter'), 'R05')
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, recruiter: 'R05' })
  })

  it('marks the active quick range', () => {
    render(<FilterBar meta={meta} filters={filters} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('RecruiterTable', () => {
  it('sorts by hires, then by a clicked column', async () => {
    render(<RecruiterTable report={report} />)
    const names = () => screen.getAllByRole('row').slice(1).map(r => within(r).getAllByRole('cell')[0].textContent)
    expect(names()[0]).toMatch(/^Alex/)
    await userEvent.click(screen.getByRole('button', { name: 'Submissions' }))
    expect(names()[0]).toMatch(/^Maya/)
  })

  it('opens a recruiter when a row is selected', async () => {
    const onPick = vi.fn()
    render(<RecruiterTable report={report} onPick={onPick} />)
    await userEvent.click(screen.getByText('Maya'))
    expect(onPick).toHaveBeenCalledWith('R05')
  })
})

describe('CommandPalette', () => {
  it('filters commands and runs the selected one with Enter', async () => {
    const run = vi.fn(), onClose = vi.fn()
    render(<CommandPalette onClose={onClose} commands={[
      { id: 'a', group: 'Go to', label: 'Jobs', icon: 'arrow', run: () => {} },
      { id: 'b', group: 'Recruiter', label: 'Analyze Maya', icon: 'user', run },
    ]} />)
    await userEvent.type(screen.getByPlaceholderText(/Go to a page/), 'maya{Enter}')
    expect(run).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
