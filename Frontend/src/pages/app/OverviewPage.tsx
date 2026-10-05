import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, StateMessage } from '../../components/common/PageHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { milestone3Api, type DashboardSummary } from '../../services/milestone3';
import { formatCurrencyCompact } from '../../utils/format';

export function OverviewPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await milestone3Api.dashboard()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Dashboard could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const cards = data ? [
    ['Total projects', data.projects.total, 'bi-buildings'],
    ['Active projects', data.projects.active, 'bi-activity'],
    ['Active workforce', data.workforce.active, 'bi-people'],
    ['Resources', data.resources.total, 'bi-truck-front'],
    ['Pending procurement', data.procurement.pending, 'bi-hourglass-split'],
    ['Purchase orders', data.procurement.purchase_orders, 'bi-receipt'],
    ['Invoice expenditure', formatCurrencyCompact(data.financial.procurement_expenditure), 'bi-cash-stack'],
    ['Low stock alerts', data.inventory.low_stock, 'bi-exclamation-triangle'],
  ] : [];

  return <>
    <PageHeader title="Project Overview" subtitle="Live portfolio and operational status from BuildTrack records." actions={<button className="btn btn-outline-bt" onClick={() => void load()} disabled={loading}><i className="bi bi-arrow-clockwise me-2" />Refresh</button>} />
    {error && <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert"><span>{error}</span><button className="btn btn-sm btn-outline-danger" onClick={() => void load()}>Retry</button></div>}
    {loading && <div className="bt-card bt-card-pad"><span className="spinner-border spinner-border-sm me-2" />Loading dashboard…</div>}
    {!loading && data && <>
      <div className="row g-3 mb-4">{cards.map(([label, value, icon]) => <div className="col-6 col-lg-3" key={String(label)}><div className="bt-card bt-card-pad h-100"><div className="d-flex justify-content-between"><p className="bt-label mb-2">{label}</p><i className={`bi ${icon} bt-text-dim`} /></div><strong className="h3">{value}</strong></div></div>)}</div>
      {data.administration && <section className="bt-card bt-card-pad mb-4"><h2 className="h5">Administration</h2><div className="row g-3"><div className="col-6 col-md-3"><span className="bt-label">Users</span><div className="h4">{data.administration.total_users}</div></div><div className="col-6 col-md-3"><span className="bt-label">Active users</span><div className="h4">{data.administration.active_users}</div></div><div className="col-6 col-md-3"><span className="bt-label">Generated reports</span><div className="h4">{data.administration.generated_reports}</div></div><div className="col-6 col-md-3"><span className="bt-label">Vendors</span><div className="h4">{data.administration.vendors}</div></div></div></section>}
      <div className="row g-4">
        <div className="col-12 col-xl-7"><section className="bt-card h-100"><header className="p-3 border-bottom d-flex justify-content-between"><h2 className="h5 mb-0">Recent project progress</h2><Link to="/app/analytics">View analytics</Link></header>{!data.recent_projects.length ? <StateMessage icon="bi-building" title="No projects available" message="Projects within your access will appear here." /> : <div className="table-responsive"><table className="bt-table"><thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Budget used</th></tr></thead><tbody>{data.recent_projects.map((project) => <tr key={project.id}><td><Link to={`/app/projects/PRJ-${String(project.id).padStart(3, '0')}`}>{project.name}</Link></td><td><StatusBadge status={project.status} /></td><td>{project.progress === null ? 'No milestones' : <ProgressBar value={project.progress} label={`${project.name} progress`} />}</td><td>{formatCurrencyCompact(project.spent_budget)} / {formatCurrencyCompact(project.budget)}</td></tr>)}</tbody></table></div>}</section></div>
        <div className="col-12 col-xl-5"><section className="bt-card h-100"><header className="p-3 border-bottom d-flex justify-content-between"><h2 className="h5 mb-0">Recent procurement</h2><Link to="/app/procurement">View procurement</Link></header>{!data.recent_procurement.length ? <StateMessage icon="bi-cart3" title="No procurement activity" message="Recent requests within your access will appear here." /> : <div className="table-responsive"><table className="bt-table"><thead><tr><th>Item</th><th>Project</th><th>Status</th></tr></thead><tbody>{data.recent_procurement.map((row) => <tr key={row.id}><td>{row.item}</td><td>{row.project}</td><td><StatusBadge status={row.status} /></td></tr>)}</tbody></table></div>}</section></div>
      </div>
    </>}
  </>;
}
