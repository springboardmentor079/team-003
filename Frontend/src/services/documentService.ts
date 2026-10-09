import { download, request } from './apiClient';

export const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg'] as const;
export const DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;

export interface ApiDocument {
  id: number;
  project_id: number;
  title: string;
  category: string;
  original_filename: string | null;
  content_type: string | null;
  file_size: number | null;
  uploaded_by_id: number | null;
  uploaded_by: string | null;
  created_at: string;
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  URL.revokeObjectURL(url);
}

export const documentService = {
  list: (projectId?: number) => request<ApiDocument[]>(`/documents${projectId ? `?project_id=${projectId}` : ''}`),
  get: (id: number) => request<ApiDocument>(`/documents/${id}`),
  upload: (projectId: number, title: string, category: string, file: File) => {
    const formData = new FormData();
    formData.set('project_id', String(projectId)); formData.set('title', title);
    formData.set('category', category); formData.set('file', file);
    return request<ApiDocument>('/documents', { method: 'POST', formData });
  },
  download: async (document: ApiDocument) => {
    const result = await download(`/documents/${document.id}/download`);
    save(result.blob, result.filename ?? document.original_filename ?? document.title);
  },
  delete: (id: number) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
};
