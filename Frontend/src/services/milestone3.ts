import { API_BASE_URL, TOKEN_KEY, ApiError } from './apiClient';

export interface ApiVendor { id:number; name:string; contact_person?:string|null; email?:string|null; phone?:string|null; address?:string|null; category?:string|null; status:string; created_at:string; updated_at:string }
export interface ApiRequest { id:number; project_id:number; requested_by_id:number; item_name:string; quantity:number; unit:string; estimated_cost:number; actual_cost:number; status:string; supplier_name?:string|null; notes?:string|null; created_at:string; updated_at:string }
export interface ApiOrder { id:number; po_number:string; project_id:number; vendor_id:number; procurement_id:number|null; created_by_id:number; order_date:string; expected_delivery_date:string|null; total_amount:number; status:string; notes:string|null; created_at:string; updated_at:string }
export interface ApiInvoice { id:number; purchase_order_id:number; invoice_number:string; invoice_date:string|null; due_date:string|null; amount:number; status:string; notes:string|null; created_at:string; updated_at:string }
export interface ApiReport { id:number; project_id:number; generated_by_id:number; title:string; report_type:string; content_json:Record<string,unknown>|null; summary_notes:string|null; created_at:string }
export interface DashboardDistribution { labels:string[]; values:number[] }
export interface DashboardProject { id:number; name:string; status:string; progress:number|null; budget:number; spent_budget:number }
export interface DashboardSummary {
  user_role:string; full_name:string; generated_at:string;
  projects:{total:number;active:number;completed:number;planned:number;delayed:number;average_progress:number|null};
  workforce:{total:number;active:number;present_today:number;absent_today:number};
  resources:{total:number;available:number;allocated:number;maintenance:number};
  procurement:{total_requests:number;pending:number;approved:number;rejected:number;ordered:number;delivered:number;completed:number;purchase_orders:number;vendors:number};
  financial:{budget_total:number;budget_spent:number;budget_remaining:number;budget_utilization_percentage:number|null;procurement_expenditure:number;procurement_expenditure_source:string};
  inventory:{low_stock:number};
  administration:{total_users:number;active_users:number;generated_reports:number;vendors:number}|null;
  charts:{project_status:DashboardDistribution;project_progress:DashboardProject[];procurement_status:DashboardDistribution;resource_status:DashboardDistribution;resource_types:DashboardDistribution;workforce_trades:DashboardDistribution;attendance_today:DashboardDistribution};
  recent_projects:DashboardProject[];
  recent_procurement:{id:number;project:string;item:string;status:string;created_at:string}[];
}

async function api<T>(path:string, init:RequestInit={}):Promise<T> {
  const token=localStorage.getItem(TOKEN_KEY);
  const headers=new Headers(init.headers);
  if(token) headers.set('Authorization',`Bearer ${token}`);
  if(init.body && !(init.body instanceof FormData)) headers.set('Content-Type','application/json');
  let response:Response;
  try { response=await fetch(`${API_BASE_URL}${path}`,{...init,headers}); }
  catch { throw new ApiError('Cannot reach the BuildTrack server.',0); }
  if(response.status===204) return undefined as T;
  const body=await response.text(); const value=body?JSON.parse(body):null;
  if(!response.ok) throw new ApiError(typeof value?.detail==='string'?value.detail:`Request failed (${response.status}).`,response.status);
  return value as T;
}
const json=(method:string,body?:unknown):RequestInit=>({method,...(body===undefined?{}:{body:JSON.stringify(body)})});

export const milestone3Api={
  vendors:()=>api<ApiVendor[]>('/procurement/vendors'),
  createVendor:(body:Partial<ApiVendor>)=>api<ApiVendor>('/procurement/vendors',json('POST',body)),
  updateVendor:(id:number,body:Partial<ApiVendor>)=>api<ApiVendor>(`/procurement/vendors/${id}`,json('PUT',body)),
  deleteVendor:(id:number)=>api<void>(`/procurement/vendors/${id}`,json('DELETE')),
  requests:()=>api<ApiRequest[]>('/procurement'),
  createRequest:(body:Pick<ApiRequest,'project_id'|'item_name'|'quantity'|'unit'|'estimated_cost'|'supplier_name'|'notes'>)=>api<ApiRequest>('/procurement',json('POST',body)),
  updateRequest:(id:number,body:Partial<ApiRequest>)=>api<ApiRequest>(`/procurement/${id}`,json('PUT',body)),
  setRequestStatus:(id:number,status:string)=>api<ApiRequest>(`/procurement/${id}/status?new_status=${encodeURIComponent(status)}`,json('PUT')),
  deleteRequest:(id:number)=>api<void>(`/procurement/${id}`,json('DELETE')),
  orders:()=>api<ApiOrder[]>('/procurement/purchase-orders'),
  createOrder:(body:Pick<ApiOrder,'project_id'|'vendor_id'|'procurement_id'|'expected_delivery_date'|'total_amount'|'notes'>)=>api<ApiOrder>('/procurement/purchase-orders',json('POST',body)),
  updateOrder:(id:number,body:Partial<ApiOrder>)=>api<ApiOrder>(`/procurement/purchase-orders/${id}`,json('PUT',body)),
  invoices:()=>api<ApiInvoice[]>('/procurement/invoices'),
  createInvoice:(body:Pick<ApiInvoice,'purchase_order_id'|'invoice_number'|'amount'|'invoice_date'|'due_date'|'status'|'notes'>)=>api<ApiInvoice>('/procurement/invoices',json('POST',body)),
  updateInvoice:(id:number,body:Partial<ApiInvoice>)=>api<ApiInvoice>(`/procurement/invoices/${id}`,json('PUT',body)),
  reports:()=>api<ApiReport[]>('/reports'),
  dashboard:()=>api<DashboardSummary>('/analytics/dashboard/role-summary'),
  generateReport:(body:{project_id:number;title:string;report_type:string;summary_notes?:string})=>api<ApiReport>('/reports/generate',json('POST',body)),
  async exportReport(id:number,format:'pdf'|'xlsx'){
    const token=localStorage.getItem(TOKEN_KEY);const response=await fetch(`${API_BASE_URL}/reports/${id}/export?format=${format}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
    if(!response.ok) throw new ApiError('Report export failed.',response.status);
    const url=URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;a.download=`report-${id}.${format}`;a.click();URL.revokeObjectURL(url);
  }
};
