'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { EditorBlock, PostTemplate, getTemplatesForRole, createBlockFromType, BLOCK_TYPES, extractVideoEmbed } from '@/lib/postTemplates';

interface PostEditorProps {
  userRole: string;
  onPublish: (data: { title: string; content: string; category: string; images: string[]; tags: string[] }) => void;
  onCancel: () => void;
}

const DRAFT_KEY = 'mebportal_post_draft';
const CUSTOM_TEMPLATES_KEY = 'mebportal_custom_templates';

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
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [undoStack, setUndoStack] = useState<EditorBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorBlock[][]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const templates = getTemplatesForRole(userRole);

  // Load custom templates
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (saved) { try { setCustomTemplates(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);

  const saveCustomTemplate = () => {
    if (!templateName.trim()) { toast.error('Введите название шаблона'); return; }
    if (blocks.length === 0) { toast.error('Добавьте блоки'); return; }
    const newTemplate: CustomTemplate = {
      id: Date.now().toString(36),
      name: templateName.trim(),
      blocks: JSON.parse(JSON.stringify(blocks)),
      category,
      createdAt: new Date().toISOString(),
    };
    const updated = [...customTemplates, newTemplate];
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
    toast.success('Шаблон удалён');
  };

  const selectCustomTemplate = (template: CustomTemplate) => {
    setBlocks(JSON.parse(JSON.stringify(template.blocks)));
    setCategory(template.category || 'news');
    setShowTemplates(false);
    if (template.blocks.length > 0) setSelectedBlockId(template.blocks[0].id);
  };

  // Load draft on mount
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
      } catch { /* ignore */ }
    }
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (showTemplates || blocks.length === 0) return;
    const timer = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ blocks, title, category, tags }));
    }, 30000);
    return () => clearInterval(timer);
  }, [blocks, title, category, tags, showTemplates]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack]);

  const saveUndoState = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-49), blocks]);
    setRedoStack([]);
  }, [blocks]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, blocks]);
    setBlocks(prev);
    setUndoStack(u => u.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, blocks]);
    setBlocks(next);
    setRedoStack(r => r.slice(0, -1));
  };

  const selectTemplate = (template: PostTemplate) => {
    const newBlocks = template.blocks.map((b, i) => ({
      ...b,
      id: Math.random().toString(36).slice(2, 10),
      order: i,
    }));
    setBlocks(newBlocks);
    setCategory(template.category);
    setShowTemplates(false);
    if (newBlocks.length > 0) setSelectedBlockId(newBlocks[0].id);
  };

  const addBlock = (type: EditorBlock['type'], index?: number) => {
    saveUndoState();
    const newBlock = createBlockFromType(type);
    setBlocks(prev => {
      const insertAt = index !== undefined ? index : prev.length;
      const updated = [...prev];
      updated.splice(insertAt, 0, newBlock);
      return updated.map((b, i) => ({ ...b, order: i }));
    });
    setSelectedBlockId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    saveUndoState();
    setBlocks(prev => prev.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i })));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    saveUndoState();
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: Math.random().toString(36).slice(2, 10) };
      const updated = [...prev];
      updated.splice(idx + 1, 0, copy);
      return updated.map((b, i) => ({ ...b, order: i }));
    });
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    saveUndoState();
    setBlocks(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((b, i) => ({ ...b, order: i }));
    });
  };

  const updateBlockContent = (id: string, content: Record<string, any>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const handlePaletteDragStart = (e: React.DragEvent, type: string) => {
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', type);
  };

  const handleCanvasDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/block-index', String(index));
  };

  const handleCanvasDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedType ? 'copy' : 'move';
    setDragOverIndex(index);
  };

  const handleCanvasDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const fromIndex = e.dataTransfer.getData('application/block-index');
    if (fromIndex !== '') {
      moveBlock(parseInt(fromIndex), toIndex);
    } else if (draggedType) {
      addBlock(draggedType as EditorBlock['type'], toIndex);
    }
    setDraggedType(null);
  };

  const handleCanvasDragEnd = () => {
    setDraggedType(null);
    setDragOverIndex(null);
  };

  const handlePublish = async () => {
    if (!title.trim()) { toast.error('Введите заголовок'); return; }
    if (blocks.length === 0) { toast.error('Добавьте хотя бы один блок'); return; }
    setPublishing(true);
    try {
      const contentParts = blocks.map(b => {
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

      const images = blocks
        .filter(b => b.type === 'image' && b.content.url)
        .map(b => b.content.url)
        .concat(
          blocks.filter(b => b.type === 'gallery').flatMap(b => (b.content.images || []).filter(Boolean))
        );

      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      localStorage.removeItem(DRAFT_KEY);
      onPublish({ title, content: contentParts, category, images, tags: tagList });
    } catch { toast.error('Ошибка публикации'); }
    finally { setPublishing(false); }
  };

  // Template selection screen
  if (showTemplates) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Выберите шаблон</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Или начните с пустого холста</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Стандартные шаблоны */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {templates.map(template => (
            <button key={template.id} onClick={() => selectTemplate(template)}
              className="text-left p-5 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-brand-400 hover:shadow-lg transition-all duration-200 group">
              <div className="text-3xl mb-3">{template.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors">{template.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
              <div className="flex gap-1 mt-3">
                {template.blocks.slice(0, 4).map((b, i) => (
                  <span key={i} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-400">
                    {BLOCK_TYPES.find(bt => bt.type === b.type)?.icon || '?'}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Пользовательские шаблоны */}
        {customTemplates.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Мои шаблоны</h3>
              <span className="text-xs text-gray-400">{customTemplates.length} шт.</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {customTemplates.map(ct => (
                <div key={ct.id} className="relative group text-left p-5 bg-white dark:bg-gray-800 rounded-2xl border-2 border-brand-100 dark:border-brand-900 hover:border-brand-400 hover:shadow-lg transition-all duration-200">
                  <button onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(ct.id); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <button onClick={() => selectCustomTemplate(ct)} className="w-full text-left">
                    <div className="text-2xl mb-2">📝</div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors">{ct.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{ct.blocks.length} блоков</p>
                    <div className="flex gap-1 mt-3">
                      {ct.blocks.slice(0, 4).map((b, i) => (
                        <span key={i} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-400">
                          {BLOCK_TYPES.find(bt => bt.type === b.type)?.icon || '?'}
                        </span>
                      ))}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Preview mode
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Назад к редактору
          </button>
          <span className="text-sm font-medium text-gray-500">Предпросмотр</span>
          <button onClick={handlePublish} disabled={publishing}
            className="px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
            {publishing ? 'Публикация...' : 'Опубликовать'}
          </button>
        </div>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">{title || 'Без заголовка'}</h1>
            {blocks.map(block => (
              <div key={block.id} className="mb-6">
                {block.type === 'heading' && (
                  block.content.level === 1 ? <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{block.content.text}</h1>
                    : block.content.level === 3 ? <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{block.content.text}</h3>
                    : <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{block.content.text}</h2>
                )}
                {block.type === 'text' && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{block.content.text}</p>
                )}
                {block.type === 'image' && block.content.url && (
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image src={block.content.url} alt={block.content.caption || ''} width={600} height={400} className="w-full h-auto" unoptimized />
                    {block.content.caption && <p className="text-sm text-gray-500 mt-2 text-center">{block.content.caption}</p>}
                  </div>
                )}
                {block.type === 'video' && block.content.embedUrl && (
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700" style={{ paddingBottom: '56.25%' }}>
                    <iframe src={block.content.embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                )}
                {block.type === 'gallery' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(block.content.images || []).filter(Boolean).map((url: string, i: number) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <Image src={url} alt="" fill className="object-cover" sizes="300px" unoptimized />
                      </div>
                    ))}
                  </div>
                )}
                {block.type === 'quote' && (
                  <blockquote className="border-l-4 border-brand-400 pl-4 py-2">
                    <p className="text-gray-700 dark:text-gray-300 italic">{block.content.text}</p>
                    {block.content.author && <cite className="text-sm text-gray-500 mt-1 block">— {block.content.author}</cite>}
                  </blockquote>
                )}
                {block.type === 'divider' && <hr className="border-gray-200 dark:border-gray-600 my-4" />}
                {block.type === 'button' && (
                  <a href={block.content.url || '#'} className="inline-block px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition">
                    {block.content.text}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Editor screen
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="h-14 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowTemplates(true)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Шаблоны
          </button>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-600" />
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Заголовок поста..."
            className="text-lg font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none w-64 md:w-96"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-2">
            <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Отменить (Ctrl+Z)">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Повторить (Ctrl+Shift+Z)">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-8l-6 6m6-6l-6-6" /></svg>
            </button>
          </div>
          <button onClick={() => setShowPreview(true)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
            Предпросмотр
          </button>
          <button onClick={() => { localStorage.setItem(DRAFT_KEY, JSON.stringify({ blocks, title, category, tags })); toast.success('Черновик сохранён'); }}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
            Черновик
          </button>
          <button onClick={() => setShowSaveTemplate(true)}
            className="px-3 py-1.5 text-sm text-brand-500 hover:text-brand-600 border border-brand-200 dark:border-brand-800 rounded-lg">
            Сохранить шаблон
          </button>
          <button onClick={handlePublish} disabled={publishing} className="px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
            {publishing ? 'Публикация...' : 'Опубликовать'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Block palette */}
        <div className="w-56 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-3 overflow-y-auto shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Блоки</h3>
          <div className="space-y-1.5">
            {BLOCK_TYPES.map(bt => (
              <div key={bt.type} draggable onDragStart={e => handlePaletteDragStart(e, bt.type)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-brand-50 dark:hover:bg-brand-500/10 cursor-grab active:cursor-grabbing transition-colors text-sm text-gray-700 dark:text-gray-300">
                <span className="w-7 h-7 rounded-md bg-white dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-brand-500 shrink-0 border border-gray-200 dark:border-gray-500">{bt.icon}</span>
                {bt.label}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Категория</h3>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option value="news">Новость</option>
              <option value="project">Проект</option>
              <option value="article">Статья</option>
              <option value="product">Товар</option>
            </select>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Теги</h3>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Через запятую"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-y-auto p-6" ref={canvasRef}>
          <div className="max-w-2xl mx-auto">
            {blocks.length === 0 ? (
              <div onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                onDrop={e => { e.preventDefault(); const type = e.dataTransfer.getData('text/plain'); if (type) addBlock(type as EditorBlock['type'], 0); }}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <p className="font-medium">Перетащите блок сюда</p>
                <p className="text-sm mt-1">или выберите шаблон</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blocks.map((block, index) => (
                  <div key={block.id} draggable onDragStart={e => handleCanvasDragStart(e, index)}
                    onDragOver={e => handleCanvasDragOver(e, index)} onDrop={e => handleCanvasDrop(e, index)}
                    onDragEnd={handleCanvasDragEnd} onClick={() => setSelectedBlockId(block.id)}
                    className={`group relative rounded-xl border-2 transition-all duration-150 cursor-pointer ${
                      selectedBlockId === block.id ? 'border-brand-400 shadow-md' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                    } ${dragOverIndex === index ? 'border-t-2 border-t-brand-400' : ''}`}>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="cursor-grab text-gray-400 hover:text-gray-600 p-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                      </div>
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                      {/* Size controls when selected */}
                      {selectedBlockId === block.id && block.type !== 'divider' && (
                        <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded shadow-sm px-1 py-0.5 mr-1">
                          {['narrow', 'normal', 'wide', 'full'].map(s => (
                            <button key={s} onClick={e => { e.stopPropagation(); setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, size: s as any } : b)); }}
                              className={`px-1.5 py-0.5 text-[10px] rounded ${block.size === s || (!block.size && s === 'normal') ? 'bg-brand-100 text-brand-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}
                              title={s === 'narrow' ? 'Узкий' : s === 'wide' ? 'Широкий' : s === 'full' ? 'На всю ширину' : 'Обычный'}>
                              {s === 'narrow' ? '◻' : s === 'wide' ? '▭' : s === 'full' ? '⬛' : '◻'}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Font size for text blocks */}
                      {selectedBlockId === block.id && block.type === 'text' && (
                        <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded shadow-sm px-1 py-0.5 mr-1">
                          {['sm', 'base', 'lg', 'xl'].map(fs => (
                            <button key={fs} onClick={e => { e.stopPropagation(); setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, fontSize: fs as any } : b)); }}
                              className={`px-1.5 py-0.5 text-[10px] rounded ${block.fontSize === fs || (!block.fontSize && fs === 'base') ? 'bg-brand-100 text-brand-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}
                              title={fs === 'sm' ? 'Мелкий' : fs === 'lg' ? 'Большой' : fs === 'xl' ? 'Очень большой' : 'Обычный'}>
                              {fs === 'sm' ? 'A' : fs === 'lg' ? '<u>A</u>' : fs === 'xl' ? '<b>A</b>' : 'A'}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Gallery columns */}
                      {selectedBlockId === block.id && block.type === 'gallery' && (
                        <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded shadow-sm px-1 py-0.5 mr-1">
                          {[2, 3, 4].map(cols => (
                            <button key={cols} onClick={e => { e.stopPropagation(); setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, content: { ...b.content, columns: cols } } : b)); }}
                              className={`px-1.5 py-0.5 text-[10px] rounded ${block.content.columns === cols ? 'bg-brand-100 text-brand-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}
                              title={`${cols} колонки`}>
                              {cols}×
                            </button>
                          ))}
                        </div>
                      )}
                      <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id); }} className="p-1 bg-white dark:bg-gray-700 rounded shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }} className="p-1 bg-white dark:bg-gray-700 rounded shadow-sm hover:bg-red-50 dark:hover:bg-red-500/10">
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="p-4">
                      <BlockRenderer block={block} onChange={content => updateBlockContent(block.id, content)} isSelected={selectedBlockId === block.id} />
                    </div>
                  </div>
                ))}
                <div onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); const type = e.dataTransfer.getData('text/plain'); if (type) addBlock(type as EditorBlock['type']); }}
                  className="py-4 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-500 cursor-pointer transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Добавить блок
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модал сохранения шаблона */}
      {showSaveTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowSaveTemplate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">Сохранить как шаблон</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Шаблон сохранится в вашем браузере и будет доступен при создании нового поста.</p>
            <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)}
              placeholder="Название шаблона" autoFocus
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg mb-4 text-gray-900 dark:text-gray-100"
              onKeyDown={e => { if (e.key === 'Enter') saveCustomTemplate(); }} />
            <div className="flex gap-2">
              <button onClick={saveCustomTemplate} className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition">Сохранить</button>
              <button onClick={() => setShowSaveTemplate(false)} className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Block Renderer
function BlockRenderer({ block, onChange }: { block: EditorBlock; onChange: (content: Record<string, any>) => void; isSelected: boolean }) {
  const textRef = useRef<HTMLDivElement>(null);

  // Size classes
  const sizeClass = block.size === 'narrow' ? 'max-w-md mx-auto'
    : block.size === 'wide' ? 'max-w-4xl mx-auto'
    : block.size === 'full' ? 'w-full'
    : '';

  const fontSizeClass = block.fontSize === 'sm' ? 'text-sm'
    : block.fontSize === 'lg' ? 'text-lg'
    : block.fontSize === 'xl' ? 'text-xl'
    : '';

  useEffect(() => {
    if (textRef.current && block.type === 'text' && block.content.text !== undefined) {
      if (textRef.current.innerText !== block.content.text) {
        textRef.current.innerText = block.content.text || '';
      }
    }
  }, [block.content.text, block.type]);

  switch (block.type) {
    case 'heading':
      return (
        <div className={sizeClass}>
          <input type="text" value={block.content.text || ''} onChange={e => onChange({ ...block.content, text: e.target.value })}
            placeholder="Заголовок"
            className={`w-full font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none placeholder-gray-300 ${block.content.level === 1 ? 'text-3xl' : block.content.level === 3 ? 'text-lg' : 'text-2xl'}`} />
        </div>
      );

    case 'text':
      return (
        <div className={`space-y-1 ${sizeClass}`}>
          <div className="flex gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => document.execCommand('bold')} className="p-1 text-xs font-bold text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600" title="Жирный">B</button>
            <button onClick={() => document.execCommand('italic')} className="p-1 text-xs italic text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600" title="Курсив">I</button>
            <button onClick={() => { const url = prompt('Введите ссылку:'); if (url) document.execCommand('createLink', false, url); }} className="p-1 text-xs text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600" title="Ссылка">🔗</button>
          </div>
          <div ref={textRef} contentEditable suppressContentEditableWarning
            onInput={e => onChange({ ...block.content, text: (e.target as HTMLDivElement).innerText })}
            className={`w-full text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none leading-relaxed min-h-[60px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 ${fontSizeClass}`}
            data-placeholder="Текст блока..." />
        </div>
      );

    case 'image':
      return (
        <div className={`space-y-2 ${sizeClass}`}>
          {block.content.url ? (
            <div className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 ${block.size === 'narrow' ? 'aspect-[4/3]' : block.size === 'wide' ? 'aspect-[21/9]' : 'aspect-video'}`}>
              <Image src={block.content.url} alt={block.content.caption || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" unoptimized />
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-all">
              <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <span className="text-sm text-gray-500">Нажмите или перетащите</span>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const formData = new FormData(); formData.append('file', file);
                const token = localStorage.getItem('token');
                const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
                const data = await res.json();
                if (res.ok && data.url) onChange({ ...block.content, url: data.url });
              }} />
            </label>
          )}
          <input type="text" value={block.content.caption || ''} onChange={e => onChange({ ...block.content, caption: e.target.value })}
            placeholder="Подпись к фото (необязательно)" className="w-full text-sm text-gray-500 bg-transparent border-none outline-none placeholder-gray-300" />
        </div>
      );

    case 'video':
      return (
        <div className={`space-y-2 ${sizeClass}`}>
          {block.content.embedUrl ? (
            <div className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 ${block.size === 'narrow' ? 'aspect-[4/3]' : block.size === 'wide' ? 'aspect-[21/9]' : 'aspect-video'}`}>
              <iframe src={block.content.embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          ) : (
            <div>
              <input type="url" value={block.content.url || ''} onChange={e => {
                const url = e.target.value;
                const embed = extractVideoEmbed(url);
                onChange({ ...block.content, url, embedUrl: embed || '' });
              }} placeholder="Вставьте ссылку на видео (YouTube, Rutube, VK)" className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              {!block.content.embedUrl && block.content.url && (
                <p className="text-xs text-red-500 mt-1">Не удалось распознать ссылку</p>
              )}
            </div>
          )}
        </div>
      );

    case 'gallery': {
      const cols = block.content.columns || 2;
      const gridCols = cols === 3 ? 'grid-cols-3' : cols === 4 ? 'grid-cols-4' : 'grid-cols-2';
      return (
        <div className="space-y-2">
          <div className={`grid gap-2 ${gridCols}`}>
            {(block.content.images || []).map((url: string, i: number) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {url ? (
                  <Image src={url} alt="" fill className="object-cover" sizes="200px" unoptimized />
                ) : (
                  <label className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-brand-400 transition-all">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const formData = new FormData(); formData.append('file', file);
                      const token = localStorage.getItem('token');
                      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
                      const data = await res.json();
                      if (res.ok && data.url) {
                        const newImages = [...(block.content.images || [])]; newImages[i] = data.url;
                        onChange({ ...block.content, images: newImages });
                      }
                    }} />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'quote':
      return (
        <div className="border-l-4 border-brand-400 pl-4 space-y-2">
          <textarea value={block.content.text || ''} onChange={e => onChange({ ...block.content, text: e.target.value })}
            placeholder="Текст цитаты..." rows={2}
            className="w-full text-gray-700 dark:text-gray-300 italic bg-transparent border-none outline-none resize-none placeholder-gray-300" />
          <input type="text" value={block.content.author || ''} onChange={e => onChange({ ...block.content, author: e.target.value })}
            placeholder="Автор" className="w-full text-sm text-gray-500 bg-transparent border-none outline-none placeholder-gray-300" />
        </div>
      );

    case 'divider':
      return <hr className="border-gray-200 dark:border-gray-600 my-2" />;

    case 'button':
      return (
        <div className="flex gap-2">
          <input type="text" value={block.content.text || ''} onChange={e => onChange({ ...block.content, text: e.target.value })}
            placeholder="Текст кнопки" className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          <input type="url" value={block.content.url || ''} onChange={e => onChange({ ...block.content, url: e.target.value })}
            placeholder="https://..." className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        </div>
      );

    default:
      return <div className="text-gray-400 text-sm">Неизвестный блок</div>;
  }
}
