import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Vote, CheckCircle, Clock, Lock, Users, BarChart3, Shield, X, Loader2, Trash2 } from 'lucide-react';

export default function Voting() {
  const { currentUser, token } = useAuth();
  const [votingsList, setVotingsList] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchVotings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/votings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Votings API error:', res.status);
        return;
      }
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        setVotingsList([]);
        return;
      }
      
     
      const normalizedData = data.map(v => ({
        ...v,
        options: Array.isArray(v.options) ? v.options : []
      }));
      
      setVotingsList(normalizedData);
    } catch (err) {
      console.error('Failed to fetch votings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotings();
  }, [token]);

  const handleVote = async (votingId, optionIndex) => {
    const voting = votingsList.find(v => v.id === votingId);
    if (!voting) return;
    
    try {
      await fetch(`/api/votings/${votingId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ option_id: voting.options[optionIndex].id })
      });
      
      fetchVotings();
    } catch (err) {
      alert('Помилка голосування');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ви дійсно хочете видалити це голосування?')) return;
    try {
      await fetch(`/api/votings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchVotings();
    } catch (err) {
      alert('Помилка видалення');
    }
  };

  const activeVotings = votingsList.filter(v => v.status === 'active');
  const completedVotings = votingsList.filter(v => v.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-[var(--color-active-blue)]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Голосування</h1>
        {currentUser?.role === 'admin' && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Vote size={16} /> Створити голосування
          </button>
        )}
      </div>

   
      {activeVotings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-lg font-semibold">Активні ({activeVotings.length})</h2>
          </div>
          <div className="space-y-4">
            {activeVotings.map(voting => {
              const totalVotes = voting.options.reduce((a, o) => a + o.votes, 0);
              const quorumPercent = (totalVotes / voting.totalVoters) * 100;

              return (
                <div key={voting.id} className="card hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-semibold text-base">{voting.title}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">{voting.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="badge badge-success">Активне</span>
                      {currentUser?.role === 'admin' && (
                        <button onClick={() => handleDelete(voting.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

               
                  <div className="mb-4 p-3 rounded-xl bg-[var(--color-surface-alt)]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                        <Users size={12} /> Кворум
                      </span>
                      <span className="font-medium">
                        {totalVotes}/{voting.totalVoters} ({quorumPercent.toFixed(0)}%)
                        {quorumPercent >= (voting.quorum / voting.totalVoters * 100) && ' ✓'}
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${quorumPercent >= (voting.quorum / voting.totalVoters * 100) ? 'bg-green-500' : 'bg-[var(--color-active-blue)]'}`}
                        style={{ width: `${Math.min(quorumPercent, 100)}%` }}
                      />
                    </div>
                  </div>

               
                  {voting.voted ? (
                    <div className="space-y-2">
                      {voting.options.map((opt, i) => {
                        const percent = totalVotes > 0 ? (opt.votes / totalVotes * 100) : 0;
                        return (
                          <div key={i} className="relative p-3 rounded-xl bg-[var(--color-surface-alt)] overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-[var(--color-active-blue)]/10 transition-all"
                              style={{ width: `${percent}%` }}
                            />
                            <div className="relative flex items-center justify-between">
                              <span className="text-sm font-medium flex items-center gap-2">
                                {voting.myVote === opt.text && <CheckCircle size={14} className="text-[var(--color-active-blue)]" />}
                                {opt.text}
                              </span>
                              <span className="text-sm font-semibold">{percent.toFixed(0)}% ({opt.votes})</span>
                            </div>
                          </div>
                        );
                      })}
                      <p className="text-xs text-[var(--color-text-muted)] mt-2 flex items-center gap-1">
                        <CheckCircle size={12} /> Ви проголосували: <span className="font-medium">{voting.myVote}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Shield size={14} className="text-[var(--color-active-blue)]" /> Оберіть варіант:
                      </p>
                      {voting.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleVote(voting.id, i)}
                          className="w-full text-left p-3.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-active-blue)] hover:bg-blue-50/50 transition-all text-sm font-medium"
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><Clock size={12} /> До {voting.endDate}</span>
                    <span className="flex items-center gap-1"><Lock size={12} /> Верифікація BankID</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    
      {completedVotings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart3 size={18} /> Завершені
          </h2>
          <div className="space-y-3">
            {completedVotings.map(voting => {
              const totalVotes = voting.options.reduce((a, o) => a + o.votes, 0);
              return (
                <div key={voting.id} className="card opacity-80">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold">{voting.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="badge bg-gray-100 text-gray-600">Завершено</span>
                      {currentUser?.role === 'admin' && (
                        <button onClick={() => handleDelete(voting.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    {voting.options.map((opt, i) => {
                      const percent = totalVotes > 0 ? (opt.votes / totalVotes * 100) : 0;
                      const isMax = opt.votes === Math.max(...voting.options.map(o => o.votes));
                      return (
                        <div key={i} className="relative p-2.5 rounded-lg bg-[var(--color-surface-alt)] overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 transition-all ${isMax ? 'bg-green-500/15' : 'bg-gray-200/50'}`}
                            style={{ width: `${percent}%` }}
                          />
                          <div className="relative flex items-center justify-between">
                            <span className={`text-sm ${isMax ? 'font-semibold' : ''}`}>{opt.text}</span>
                            <span className="text-sm font-medium">{percent.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {voting.result && (
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">{voting.result}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Нове голосування</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              
              try {
                await fetch('/api/votings', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    title: form.get('title'),
                    description: form.get('description'),
                    endDate: form.get('endDate'),
                  })
                });
                setShowCreateModal(false);
                fetchVotings();
              } catch (err) {
                alert('Помилка створення голосування');
              }
            }}>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Тема голосування</label>
                <input name="title" required className="input" placeholder="Наприклад: Встановлення камер" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Опис</label>
                <textarea name="description" required rows="3" className="input resize-none" placeholder="Детальний опис пропозиції..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Дата завершення</label>
                <input type="date" name="endDate" required className="input" />
              </div>
              <button type="submit" className="btn-primary w-full justify-center">
                <Vote size={16} /> Створити голосування
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
