import { useCallback, useEffect, useState } from 'react';
import { BarChart } from '../../components/charts/BarChart';
import { DoughnutChart } from '../../components/charts/DoughnutChart';
import { categoricalPalette, chartColors } from '../../components/charts/chartTheme';
import { PageHeader, StateMessage } from '../../components/common/PageHeader';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { milestone3Api, type DashboardSummary, type DashboardDistribution } from '../../services/milestone3';
import { formatCurrencyCompact } from '../../utils/format';

function words(value: string) { return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()); }
function hasData(series: DashboardDistribution) { return series.values.some((value) => value > 0); }
function EmptyChart({ message }: { message: string }) { return <StateMessage icon="bi-bar-chart" title="No analytics available" message={message} />; }

export function AnalyticsPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await milestone3Api.dashboard()); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Analytics could not be loaded.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  return <><PageHeader title="Dashboard Analytics" subtitle="Project, financial, workforce, resource and procurement metrics calculated from live records." actions={<button className="btn btn-outline-bt" onClick={() => void load()} disabled={loading}><i className="bi bi-arrow-clockwise me-2" />Refresh</button>} />
    {error && <div role="alert" className="alert alert-danger d-flex justify-content-between"><span>{error}</span><button className="btn btn-sm btn-outline-danger" onClick={() => void load()}>Retry</button></div>}
    {loading && <div className="bt-card bt-card-pad"><span className="spinner-border spinner-border-sm me-2" />Loading analytics…</div>}
    {!loading && data && <>
      <div className="row g-3 mb-4">{[
        ['Portfolio budget', formatCurrencyCompact(data.financial.budget_total)],
        ['Recorded spend', formatCurrencyCompact(data.financial.budget_spent)],
        ['Invoice expenditure', formatCurrencyCompact(data.financial.procurement_expenditure)],
        ['Average progress', data.projects.average_progress === null ? 'Unavailable' : `${data.projects.average_progress}%`],
        ['Workers present today', data.workforce.present_today],
        ['Resources allocated', data.resources.allocated],
        ['Procurement requests', data.procurement.total_requests],
        ['Delayed projects', data.projects.delayed],
      ].map(([name, value]) => <div className="col-6 col-xl-3" key={String(name)}><div className="bt-card bt-card-pad h-100"><p className="bt-label mb-2">{name}</p><strong className="h3">{value}</strong></div></div>)}</div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">{data.charts.project_progress.length ? <ChartCard title="Project progress" subtitle="Average completion of recorded milestones by project"><BarChart labels={data.charts.project_progress.map((project) => project.name)} series={[{ label: 'Progress', values:data.charts.project_progress.map((project) => project.progress as number), color: chartColors.accent }]} yMax={100} valueSuffix="%" ariaLabel="Project milestone progress" /></ChartCard> : <div className="bt-card"><EmptyChart message="Add projects and milestones to display project progress." /></div>}</div>
        <div className="col-12 col-xl-5">{hasData(data.charts.procurement_status) ? <ChartCard title="Procurement status" subtitle="Current requests grouped by workflow status"><DoughnutChart labels={data.charts.procurement_status.labels.map(words)} values={data.charts.procurement_status.values} colors={categoricalPalette} centerValue={String(data.procurement.total_requests)} centerCaption="requests" showLegend ariaLabel="Procurement status distribution" /></ChartCard> : <div className="bt-card"><EmptyChart message="No procurement requests are available within your access." /></div>}</div>
        <div className="col-12 col-lg-6">{hasData(data.charts.resource_status) ? <ChartCard title="Resource availability" subtitle="Resources grouped by current operational status"><DoughnutChart labels={data.charts.resource_status.labels.map(words)} values={data.charts.resource_status.values} colors={[chartColors.green, chartColors.blue, chartColors.amber, chartColors.red]} centerValue={String(data.resources.total)} centerCaption="resources" showLegend ariaLabel="Resource status distribution" /></ChartCard> : <div className="bt-card"><EmptyChart message="No resources are assigned to accessible projects." /></div>}</div>
        <div className="col-12 col-lg-6">{hasData(data.charts.workforce_trades) ? <ChartCard title="Workforce by trade" subtitle="Active and inactive workers grouped by recorded trade"><BarChart labels={data.charts.workforce_trades.labels} series={[{ label: 'Workers', values: data.charts.workforce_trades.values, color: chartColors.blue }]} horizontal ariaLabel="Workers grouped by trade" /></ChartCard> : <div className="bt-card"><EmptyChart message="No workforce records are available within your access." /></div>}</div>
      </div>
      <p className="bt-label mt-3 mb-0">Generated {new Date(data.generated_at).toLocaleString()} · Financial expenditure uses invoice amounts only.</p>
    </>}
  </>;
}
