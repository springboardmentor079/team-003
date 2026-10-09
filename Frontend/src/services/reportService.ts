import { download, request } from './apiClient';

export type ReportType = 'project-progress' | 'resources' | 'workforce' | 'procurement' | 'budget-cost';
export type ReportFilters = {
  projectId?: number;
  vendorId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};
export interface ReportResult {
  report_type: ReportType;
  generated_at: string;
  filters: Record<string, string | number>;
  summary: Record<string, string | number | null>;
  data: Record<string, unknown>[];
}

function query(filters: ReportFilters, format?: 'pdf' | 'xlsx') {
  const params = new URLSearchParams();
  if (filters.projectId) params.set('project_id', String(filters.projectId));
  if (filters.vendorId) params.set('vendor_id', String(filters.vendorId));
  if (filters.status) params.set('status', filters.status);
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  if (format) params.set('format', format);
  const value = params.toString();
  return value ? `?${value}` : '';
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const reportService = {
  generate: (type: ReportType, filters: ReportFilters) =>
    request<ReportResult>(`/reports/${type}${query(filters)}`),
  export: async (type: ReportType, filters: ReportFilters, format: 'pdf' | 'xlsx') => {
    const result = await download(`/reports/exports/${type}${query(filters, format)}`);
    save(result.blob, result.filename ?? `buildtrack_${type.replaceAll('-', '_')}.${format}`);
  },
};
