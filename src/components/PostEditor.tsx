'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { EditorBlock, getTemplatesForRole, createBlockFromType, BLOCK_TYPES, extractVideoEmbed } from '@/lib/postTemplates';

interface PostEditorProps {
  userRole: string;
  onPublish: (data: { title: string; content: string; category: string; images: string[]; tags: string[] }) => void;
  onCancel: () => void;
}

const DRAFT_KEY = 'mebportal_post_draft';
const CUSTOM_TEMPLATES_KEY = 'mebportal_custom_templates';
const CANVAS_W = 800;
const CANVAS_H = 1200;

interface CustomTemplate {
  id: string;
  name: string;
  blocks: EditorBlock[];
  category: string;
  createdAt: string;
}

export default function PostEditor({ userRole, onPublish, onCancel }: PostEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('news');
  const [tags, setTags] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [undoStack, setUndoStack] = useState<EditorBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorBlock[][]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; origW: number; origH: number; origX: number; origY: number; corner: string } | null>(null);

  const templates = getTemplatesForRole(userRole);

  // Load custom templates
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (saved) { try { setCustomTemplates(JSON.parse(saved)); } catch { /* */ } }
  }, []);

  const saveCustomTemplate = () => {
    if (!templateName.trim()) { toast.error('Введите название'); return; }
    if (blocks.length === 0) { toast.error('Добавьте блоки'); return; }
    const t: CustomTemplate = { id: Date.now().toString(36), name: templateName.trim(), blocks: JSON.parse(JSON.stringify(blocks)), category, createdAt: new Date().toISOString() };
    const updated = [...customTemplates, t];
    setCustomTemplates(updated);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
    setTemplateName('');
    setShowSaveTemplate(false);
    toast.success('Шаблон сохранён!');
  };

  const deleteCustomTemplate = (id: string) => {
    if (!confirm('Удалить шаблон?')) return;
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
  };

  const selectCustomTemplate = (template: CustomTemplate) => {
    setBlocks(JSON.parse(JSON.stringify(template.blocks)));
    setCategory(template.category || 'news');
    setShowTemplates(false);
    if (template.blocks.length > 0) setSelectedBlockId(template.blocks[0].id);
  };

  // Load draft
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.blocks?.length > 0 && draft.title) {
          if (confirm('Найден черновик. Восстановить?')) {
            setBlocks(draft.blocks);
            setTitle(draft.title || '');
            setCategory(draft.category || 'news');
            setTags(draft.tags || '');
            setShowTemplates(false);
          }
        }
      } catch { /* */ }
    }
  }, []);

  // Auto-save
  useEffect(() => {
    if (showTemplates || blocks.length === 0) return;
    const timer = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ blocks, title, category, tags }));
    }, 30000);
    return () => clearInterval(timer);
  }, [blocks, title, category, tags, showTemplates]);

  // Undo/Redo
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); handleRedo(); }
      if (e.key === 'Escape') { setSelectedBlockId(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undoStack, redoStack]);

  const saveUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-49), blocks]);
    setRedoStack([]);
  }, [blocks]);

  const handleUndo = () => { if (!undoStack.length) return; setRedoStack(r => [...r, blocks]); setBlocks(undoStack[undoStack.length - 1]); setUndoStack(u => u.slice(0, -1)); };
  const handleRedo = () => { if (!redoStack.length) return; setUndoStack(u => [...u, blocks]); setBlocks(redoStack[redoStack.length - 1]); setRedoStack(r => r.slice(0, -1)); };

  const selectTemplate = (template: { blocks: Omit<EditorBlock, 'id' | 'order'>[]; category: string }) => {
    const nextY = 20;
    let curY = nextY;
    const newBlocks = template.blocks.map((b, i) => {
      const w = b.type === 'divider' ? CANVAS_W - 40 : CANVAS_W - 40;
      const block: EditorBlock = {
        ...b,
        id: Math.random().toString(36).slice(2, 10),
        order: i,
        x: 20,
        y: curY,
        w: b.type === 'divider' ? CANVAS_W - 40 : 360,
        h: undefined,
      };
      curY += (b.type === 'heading' ? 60 : b.type === 'text' ? 80 : b.type === 'image' || b.type === 'video' ? 250 : b.type === 'gallery' ? 200 : b.type === 'quote' ? 80 : b.type === 'button' ? 50 : 20) + 20;
      return block;
    });
    setBlocks(newBlocks);
    setCategory(template.category);
    setShowTemplates(false);
    if (newBlocks.length > 0) setSelectedBlockId(newBlocks[0].id);
  };

  const addBlock = (type: EditorBlock['type']) => {
    saveUndo();
    const lastBlock = blocks[blocks.length - 1];
    const newY = lastBlock ? (lastBlock.y || 0) + (lastBlock.h || 80) + 20 : 20;
    const newBlock = createBlockFromType(type);
    newBlock.x = 20;
    newBlock.y = newY;
    newBlock.w = type === 'divider' ? CANVAS_W - 40 : 360;
    newBlock.h = undefined;
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const removeBlock = (id: string) => { saveUndo(); setBlocks(prev => prev.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };

  const duplicateBlock = (id: string) => {
    saveUndo();
    setBlocks(prev => {
      const b = prev.find(x => x.id === id);
      if (!b) return prev;
      const copy = { ...b, id: Math.random().toString(36).slice(2, 10), x: (b.x || 0) + 20, y: (b.y || 0) + 20 };
      return [...prev, copy];
    });
  };

  const updateBlockContent = (id: string, content: Record<string, any>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  // Mouse handlers for drag & resize
  const handleBlockMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedBlockId(id);
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    setDragging({ id, startX: e.clientX, startY: e.clientY, origX: block.x || 0, origY: block.y || 0 });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string, corner: string) => {
    e.stopPropagation();
    setSelectedBlockId(id);
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    setResizing({ id, startX: e.clientX, startY: e.clientY, origW: block.w || 360, origH: block.h || 80, origX: block.x || 0, origY: block.y || 0, corner });
  };

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = e.clientX - dragging.startX;
        const dy = e.clientY - dragging.startY;
        setBlocks(prev => prev.map(b => b.id === dragging.id ? { ...b, x: Math.max(0, dragging.origX + dx), y: Math.max(0, dragging.origY + dy) } : b));
      }
      if (resizing) {
        const dx = e.clientX - resizing.startX;
        const dy = e.clientY - resizing.startY;
        const corner = resizing.corner;
        setBlocks(prev => prev.map(b => {
          if (b.id !== resizing.id) return b;
          let newW = resizing.origW;
          let newH = resizing.origH;
          let newX = resizing.origX;
          let newY = resizing.origY;
          if (corner.includes('e')) newW = Math.max(80, resizing.origW + dx);
          if (corner.includes('w')) { newW = Math.max(80, resizing.origW - dx); newX = resizing.origX + (resizing.origW - newW); }
          if (corner.includes('s')) newH = Math.max(40, resizing.origH + dy);
          if (corner.includes('n')) { newH = Math.max(40, resizing.origH - dy); newY = resizing.origY + (resizing.origH - newH); }
          return { ...b, w: newW, h: newH, x: newX, y: newY };
        }));
      }
    };
    const handleMouseUp = () => { setDragging(null); setResizing(null); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [dragging, resizing]);

  const handlePublish = async () => {
    if (!title.trim()) { toast.error('Введите заголовок'); return; }
    if (blocks.length === 0) { toast.error('Добавьте хотя бы один блок'); return; }
    setPublishing(true);
    try {
      const sorted = [...blocks].sort((a, b) => (a.y || 0) - (b.y || 0));
      const contentParts = sorted.map(b => {
        switch (b.type) {
          case 'heading': return `## ${b.content.text}`;
          case 'text': return b.content.text;
          case 'image': return b.content.url ? `![${b.content.caption}](${b.content.url})` : '';
          case 'video': return b.content.embedUrl ? `![](${b.content.embedUrl})` : '';
          case 'gallery': return (b.content.images || []).filter(Boolean).map((url: string, i: number) => `![Фото ${i + 1}](${url})`).join('\n');
          case 'quote': return `> ${b.content.text}\n— ${b.content.author}`;
          case 'divider': return '---';
          case 'button': return b.content.url ? `[${b.content.text}](${b.content.url})` : b.content.text;
          default: return '';
        }
      }).filter(Boolean).join('\n\n');
      const images = blocks.filter(b => b.type === 'image' && b.content.url).map(b => b.content.url)
        .concat(blocks.filter(b => b.type === 'gallery').flatMap(b => (b.content.images || []).filter(Boolean)))
        .concat(blocks.filter(b => b.type === 'video' && b.content.embedUrl).map(b => b.content.embedUrl));
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      localStorage.removeItem(DRAFT_KEY);
      onPublish({ title, content: contentParts, category, images, tags: tagList });
    } catch { toast.error('Ошибка'); }
    finally { setPublishing(false); }
  };

  // Template selection
  if (showTemplates) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Выберите шаблон</h2><p className="text-gray-500 mt-1">Или начните с пустого холста</p></div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {templates.map(t => (
            <button key={t.id} onClick={() => selectTemplate(t)} className="text-left p-5 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-brand-400 hover:shadow-lg transition-all group">
              <div className="text-3xl mb-3">{t.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-600">{t.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{t.description}</p>
            </button>
          ))}
        </div>
        {customTemplates.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Мои шаблоны</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {customTemplates.map(ct => (
                <div key={ct.id} className="relative group">
                  <button onClick={() => deleteCustomTemplate(ct.id)} className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  <button onClick={() => selectCustomTemplate(ct)} className="w-full text-left p-5 bg-white dark:bg-gray-800 rounded-2xl border-2 border-brand-100 dark:border-brand-900 hover:border-brand-400 hover:shadow-lg transition-all group">
                    <div className="text-2xl mb-2">📝</div>
                    <h3 className="font-bold text-gray-900 group-hover:text-brand-600">{ct.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{ct.blocks.length} блоков</p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Preview
  if (showPreview) {
    const sorted = [...blocks].sort((a, b) => (a.y || 0) - (b.y || 0));
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Назад</button>
          <span className="text-sm font-medium text-gray-500">Предпросмотр</span>
          <button onClick={handlePublish} disabled={publishing} className="px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">{publishing ? '...' : 'Опубликовать'}</button>
        </div>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">{title || 'Без заголовка'}</h1>
            <div className="relative" style={{ minHeight: CANVAS_H }}>
              {sorted.map(block => (
                <div key={block.id} className="absolute" style={{ left: block.x, top: block.y, width: block.w || CANVAS_W - 40 }}>
                  {block.type === 'heading' && <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{block.content.text}</h2>}
                  {block.type === 'text' && <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{block.content.text}</p>}
                  {block.type === 'image' && block.content.url && <div className="relative rounded-xl overflow-hidden"><Image src={block.content.url} alt="" width={600} height={400} className="w-full h-auto rounded-xl" unoptimized /></div>}
                  {block.type === 'video' && block.content.embedUrl && <div className="relative rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}><iframe src={block.content.embedUrl} className="absolute inset-0 w-full h-full rounded-xl" allowFullScreen /></div>}
                  {block.type === 'gallery' && <div className="grid grid-cols-2 gap-2">{(block.content.images || []).filter(Boolean).map((url: string, i: number) => <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"><Image src={url} alt="" fill className="object-cover" sizes="200px" unoptimized /></div>)}</div>}
                  {block.type === 'quote' && <blockquote className="border-l-4 border-brand-400 pl-4 py-2"><p className="text-gray-700 italic">{block.content.text}</p>{block.content.author && <cite className="text-sm text-gray-500 mt-1 block">— {block.content.author}</cite>}</blockquote>}
                  {block.type === 'divider' && <hr className="border-gray-200 my-4" />}
                  {block.type === 'button' && <a href={block.content.url || '#'} className="inline-block px-6 py-3 bg-brand-500 text-white rounded-xl font-medium">{block.content.text}</a>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editor
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="h-14 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowTemplates(true)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Шаблоны</button>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-600" />
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Заголовок..." className="text-lg font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none w-64 md:w-96" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleUndo} disabled={!undoStack.length} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
          <button onClick={handleRedo} disabled={!redoStack.length} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-8l-6 6m6-6l-6-6" /></svg></button>
          <button onClick={() => setShowPreview(true)} className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50">Предпросмотр</button>
          <button onClick={() => { localStorage.setItem(DRAFT_KEY, JSON.stringify({ blocks, title, category, tags })); toast.success('Сохранено'); }} className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50">Черновик</button>
          <button onClick={() => setShowSaveTemplate(true)} className="px-3 py-1.5 text-sm text-brand-500 border border-brand-200 rounded-lg hover:bg-brand-50">Шаблон</button>
          <button onClick={handlePublish} disabled={publishing} className="px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">Опубликовать</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-52 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-3 overflow-y-auto shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Блоки</h3>
          <div className="space-y-1.5">
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} onClick={() => addBlock(bt.type)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors text-sm text-gray-700 dark:text-gray-300 text-left">
                <span className="w-7 h-7 rounded-md bg-white dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-brand-500 shrink-0 border border-gray-200">{bt.icon}</span>
                {bt.label}
              </button>
            ))}
          </div>
          <div className="mt-6"><h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Категория</h3>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
              <option value="news">Новость</option><option value="project">Проект</option><option value="article">Статья</option><option value="product">Товар</option>
            </select></div>
          <div className="mt-4"><h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Теги</h3>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Через запятую" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" /></div>
          {selectedBlockId && (
            <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Размер</h3>
              <div className="space-y-1.5">
                {[
                  { w: 200, h: 150, label: 'Маленький' },
                  { w: 360, h: 200, label: 'Средний' },
                  { w: 500, h: 300, label: 'Большой' },
                  { w: CANVAS_W - 40, h: 200, label: 'На всю ширину' },
                  { w: 200, h: 400, label: 'Вертикальный' },
                  { w: 360, h: 500, label: 'Высокий' },
                ].map(s => (
                  <button key={s.label} onClick={() => setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, w: s.w, h: s.h } : b))}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-white dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors">{s.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto" style={{ width: CANVAS_W }}>
            <div ref={canvasRef}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
              style={{ width: CANVAS_W, height: CANVAS_H, backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '16px 16px' }}>

              {blocks.map(block => {
                const isSelected = selectedBlockId === block.id;
                return (
                  <div key={block.id}
                    className={`absolute group ${isSelected ? 'z-10' : 'z-0'}`}
                    style={{ left: block.x, top: block.y, width: block.w || 360, minHeight: block.h || 60 }}
                    onMouseDown={e => handleBlockMouseDown(e, block.id)}>

                    {/* Block content */}
                    <div className={`w-full h-full rounded-xl border-2 overflow-hidden transition-shadow ${isSelected ? 'border-brand-400 shadow-lg ring-2 ring-brand-200' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 shadow-sm'}`}
                      style={{ minHeight: block.h || 60 }}>
                      <div className="p-3 h-full">
                        <BlockRenderer block={block} onChange={c => updateBlockContent(block.id, c)} />
                      </div>
                    </div>

                    {/* Resize handles — 4 corners + 4 edges */}
                    {isSelected && (
                      <>
                        {/* Corners */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-brand-400 rounded-sm cursor-nw-resize shadow" onMouseDown={e => handleResizeMouseDown(e, block.id, 'nw')} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-brand-400 rounded-sm cursor-ne-resize shadow" onMouseDown={e => handleResizeMouseDown(e, block.id, 'ne')} />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-brand-400 rounded-sm cursor-sw-resize shadow" onMouseDown={e => handleResizeMouseDown(e, block.id, 'sw')} />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-brand-400 rounded-sm cursor-se-resize shadow" onMouseDown={e => handleResizeMouseDown(e, block.id, 'se')} />
                        {/* Edges */}
                        <div className="absolute -top-1 left-3 right-3 h-1.5 cursor-n-resize" onMouseDown={e => handleResizeMouseDown(e, block.id, 'n')} />
                        <div className="absolute -bottom-1 left-3 right-3 h-1.5 cursor-s-resize" onMouseDown={e => handleResizeMouseDown(e, block.id, 's')} />
                        <div className="absolute top-3 bottom-3 -left-1.5 w-1.5 cursor-w-resize" onMouseDown={e => handleResizeMouseDown(e, block.id, 'w')} />
                        <div className="absolute top-3 bottom-3 -right-1.5 w-1.5 cursor-e-resize" onMouseDown={e => handleResizeMouseDown(e, block.id, 'e')} />
                      </>
                    )}

                    {/* Type badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <span className="bg-brand-100 dark:bg-brand-900/50 text-[9px] text-brand-600 px-2 py-0.5 rounded-full font-medium shadow">{BLOCK_TYPES.find(bt => bt.type === block.type)?.label}</span>
                    </div>

                    {/* Actions */}
                    {isSelected && (
                      <div className="absolute -top-3 right-0 flex gap-1 z-20">
                        <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id); }} className="p-1 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100"><svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                        <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }} className="p-1 bg-white dark:bg-gray-700 rounded shadow hover:bg-red-50"><svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Save template modal */}
      {showSaveTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSaveTemplate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Сохранить как шаблон</h3>
            <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Название шаблона" autoFocus className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg mb-4" onKeyDown={e => { if (e.key === 'Enter') saveCustomTemplate(); }} />
            <div className="flex gap-2">
              <button onClick={saveCustomTemplate} className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600">Сохранить</button>
              <button onClick={() => setShowSaveTemplate(false)} className="px-5 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Block Renderer
function BlockRenderer({ block, onChange }: { block: EditorBlock; onChange: (c: Record<string, any>) => void }) {
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (textRef.current && block.type === 'text' && textRef.current.innerText !== (block.content.text || '')) textRef.current.innerText = block.content.text || ''; }, [block.content.text, block.type]);

  switch (block.type) {
    case 'heading': return <input type="text" value={block.content.text || ''} onChange={e => onChange({ ...block.content, text: e.target.value })} placeholder="Заголовок" className="w-full font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none text-xl" />;
    case 'text': {
      const fontFamily = block.content.fontFamily || 'sans';
      const textEffect = block.content.textEffect || 'none';
      const fontClasses: Record<string, string> = {
        sans: 'font-sans', serif: 'font-serif', mono: 'font-mono',
        hand: 'font-["Caveat",cursive]', display: 'font-["Playfair_Display",serif]',
      };
      const effectStyles: Record<string, React.CSSProperties> = {
        none: {},
        arc: { borderRadius: '50%', transform: 'rotate(-3deg)', padding: '10px 0' },
        wave: { letterSpacing: '2px', transform: 'skewX(-3deg)' },
        line: { borderLeft: '3px solid #f97316', paddingLeft: '12px' },
      };
      return (
        <div className="space-y-1">
          {/* Text toolbar */}
          <div className="flex gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
            <button onClick={() => document.execCommand('bold')} className="p-1 text-xs font-bold text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100" title="Жирный">B</button>
            <button onClick={() => document.execCommand('italic')} className="p-1 text-xs italic text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100" title="Курсив">I</button>
            <button onClick={() => document.execCommand('underline')} className="p-1 text-xs underline text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100" title="Подчёркнутый">U</button>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <select onChange={e => {
              const sel = window.getSelection();
              if (sel && sel.rangeCount) {
                document.execCommand('fontName', false, e.target.value);
              }
              onChange({ ...block.content, fontFamily: e.target.value });
            }} value={fontFamily} className="text-[10px] border border-gray-200 rounded px-1 bg-white dark:bg-gray-700 text-gray-600" title="Шрифт">
              <option value="sans">Sans</option>
              <option value="serif">Serif</option>
              <option value="mono">Mono</option>
              <option value="hand">Рукописный</option>
              <option value="display">Дисплейный</option>
            </select>
            <select onChange={e => onChange({ ...block.content, fontSize: e.target.value })} value={block.content.fontSize || 'sm'} className="text-[10px] border border-gray-200 rounded px-1 bg-white dark:bg-gray-700 text-gray-600" title="Размер">
              <option value="xs">XS</option>
              <option value="sm">SM</option>
              <option value="base">MD</option>
              <option value="lg">LG</option>
              <option value="xl">XL</option>
              <option value="2xl">2XL</option>
            </select>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <select onChange={e => onChange({ ...block.content, textEffect: e.target.value })} value={textEffect} className="text-[10px] border border-gray-200 rounded px-1 bg-white dark:bg-gray-700 text-gray-600" title="Эффект">
              <option value="none">Обычный</option>
              <option value="line">По линии</option>
              <option value="arc">По дуге</option>
              <option value="wave">По волне</option>
            </select>
          </div>
          <div ref={textRef} contentEditable suppressContentEditableWarning
            onInput={e => onChange({ ...block.content, text: (e.target as HTMLDivElement).innerText })}
            className={`w-full text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none min-h-[40px] break-words whitespace-pre-wrap ${fontClasses[fontFamily] || 'font-sans'} ${
              block.content.fontSize === 'xs' ? 'text-xs' : block.content.fontSize === 'lg' ? 'text-lg' : block.content.fontSize === 'xl' ? 'text-xl' : block.content.fontSize === '2xl' ? 'text-2xl' : 'text-sm'
            }`}
            style={effectStyles[textEffect] || {}}
            data-placeholder="Текст..." />
        </div>
      );
    }
    case 'image': return block.content.url ? <div className="relative rounded-lg overflow-hidden h-full"><Image src={block.content.url} alt="" fill className="object-cover" unoptimized /></div> : <label className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-400"><svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg><span className="text-xs text-gray-400">Фото</span><input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; const fd = new FormData(); fd.append('file', f); const t = localStorage.getItem('token'); const r = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd }); const d = await r.json(); if (r.ok && d.url) onChange({ ...block.content, url: d.url }); }} /></label>;
    case 'video': return block.content.embedUrl ? <div className="relative rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}><iframe src={block.content.embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen /></div> : <input type="url" value={block.content.url || ''} onChange={e => { const url = e.target.value; onChange({ ...block.content, url, embedUrl: extractVideoEmbed(url) || '' }); }} placeholder="Ссылка на видео..." className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700" />;
    case 'gallery': return <div className="grid grid-cols-2 gap-1 h-full">{(block.content.images || []).map((url: string, i: number) => <div key={i} className="relative aspect-square rounded bg-gray-100 overflow-hidden">{url ? <Image src={url} alt="" fill className="object-cover" unoptimized /> : <label className="flex items-center justify-center h-full cursor-pointer"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg><input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; const fd = new FormData(); fd.append('file', f); const t = localStorage.getItem('token'); const r = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd }); const d = await r.json(); if (r.ok && d.url) { const imgs = [...(block.content.images || [])]; imgs[i] = d.url; onChange({ ...block.content, images: imgs }); } }} /></label>}</div>)}</div>;
    case 'quote': return <div className="border-l-3 border-brand-400 pl-3"><textarea value={block.content.text || ''} onChange={e => onChange({ ...block.content, text: e.target.value })} placeholder="Цитата..." rows={2} className="w-full text-sm italic text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none resize-none" /><input type="text" value={block.content.author || ''} onChange={e => onChange({ ...block.content, author: e.target.value })} placeholder="Автор" className="w-full text-xs text-gray-500 bg-transparent border-none outline-none" /></div>;
    case 'divider': return <hr className="border-gray-200 dark:border-gray-600 my-2" />;
    case 'button': return <div className="flex gap-1"><input type="text" value={block.content.text || ''} onChange={e => onChange({ ...block.content, text: e.target.value })} placeholder="Текст" className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700" /><input type="url" value={block.content.url || ''} onChange={e => onChange({ ...block.content, url: e.target.value })} placeholder="URL" className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700" /></div>;
    default: return <div className="text-gray-400 text-xs">?</div>;
  }
}
