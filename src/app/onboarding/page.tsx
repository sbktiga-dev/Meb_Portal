'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const FURNITURE_TYPES = [
  { id: 'kitchens', label: 'Кухни', icon: '🍳' },
  { id: 'wardrobes', label: 'Гардеробные', icon: '👔' },
  { id: 'tables', label: 'Столы', icon: '🪑' },
  { id: 'shelves', label: 'Стеллажи', icon: '📚' },
  { id: 'sofas', label: 'Диваны', icon: '🛋️' },
  { id: 'beds', label: 'Кровати', icon: '🛏️' },
  { id: 'hardware', label: 'Фурнитура', icon: '🔩' },
  { id: 'materials', label: 'Материалы', icon: '🪵' },
];

const STYLES = [
  { id: 'classic', label: 'Классика', desc: 'Традиционные формы, натуральное дерево' },
  { id: 'minimalism', label: 'Минимализм', desc: 'Чистые линии, функциональность' },
  { id: 'loft', label: 'Лофт', desc: 'Индустриальный стиль, металл и дерево' },
  { id: 'scandinavian', label: 'Скандинавия', desc: 'Светлые тона, уют и простота' },
  { id: 'modern', label: 'Модерн', desc: 'Современные формы, глянец' },
  { id: 'country', label: 'Кантри', desc: 'Деревенский стиль, тёплые тона' },
];

const BUDGETS = [
  { id: 'economy', label: 'Эконом', desc: 'до 50 000 руб.' },
  { id: 'medium', label: 'Средний', desc: '50 000 — 200 000 руб.' },
  { id: 'premium', label: 'Премиум', desc: 'от 200 000 руб.' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, id: string) => {
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  };

  const handleFinish = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const interests = [...selectedTypes, ...selectedStyles];
    if (selectedBudget) interests.push(selectedBudget);

    setSaving(true);
    try {
      const res = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interests: JSON.stringify(interests) }),
      });
      if (res.ok) {
        toast.success('Отлично! Ваши предпочтения сохранены');
        router.push('/');
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      title: 'Какая мебель вам интересна?',
      subtitle: 'Выберите категории (можно несколько)',
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FURNITURE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => toggleItem(selectedTypes, setSelectedTypes, t.id)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selectedTypes.includes(t.id)
                  ? 'border-brand-500 bg-brand-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-2xl block mb-2">{t.icon}</span>
              <span className="text-sm font-medium text-gray-900">{t.label}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Какой стиль вам нравится?',
      subtitle: 'Выберите предпочтительные стили',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => toggleItem(selectedStyles, setSelectedStyles, s.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedStyles.includes(s.id)
                  ? 'border-brand-500 bg-brand-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="font-medium text-gray-900">{s.label}</span>
              <span className="text-sm text-gray-500 block mt-1">{s.desc}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Какой у вас бюджет?',
      subtitle: 'Это поможет показывать релевантные предложения',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BUDGETS.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBudget(selectedBudget === b.id ? '' : b.id)}
              className={`p-5 rounded-xl border-2 transition-all text-center ${
                selectedBudget === b.id
                  ? 'border-brand-500 bg-brand-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="font-bold text-gray-900 block">{b.label}</span>
              <span className="text-sm text-gray-500 mt-1 block">{b.desc}</span>
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Добро пожаловать на МебПортал!</h1>
          <p className="text-gray-500 mt-2">Настройте свою ленту под ваши вкусы</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-brand-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{steps[step].title}</h2>
          <p className="text-sm text-gray-500 mb-6">{steps[step].subtitle}</p>

          {steps[step].content}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="text-sm text-gray-500 hover:text-gray-700">
                Назад
              </button>
            ) : (
              <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-gray-600">
                Пропустить
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition">
                Далее
              </button>
            ) : (
              <button onClick={handleFinish} disabled={saving} className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition disabled:opacity-50">
                {saving ? 'Сохранение...' : 'Завершить'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
