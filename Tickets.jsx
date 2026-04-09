import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, MessageSquare, Clock, CheckCircle, AlertCircle, X, Camera, Send, Loader2, Trash2 } from 'lucide-react';

const statusConfig = {
  new: { label: 'Нова', badge: 'badge-info', icon: AlertCircle },
  in_progress: { label: 'В роботі', badge: 'badge-warning', icon: Clock },
  resolved: { label: 'Виконано', badge: 'badge-success', icon: CheckCircle },
};

const categories = ['Усі', 'Сантехніка', 'Електрика', 'Будівельні роботи', 'Ліфт', 'Інше'];

export default function Tickets() {
  const { currentUser, token } = useAuth();
  const [ticketsList, setTicketsList] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('Усі');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Tickets API error:', res.status);
        return;
      }
      const data = await res.json();
      setTicketsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const filtered = ticketsList.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterCategory !== 'Усі' && t.category !== filterCategory) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (currentUser?.role === 'master') {
      return t.assignedTo === currentUser.name || t.category === 'Сантехніка';
    }
    return true;
  });

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    
    try {
      await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: form.get('title'),
          description: form.get('description'),
          category: form.get('category'),
          priority: form.get('priority')
        })
      });
      setShowCreateModal(false);
      fetchTickets();
    } catch (err) {
      alert('Помилка створення заявки');
    }
  };

  const updateTicketStatus = async (id, newStatus) => {
  
    setTicketsList(ticketsList.map(t =>
      t.id === id ? { ...t, status: newStatus } : t
    ));
    if (selectedTicket?.id === id) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
    
    try {
      await fetch(`/api/tickets/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed to update status', err);
      
      fetchTickets();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ви дійсно хочете видалити цю заявку?')) return;
    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      alert('Помилка видалення');
    }
  };

  const addComment = async (id) => {
    if (!newComment.trim()) return;
    
    try {
      await fetch(`/api/tickets/${id}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newComment })
      });
      setNewComment('');
      
    
      const comment = { author: currentUser?.name, text: newComment, date: new Date().toISOString().split('T')[0] };
      if (selectedTicket?.id === id) {
        setSelectedTicket({ ...selectedTicket, comments: [...selectedTicket.comments, comment] });
      }
      setTicketsList(prev => prev.map(t => t.id === id ? { ...t, comments: [...t.comments, comment] } : t));
    } catch (err) {
      alert('Помилка додавання коментаря');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-[var(--color-active-blue)]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Заявки на ремонт</h1>
        {currentUser?.role !== 'master' && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus size={16} /> Нова заявка
          </button>
        )}
      </div>

  
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = ticketsList.filter(t => t.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
              className={`card text-center transition-all cursor-pointer ${filterStatus === key ? 'ring-2 ring-[var(--color-active-blue)]' : ''}`}
            >
              <cfg.icon size={20} className="mx-auto mb-1 text-[var(--color-text-muted)]" />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{cfg.label}</p>
            </button>
          );
        })}
      </div>

    
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Пошук заявок..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-1 bg-[var(--color-surface-alt)] p-1 rounded-xl overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filterCategory === cat ? 'bg-white shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

     
      <div className="space-y-3">
        {filtered.map(ticket => {
          const cfg = statusConfig[ticket.status];
          return (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="card flex items-start gap-4 cursor-pointer hover:scale-[1.005] transition-all"
            >
              <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                ticket.status === 'new' ? 'bg-blue-500' :
                ticket.status === 'in_progress' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{ticket.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Кв. {ticket.apartment} · {ticket.category} · {ticket.createdAt}
                    </p>
                  </div>
                  <span className={`badge ${cfg.badge} shrink-0`}>{cfg.label}</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-1">{ticket.description}</p>
                {ticket.assignedTo && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    🔧 {ticket.assignedTo}
                  </p>
                )}
                {ticket.comments && ticket.comments.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-[var(--color-text-muted)]">
                    <MessageSquare size={12} /> {ticket.comments.length} коментарів
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p>Заявок не знайдено</p>
          </div>
        )}
      </div>

     
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{selectedTicket.title}</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  #{selectedTicket.id} · Кв. {selectedTicket.apartment} · {selectedTicket.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentUser?.role === 'admin' && (
                  <button onClick={() => handleDelete(selectedTicket.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Видалити заявку">
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>

            <span className={`badge ${statusConfig[selectedTicket.status].badge} mb-4`}>
              {statusConfig[selectedTicket.status].label}
            </span>

            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{selectedTicket.description}</p>

            {selectedTicket.assignedTo && (
              <p className="text-sm mb-4"><span className="font-medium">Виконавець:</span> {selectedTicket.assignedTo}</p>
            )}

           
            {(currentUser?.role === 'master' || currentUser?.role === 'admin') && selectedTicket.status !== 'resolved' && (
              <div className="flex gap-2 mb-4">
                {selectedTicket.status === 'new' && (
                  <button onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')} className="btn-primary btn-sm">
                    Взяти в роботу
                  </button>
                )}
                {selectedTicket.status === 'in_progress' && (
                  <button onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')} className="btn-primary btn-sm bg-gradient-to-r from-green-500 to-emerald-600">
                    <CheckCircle size={14} /> Виконано
                  </button>
                )}
              </div>
            )}

           
            <div className="border-t border-[var(--color-border)] pt-4">
              <h3 className="font-semibold text-sm mb-3">Коментарі ({selectedTicket.comments?.length || 0})</h3>
              <div className="space-y-3 mb-4">
                {selectedTicket.comments?.map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-alt)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{c.author}</span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">{c.date}</span>
                    </div>
                    <p className="text-sm">{c.text}</p>
                  </div>
                ))}
                {(!selectedTicket.comments || selectedTicket.comments.length === 0) && (
                  <p className="text-sm text-[var(--color-text-muted)]">Коментарів поки немає</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Написати коментар..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addComment(selectedTicket.id)}
                  className="input flex-1"
                />
                <button onClick={() => addComment(selectedTicket.id)} className="btn-primary btn-sm">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Нова заявка</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Тема</label>
                <input name="title" required className="input" placeholder="Опишіть коротко проблему" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Опис</label>
                <textarea name="description" required rows="3" className="input resize-none" placeholder="Детальний опис проблеми..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Категорія</label>
                  <select name="category" className="input">
                    <option>Сантехніка</option>
                    <option>Електрика</option>
                    <option>Будівельні роботи</option>
                    <option>Ліфт</option>
                    <option>Інше</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Пріоритет</label>
                  <select name="priority" className="input">
                    <option value="low">Низький</option>
                    <option value="medium">Середній</option>
                    <option value="high">Високий</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <Camera size={14} /> Фото проблеми
                </label>
                <input type="file" accept="image/*" className="input text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center">
                  <Plus size={16} /> Створити заявку
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
