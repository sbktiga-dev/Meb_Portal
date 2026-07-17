'use client';

import { useState, useEffect, useRef } from 'react';

interface DocumentData {
  id: string;
  title: string;
  category: string;
  fileType: string;
  downloads: number;
  description: string | null;
}

interface ReferenceData {
  id: string;
  title: string;
  category: string;
  description: string | null;
  content: Record<string, string[]> | string;
}

const docCategories = ['Договоры', 'Акты', 'ТЗ'];
const refCategories = ['Размеры', 'Нормы', 'Фурнитура', 'Материалы'];

export default function AdminDocumentsPage() {
  const [activeTab, setActiveTab] = useState<'docs' | 'refs'>('docs');
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [refs, setRefs] = useState<ReferenceData[]>([]);
  const [loading, setLoading] = useState(true);

  // Document modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ title: '', description: '', category: 'Договоры' });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState('');
  const docFileRef = useRef<HTMLInputElement>(null);

  // Reference modal
  const [showRefModal, setShowRefModal] = useState(false);
  const [refForm, setRefForm] = useState({ title: '', description: '', category: 'Размеры', content: '' });
  const [refError, setRefError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchDocs = () => {
    if (!token) { window.location.href = '/login'; return; }
    fetch('/api/documents?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDocs(data.documents || []))
      .catch(() => setDocs([]));
  };

  const fetchRefs = () => {
    if (!token) { window.location.href = '/login'; return; }
    fetch('/api/refs?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setRefs(data.references || []))
      .catch(() => setRefs([]));
  };

  useEffect(() => {
    Promise.all([fetchDocs(), fetchRefs()]).finally(() => setLoading(false));
  }, []);

  // Document upload
  const handleDocUpload = async () => {
    if (!docFile || !docForm.title.trim()) { setDocError('Заполните название и выберите файл'); return; }
    setDocUploading(true);
    setDocError('');
    try {
      const fd = new FormData();
      fd.append('file', docFile);
      const uploadRes = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Ошибка загрузки файла');

      const docRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: docForm.title.trim(), description: docForm.description.trim() || null, category: docForm.category, fileUrl: uploadData.url, fileName: docFile.name, fileSize: docFile.size, fileType: docFile.type }),
      });
      if (!docRes.ok) { const d = await docRes.json(); throw new Error(d.error || 'Ошибка'); }

      setShowDocModal(false);
      setDocForm({ title: '', description: '', category: 'Договоры' });
      setDocFile(null);
      fetchDocs();
    } catch (e: unknown) { setDocError(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setDocUploading(false); }
  };

  // Reference create
  const handleRefCreate = async () => {
    if (!refForm.title.trim() || !refForm.content.trim()) { setRefError('Заполните название и содержание'); return; }
    setRefError('');
    try {
      let content: Record<string, string[]>;
      try { content = JSON.parse(refForm.content); } catch { throw new Error('Содержание должно быть в формате JSON: {"ключ": ["значение1", "значение2"]}'); }

      const res = await fetch('/api/refs', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: refForm.title.trim(), description: refForm.description.trim() || null, category: refForm.category, content: JSON.stringify(content) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Ошибка'); }

      setShowRefModal(false);
      setRefForm({ title: '', description: '', category: 'Размеры', content: '' });
      fetchRefs();
    } catch (e: unknown) { setRefError(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const handleDocDelete = async (id: string) => {
    if (!confirm('Удалить документ?')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleRefDelete = async (id: string) => {
    if (!confirm('Удалить справочник?')) return;
    await fetch(`/api/refs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setRefs(prev => prev.filter(r => r.id !== id));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Документы и справочники</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('docs')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'docs' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            Документы ({docs.length})
          </button>
          <button onClick={() => setActiveTab('refs')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'refs' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            Справочники ({refs.length})
          </button>
        </div>

        {/* Documents Tab */}
        {activeTab === 'docs' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowDocModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
                Добавить документ
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Название</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Категория</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Формат</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Загрузки</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {docs.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{doc.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{doc.category}</td>
                      <td className="px-6 py-4 text-sm"><span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs uppercase">{doc.fileType}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{doc.downloads}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button onClick={() => handleDocDelete(doc.id)} className="text-red-500 hover:text-red-700 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {docs.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Документов пока нет</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* References Tab */}
        {activeTab === 'refs' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowRefModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
                Добавить справочник
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Название</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Категория</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Описание</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {refs.map(ref => (
                    <tr key={ref.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{ref.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{ref.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{ref.description || '—'}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button onClick={() => handleRefDelete(ref.id)} className="text-red-500 hover:text-red-700 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {refs.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Справочников пока нет</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDocModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Добавить документ</h2>
            {docError && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">{docError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название *</label>
                <input type="text" value={docForm.title} onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Название документа" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                <textarea value={docForm.description} onChange={e => setDocForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" placeholder="Краткое описание" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория *</label>
                <select value={docForm.category} onChange={e => setDocForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                  {docCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Файл *</label>
                <input ref={docFileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={e => setDocFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                {docFile && <p className="text-xs text-gray-500 mt-1">{docFile.name} ({Math.round(docFile.size / 1024)} KB)</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowDocModal(false); setDocError(''); setDocFile(null); }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors">Отмена</button>
              <button onClick={handleDocUpload} disabled={docUploading} className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                {docUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>}
                Загрузить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Modal */}
      {showRefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRefModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Добавить справочник</h2>
            {refError && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">{refError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название *</label>
                <input type="text" value={refForm.title} onChange={e => setRefForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Название справочника" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                <input type="text" value={refForm.description} onChange={e => setRefForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Краткое описание" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория *</label>
                <select value={refForm.category} onChange={e => setRefForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                  {refCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Содержание (JSON) *</label>
                <textarea value={refForm.content} onChange={e => setRefForm(p => ({ ...p, content: e.target.value }))} rows={8} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" placeholder={'{\n  "Параметр 1": ["Значение 1", "Значение 2"],\n  "Параметр 2": ["Значение 3"]\n}'} />
                <p className="text-xs text-gray-400 mt-1">Формат: {"{\"ключ\": [\"значение1\", \"значение2\"]}"}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowRefModal(false); setRefError(''); }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors">Отмена</button>
              <button onClick={handleRefCreate} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
