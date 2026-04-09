import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Newspaper, AlertTriangle, Calendar, Clock, Pin, Search, Plus, X, Loader2, Edit, Trash2 } from 'lucide-react';

const categoryConfig = {
  warning: { label: 'Попередження', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, dot: 'bg-amber-500' },
  important: { label: 'Важливо', color: 'bg-red-50 text-red-700 border-red-200', icon: Calendar, dot: 'bg-red-500' },
  info: { label: 'Інформація', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, dot: 'bg-blue-500' },
};

export default function News() {
  const { currentUser, token } = useAuth();
  const [newsList, setNewsList] = useState([]);
  const [filterCat, setFilterCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('News API error:', res.status);
        return;
      }
      const data = await res.json();
      setNewsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Ви дійсно хочете видалити це оголошення?')) return;
    try {
      await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNews();
    } catch (err) {
      alert('Помилка видалення оголошення');
    }
  };

  const openEditModal = (news) => {
    setEditingNews(news);
    setShowCreateModal(true);
  };

  const filtered = newsList.filter(n => {
    if (filterCat !== 'all' && n.category !== filterCat) return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && !n.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pinned = filtered.filter(n => n.pinned);
  const regular = filtered.filter(n => !n.pinned);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-[var(--color-active-blue)]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Новини та оголошення</h1>
        {currentUser?.role === 'admin' && (
          <button onClick={() => { setEditingNews(null); setShowCreateModal(true); }} className="btn-primary">
            <Plus size={16} /> Додати оголошення
          </button>
        )}
      </div>

      
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Пошук оголошень..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-1 bg-[var(--color-surface-alt)] p-1 rounded-xl">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filterCat === 'all' ? 'bg-white shadow-sm' : 'text-[var(--color-text-muted)]'}`}
          >
            Усі
          </button>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterCat(key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${filterCat === key ? 'bg-white shadow-sm' : 'text-[var(--color-text-muted)]'}`}
            >
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

     
      {pinned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1">
            <Pin size={14} /> Закріплені
          </h2>
          <div className="space-y-3">
            {pinned.map((news, i) => {
              const cfg = categoryConfig[news.category];
              return (
                <div key={news.id} className={`card border-l-4 slide-up ${
                  news.category === 'warning' ? 'border-l-amber-400' :
                  news.category === 'important' ? 'border-l-red-400' : 'border-l-blue-400'
                }`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <cfg.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge text-[10px] ${cfg.color} border`}>{cfg.label}</span>
                        <Pin size={12} className="text-[var(--color-text-muted)]" />
                      </div>
                      <h3 className="font-semibold mb-1">{news.title}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{news.content}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-[var(--color-text-muted)]">
                        <span>{news.date}</span>
                        <span>·</span>
                        <span>{news.author}</span>
                      </div>
                    </div>
                    {currentUser?.role === 'admin' && news.id && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(news)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(news.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

     
      {regular.length > 0 && (
        <div className="space-y-3">
          {regular.map((news, i) => {
            const cfg = categoryConfig[news.category];
            return (
              <div key={news.id} className="card slide-up" style={{ animationDelay: `${(pinned.length + i) * 0.08}s` }}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <cfg.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <span className={`badge text-[10px] ${cfg.color} border mb-1`}>{cfg.label}</span>
                    <h3 className="font-semibold mb-1">{news.title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{news.content}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-[var(--color-text-muted)]">
                      <span>{news.date}</span>
                      <span>·</span>
                      <span>{news.author}</span>
                    </div>
                  </div>
                  {currentUser?.role === 'admin' && news.id && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(news)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(news.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
          <p>Оголошень не знайдено</p>
        </div>
      )}

   
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingNews ? 'Редагувати оголошення' : 'Нове оголошення'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              
              try {
                const url = editingNews ? `/api/announcements/${editingNews.id}` : '/api/announcements';
                const method = editingNews ? 'PUT' : 'POST';
                
                await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    title: form.get('title'),
                    content: form.get('content'),
                    category: form.get('category'),
                    pinned: form.get('pinned') === 'on'
                  })
                });
                setShowCreateModal(false);
                fetchNews();
              } catch (err) {
                alert('Помилка публікації оголешення');
              }
            }}>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Заголовок</label>
                <input name="title" defaultValue={editingNews?.title} required className="input" placeholder="Тема оголошення" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Текст</label>
                <textarea name="content" defaultValue={editingNews?.content} required rows="4" className="input resize-none" placeholder="Текст оголошення..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Категорія</label>
                  <select name="category" defaultValue={editingNews?.category || 'info'} className="input">
                    <option value="info">Інформація</option>
                    <option value="warning">Попередження</option>
                    <option value="important">Важливо</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="pinned" defaultChecked={editingNews?.pinned} className="w-4 h-4 rounded border-[var(--color-border)]" />
                    <Pin size={14} /> Закріпити
                  </label>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center">
                <Newspaper size={16} /> {editingNews ? 'Зберегти зміни' : 'Опублікувати'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
