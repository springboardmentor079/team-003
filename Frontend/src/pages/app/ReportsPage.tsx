import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader, StateMessage } from '../../components/common/PageHeader';
import { projectService } from '../../services';
import { milestone3Api, type ApiVendor } from '../../services/milestone3';
import { reportService, type ReportFilters, type ReportResult, type ReportType } from '../../services/reportService';
import type { Project } from '../../types';

const reportTypes: { value: ReportType; label: string }[] = [
  { value: 'project-progress', label: 'Project Progress' },
  { value: 'resources', label: 'Resource Utilization' },
  { value: 'workforce', label: 'Workforce' },
  { value: 'procurement', label: 'Procurement' },
  { value: 'budget-cost', label: 'Budget / Cost' },
];
const statusOptions: Partial<Record<ReportType, string[]>> = {
  'project-progress': ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'],
  resources: ['available', 'allocated', 'maintenance', 'decommissioned'],
  workforce: ['active', 'inactive'],
  procurement: ['pending', 'approved', 'rejected', 'ordered', 'delivered', 'completed'],
};
function label(value: string) { return value.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleDateString();
  return String(value);
}

export function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]); const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [reportType, setReportType] = useState<ReportType>('project-progress'); const [projectId, setProjectId] = useState('');
  const [vendorId, setVendorId] = useState(''); const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState(''); const [dateTo, setDateTo] = useState('');
  const [result, setResult] = useState<ReportResult | null>(null); const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null); const [error, setError] = useState('');

  useEffect(() => { Promise.all([projectService.list(), milestone3Api.vendors()]).then(([p, v]) => { setProjects(p); setVendors(v); }).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load report filters.')); }, []);
  function changeType(type: ReportType) { setReportType(type); setStatus(''); setVendorId(''); setResult(null); setError(''); }
  const filters = useMemo<ReportFilters>(() => ({ projectId: projectId ? Number(projectId) : undefined, vendorId: reportType === 'procurement' && vendorId ? Number(vendorId) : undefined, status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }), [dateFrom, dateTo, projectId, reportType, status, vendorId]);
  async function generate(event: FormEvent) { event.preventDefault(); if (dateFrom && dateTo && dateFrom > dateTo) { setError('From date must be on or before To date.'); return; } setLoading(true); setError(''); setResult(null); try { setResult(await reportService.generate(reportType, filters)); } catch (e) { setError(e instanceof Error ? e.message : 'Report generation failed.'); } finally { setLoading(false); } }
  async function exportReport(format: 'pdf' | 'xlsx') { setExporting(format); setError(''); try { await reportService.export(reportType, filters, format); } catch (e) { setError(e instanceof Error ? e.message : 'Report export failed.'); } finally { setExporting(null); } }
  const headers = result?.data.length ? Object.keys(result.data[0]) : []; const statuses = statusOptions[reportType] ?? [];

  return <><PageHeader title="Reports & Documentation" subtitle="Generate operational reports from current BuildTrack database records." />
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <section className="bt-card bt-card-pad mb-4"><form onSubmit={generate} className="row g-3 align-items-end">
      <div className="col-12 col-md-4 col-xl-3"><label className="form-label" htmlFor="reportType">Report type</label><select id="reportType" className="form-select" value={reportType} onChange={(e) => changeType(e.target.value as ReportType)}>{reportTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
      <div className="col-12 col-md-4 col-xl-3"><label className="form-label" htmlFor="reportProject">Project</label><select id="reportProject" className="form-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">All accessible projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
      {reportType === 'procurement' && <div className="col-12 col-md-4 col-xl-3"><label className="form-label" htmlFor="reportVendor">Vendor</label><select id="reportVendor" className="form-select" value={vendorId} onChange={(e) => setVendorId(e.target.value)}><option value="">All vendors</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></div>}
      {!!statuses.length && <div className="col-12 col-md-4 col-xl-2"><label className="form-label" htmlFor="reportStatus">Status</label><select id="reportStatus" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></div>}
      <div className="col-12 col-md-4 col-xl-2"><label className="form-label" htmlFor="reportFrom">From</label><input id="reportFrom" type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
      <div className="col-12 col-md-4 col-xl-2"><label className="form-label" htmlFor="reportTo">To</label><input id="reportTo" type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
      <div className="col-12 col-md-4 col-xl-2"><button className="btn btn-accent w-100" disabled={loading}>{loading ? 'Generating…' : 'Generate report'}</button></div>
    </form></section>
    {loading && <section className="bt-card"><StateMessage icon="bi-hourglass-split" title="Generating report" message="Calculating results from current database records." /></section>}
    {!loading && result && <><section className="row g-3 mb-4" aria-label="Report summary">{Object.entries(result.summary).map(([key, value]) => <div className="col-6 col-lg-3" key={key}><div className="bt-card bt-card-pad h-100"><div className="text-secondary small">{label(key)}</div><div className="h4 mb-0 mt-2">{display(value)}</div></div></div>)}</section>
      <section className="bt-card"><header className="p-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2"><div><h2 className="h5 mb-1">{label(result.report_type)} report</h2><div className="text-secondary small">Generated {new Date(result.generated_at).toLocaleString()}</div></div><div className="d-flex gap-2"><button className="btn btn-outline-bt btn-sm" disabled={!result.data.length || !!exporting} onClick={() => void exportReport('pdf')}>{exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}</button><button className="btn btn-outline-bt btn-sm" disabled={!result.data.length || !!exporting} onClick={() => void exportReport('xlsx')}>{exporting === 'xlsx' ? 'Exporting…' : 'Export Excel'}</button></div></header>
        {!result.data.length ? <StateMessage icon="bi-file-earmark-bar-graph" title="No report records found" message="No database records match the selected filters." /> : <div className="table-responsive"><table className="bt-table"><thead><tr>{headers.map((header) => <th key={header}>{label(header)}</th>)}</tr></thead><tbody>{result.data.map((row, index) => <tr key={String(row.id ?? row.project_id ?? row.worker_id ?? row.resource_id ?? row.request_id ?? index)}>{headers.map((header) => <td key={header}>{display(row[header])}</td>)}</tr>)}</tbody></table></div>}
      </section></>}
    {!loading && !result && <section className="bt-card"><StateMessage icon="bi-file-earmark-bar-graph" title="Choose a report" message="Select filters and generate a report to view live results." /></section>}
  </>;
}
