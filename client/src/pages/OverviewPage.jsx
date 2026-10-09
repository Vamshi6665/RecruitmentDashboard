import { KpiRow } from '../components/KpiRow.jsx'
import { MonthlyPanel } from '../components/MonthlyPanel.jsx'
import { PositionPanel } from '../components/PositionPanel.jsx'
import { StagePanel } from '../components/StagePanel.jsx'
import { RecruiterTable } from '../components/RecruiterTable.jsx'
import { PositionsPanel } from '../components/PositionsPanel.jsx'

export function OverviewPage({ report, meta, onPickRecruiter }) {
  return (
    <>
      <KpiRow kpis={report.kpis} />
      <div className="grid">
        <PositionsPanel positions={report.positions} className="span-12" />
        <MonthlyPanel report={report} asOf={meta.maxDate} className="span-7" />
        <PositionPanel report={report} className="span-5" />
        <StagePanel report={report} className="span-5" />
        <RecruiterTable report={report} className="span-7" onPick={onPickRecruiter} />
      </div>
    </>
  )
}
