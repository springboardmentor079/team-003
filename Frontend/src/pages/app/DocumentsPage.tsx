import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../../components/common/Modal';
import { PageHeader, StateMessage } from '../../components/common/PageHeader';
import { Toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import { projectService } from '../../services';
import { DOCUMENT_EXTENSIONS, DOCUMENT_MAX_BYTES, documentService, type ApiDocument } from '../../services/documentService';
import type { Project } from '../../types';

function fileSize(bytes: number | null) {
  if (bytes === null) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]); const [projectId, setProjectId] = useState('');
  const [documents, setDocuments] = useState<ApiDocument[]>([]); const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General'); const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false); const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null); const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiDocument | null>(null); const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState(''); const [toast, setToast] = useState('');
  const canUpload = user ? ['Administrator', 'Project Manager', 'Site Engineer', 'Contractor'].includes(user.role) : false;

  const refresh = useCallback(async (selectedProject: string) => {
    if (!selectedProject) { setDocuments([]); return; }
    setLoading(true); setError('');
    try { setDocuments(await documentService.list(Number(selectedProject))); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load documents.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { projectService.list().then((rows) => { setProjects(rows); if (rows.length) setProjectId(rows[0].id); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load projects.')); }, []);
  useEffect(() => { void refresh(projectId); }, [projectId, refresh]);

  function chooseFile(selected: File | null) {
    setError(''); setFile(selected);
    if (!selected) return;
    const extension = selected.name.split('.').pop()?.toLowerCase() ?? '';
    if (!DOCUMENT_EXTENSIONS.includes(extension as typeof DOCUMENT_EXTENSIONS[number])) { setFile(null); setFileInputKey((key) => key + 1); setError('File type is not allowed.'); return; }
    if (selected.size > DOCUMENT_MAX_BYTES) { setFile(null); setFileInputKey((key) => key + 1); setError('File exceeds the 20 MB upload limit.'); return; }
    if (!title.trim()) setTitle(selected.name.replace(/\.[^.]+$/, ''));
  }

  async function upload(event: FormEvent) {
    event.preventDefault(); if (!file || !projectId || !title.trim()) return;
    setUploading(true); setError('');
    try {
      await documentService.upload(Number(projectId), title.trim(), category.trim() || 'General', file);
      setTitle(''); setCategory('General'); setFile(null); setFileInputKey((key) => key + 1);
      await refresh(projectId); setToast('Document uploaded successfully.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Document upload failed.'); }
    finally { setUploading(false); }
  }

  async function download(document: ApiDocument) {
    setDownloading(document.id); setError('');
    try { await documentService.download(document); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Document download failed.'); }
    finally { setDownloading(null); }
  }

  async function remove() {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id); setError('');
    try { await documentService.delete(confirmDelete.id); setConfirmDelete(null); await refresh(projectId); setToast('Document deleted successfully.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Document deletion failed.'); }
    finally { setDeleting(null); }
  }

  return <>
    <PageHeader title="Project Documents" subtitle="Securely upload, download and manage files associated with accessible projects." />
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    <section className="bt-card bt-card-pad mb-4">
      <div className="row g-3 mb-3"><div className="col-12 col-md-6"><label className="form-label" htmlFor="documentProject">Project</label><select id="documentProject" className="form-select" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div></div>
      {canUpload && <form onSubmit={upload} className="row g-3 align-items-end">
        <div className="col-12 col-md-4"><label className="form-label" htmlFor="documentTitle">Document title</label><input id="documentTitle" className="form-control" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={255} /></div>
        <div className="col-12 col-md-2"><label className="form-label" htmlFor="documentCategory">Category</label><input id="documentCategory" className="form-control" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={100} /></div>
        <div className="col-12 col-md-4"><label className="form-label" htmlFor="documentFile">File (20 MB maximum)</label><input key={fileInputKey} id="documentFile" className="form-control" type="file" accept={DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(',')} onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} required /><div className="form-text">PDF, Word, Excel, CSV, PNG and JPEG.</div></div>
        <div className="col-12 col-md-2"><button className="btn btn-accent w-100" disabled={uploading || !file || !projectId}>{uploading ? <><span className="spinner-border spinner-border-sm me-2" />Uploading…</> : 'Upload document'}</button></div>
      </form>}
    </section>
    <section className="bt-card"><header className="p-3 border-bottom d-flex justify-content-between align-items-center"><h2 className="h5 mb-0">Documents</h2>{projectId && <button className="btn btn-sm btn-outline-bt" disabled={loading} onClick={() => void refresh(projectId)}><i className="bi bi-arrow-clockwise me-1" />Refresh</button>}</header>
      {loading ? <div className="p-4"><span className="spinner-border spinner-border-sm me-2" />Loading documents…</div> : !projectId ? <StateMessage icon="bi-folder2-open" title="Select a project" message="Choose a project to view its documents." /> : !documents.length ? <StateMessage icon="bi-file-earmark" title="No documents uploaded for this project yet" message={canUpload ? 'Use the upload form to add the first project document.' : 'Documents will appear here when an authorized project member uploads one.'} /> : <div className="table-responsive"><table className="bt-table"><thead><tr><th>Name</th><th>Category</th><th>Type</th><th>Size</th><th>Uploaded by</th><th>Uploaded</th><th>Actions</th></tr></thead><tbody>{documents.map((document) => { const canDelete = user?.role === 'Administrator' || user?.role === 'Project Manager' || String(document.uploaded_by_id) === user?.id; return <tr key={document.id}><td>{document.original_filename ?? document.title}<div className="bt-label">{document.title}</div></td><td>{document.category}</td><td>{document.original_filename?.split('.').pop()?.toUpperCase() ?? 'Unknown'}</td><td>{fileSize(document.file_size)}</td><td>{document.uploaded_by ?? 'Unknown'}</td><td>{new Date(document.created_at).toLocaleDateString()}</td><td><button className="btn btn-outline-bt btn-sm me-2" disabled={downloading === document.id} onClick={() => void download(document)}>{downloading === document.id ? 'Downloading…' : 'Download'}</button>{canDelete && <button className="btn btn-outline-danger btn-sm" disabled={deleting === document.id} onClick={() => setConfirmDelete(document)}>Delete</button>}</td></tr>; })}</tbody></table></div>}
    </section>
    <Modal open={!!confirmDelete} title="Delete document?" description={`Delete “${confirmDelete?.original_filename ?? confirmDelete?.title ?? ''}”? This action cannot be undone.`} onClose={() => !deleting && setConfirmDelete(null)} footer={<><button className="btn btn-outline-bt" disabled={!!deleting} onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" disabled={!!deleting} onClick={() => void remove()}>{deleting ? 'Deleting…' : 'Delete document'}</button></>}><p className="mb-0 text-secondary">The stored file and its database metadata will be removed.</p></Modal>
    {toast && <Toast message={toast} onDismiss={() => setToast('')} />}
  </>;
}
