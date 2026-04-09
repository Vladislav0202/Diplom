import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Gauge, Wrench, Vote, DoorOpen, TrendingUp, TrendingDown,
  ArrowRight, AlertTriangle, Calendar, Clock, Loader2, X, CheckCircle
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [data, setData] = useState({
    balance: { current: 0, monthlyCharge: 0, breakdown: [] },
    tickets: [],
    votings: [],
    announcements: []
  });

  const handlePayment = async () => {
    if (!selectedGateway) {
      alert('Оберіть спосіб оплати');
      return;
    }
    if (payAmount <= 0) {
      alert('Правильна сума оплати');
      return;
    }
    
    setPaymentProcessing(true);
    try {
      const res = await fetch('/api/finance/pay', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: payAmount, gateway: selectedGateway })
      });
      
      if (res.ok) {
        alert(`Платіж зареєстровано в базі! Перенаправляємо на ${selectedGateway}...`);
        setShowPayModal(false);
        setSelectedGateway(null);
        setPayAmount(0);
      } else {
        alert('Помилка при оплаті');
      }
    } catch (err) {
      alert('Помилка при оплаті');
    } finally {
      setPaymentProcessing(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
      
        let finData = null, tktData = [], votData = [], annData = [];
        
        try {
          const finRes = await fetch('/api/finance', { headers });
          if (finRes.ok) finData = await finRes.json();
        } catch (e) { console.error('Dashboard: finance fetch failed', e); }
        
        try {
          const tktRes = await fetch('/api/tickets', { headers });
          if (tktRes.ok) tktData = await tktRes.json();
        } catch (e) { console.error('Dashboard: tickets fetch failed', e); }
        
        try {
          const votRes = await fetch('/api/votings', { headers });
          if (votRes.ok) votData = await votRes.json();
        } catch (e) { console.error('Dashboard: votings fetch failed', e); }
        
        try {
          const annRes = await fetch('/api/announcements', { headers });
          if (annRes.ok) annData = await annRes.json();
        } catch (e) { console.error('Dashboard: announcements fetch failed', e); }

        setData({
          balance: finData?.balance ? {
            current: finData.balance.current || 0,
            monthlyCharge: finData.balance.monthlyCharge || finData.balance.monthlycharge || 0,
            lastPayment: finData.balance.lastPayment || { amount: 0, date: '-' },
            breakdown: Array.isArray(finData.balance.breakdown) ? finData.balance.breakdown : []
          } : { current: 0, monthlyCharge: 0, lastPayment: { amount: 0, date: '-' }, breakdown: [] },
          tickets: Array.isArray(tktData) ? tktData : [],
          votings: Array.isArray(votData) ? votData : [],
          announcements: Array.isArray(annData) ? annData : [],
        });
      } catch (err) {
        console.error('Помилка завантаження даних панелі:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const currentBalance = data.balance.current;

  const quickActions = [
    { icon: Gauge, label: 'Подати показники', color: 'from-blue-500 to-cyan-500', to: '/meters' },
    { icon: Wrench, label: 'Створити заявку', color: 'from-purple-500 to-pink-500', to: '/tickets' },
    { icon: DoorOpen, label: 'Відкрити двері', color: 'from-emerald-500 to-teal-500', to: '/security' },
    { icon: Vote, label: 'Голосувати', color: 'from-amber-500 to-orange-500', to: '/voting' },
  ];

  const activeTickets = data.tickets.filter(t => t.status !== 'resolved');
  const activeVotings = data.votings.filter(v => v.status === 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-[var(--color-active-blue)]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in">
  
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {(() => {
            const h = new Date().getHours();
            if (h < 6) return '🌙 Доброї ночі';
            if (h < 12) return '🌅 Доброго ранку';
            if (h < 18) return '☀️ Доброго дня';
            return '🌆 Доброго вечора';
          })()}, {currentUser?.name?.split(' ')[0]}!
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          {new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

     
      {currentUser?.role !== 'admin' && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-navy-800)] to-[var(--color-navy-900)] text-white p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <p className="text-white/60 text-sm font-medium mb-1">Поточний баланс</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold tracking-tight">
                {Math.abs(currentBalance).toLocaleString('uk-UA', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-lg text-white/60 mb-1">грн</span>
              {currentBalance < 0 ? (
                <span className="flex items-center gap-1 text-red-300 text-sm font-medium mb-1">
                  <TrendingDown size={16} /> Заборгованість
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-300 text-sm font-medium mb-1">
                  <TrendingUp size={16} /> Переплата
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setPayAmount(Math.abs(data.balance.current)); setShowPayModal(true); }} className="btn-primary bg-white/15 hover:bg-white/25 backdrop-blur border border-white/10 shadow-none">
                <Wallet size={16} /> Сплатити
              </button>
              <button onClick={() => navigate('/finance')} className="btn-secondary bg-transparent border-white/20 text-white hover:bg-white/10">
                Детальніше
              </button>
            </div>
          </div>
        </div>
      )}

    
      <div>
        <h2 className="text-lg font-semibold mb-3">Швидкі дії</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="card flex flex-col items-center gap-3 py-6 hover:scale-[1.02] transition-all group cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                <action.icon size={24} className="text-white" />
              </div>
              <span className="text-sm font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

     
      <div className="grid lg:grid-cols-3 gap-4">
      
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Активні голосування</h3>
            <span className="badge badge-info">{activeVotings.length}</span>
          </div>
          {activeVotings.map(v => (
            <div key={v.id} className="mb-3 last:mb-0">
              <p className="text-sm font-medium">{v.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-active-blue)] rounded-full transition-all"
                    style={{ width: `${v.options?.length ? (v.options.reduce((a, o) => a + o.votes, 0) / v.totalVoters) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {v.options?.length ? v.options.reduce((a, o) => a + o.votes, 0) : 0}/{v.totalVoters}
                </span>
              </div>
              {!v.voted && (
                <button onClick={() => navigate('/voting')} className="text-xs text-[var(--color-active-blue)] font-medium mt-1 hover:underline">
                  Проголосувати →
                </button>
              )}
            </div>
          ))}
        </div>

      
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Заявки</h3>
            <span className="badge badge-warning">{activeTickets.length}</span>
          </div>
          {activeTickets.slice(0, 3).map(t => (
            <div key={t.id} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${t.status === 'new' ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t.status === 'new' ? 'Нова' : 'В роботі'} · {t.createdAt}
                </p>
              </div>
            </div>
          ))}
          <button onClick={() => navigate('/tickets')} className="text-sm text-[var(--color-active-blue)] font-medium mt-2 hover:underline flex items-center gap-1">
            Усі заявки <ArrowRight size={14} />
          </button>
        </div>

     
        {currentUser?.role !== 'admin' && (
          <div className="card">
            <h3 className="font-semibold mb-4">Нарахування за місяць</h3>
            {data.balance.breakdown && data.balance.breakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                <span className="text-sm text-[var(--color-text-secondary)]">{item.name}</span>
                <span className="text-sm font-semibold">{item.amount.toLocaleString()} ₴</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 mt-1">
              <span className="text-sm font-semibold">Разом</span>
              <span className="text-base font-bold text-[var(--color-active-blue)]">
                {data.balance.monthlyCharge.toLocaleString()} ₴
              </span>
            </div>
          </div>
        )}
      </div>

     
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Останні новини</h2>
          <button onClick={() => navigate('/news')} className="text-sm text-[var(--color-active-blue)] font-medium hover:underline flex items-center gap-1">
            Усі новини <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {data.announcements.slice(0, 4).map((news, i) => (
            <div key={news.id} className="card slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  news.category === 'warning' ? 'bg-amber-50 text-amber-600' :
                  news.category === 'important' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {news.category === 'warning' ? <AlertTriangle size={20} /> :
                   news.category === 'important' ? <Calendar size={20} /> :
                   <Clock size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold mb-1">{news.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{news.content}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-2">{news.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

     
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in" onClick={() => setShowPayModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Оплата</h2>
              <button onClick={() => setShowPayModal(false)} className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 p-4 rounded-xl bg-[var(--color-surface-alt)]">
              <p className="text-sm text-[var(--color-text-secondary)]">Залишок боргу</p>
              <p className="text-3xl font-bold mt-1">{Math.abs(payAmount).toLocaleString('uk-UA')} ₴</p>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium">Сума оплати</label>
              <input 
                type="number" 
                value={payAmount} 
                onChange={e => setPayAmount(Number(e.target.value))} 
                className="input" 
              />
            </div>

            <p className="text-sm font-medium mb-3">Спосіб оплати</p>
            <div className="space-y-2 mb-6">
              {[
                { name: 'LiqPay', color: '#7AB72B' },
                { name: 'Portmone', color: '#E4002B' },
                { name: 'iPay', color: '#FF6B00' },
              ].map(gw => (
                <button 
                  key={gw.name} 
                  onClick={() => setSelectedGateway(gw.name)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    selectedGateway === gw.name 
                      ? 'border-[var(--color-active-blue)] bg-blue-50' 
                      : 'border-[var(--color-border)] hover:border-[var(--color-active-blue)] hover:bg-blue-50/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: gw.color }}>
                    {gw.name.charAt(0)}
                  </div>
                  <span className="font-medium text-sm flex-1">{gw.name}</span>
                  {selectedGateway === gw.name && <CheckCircle size={18} className="text-[var(--color-active-blue)]" />}
                </button>
              ))}
            </div>

            <button 
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={handlePayment}
              disabled={paymentProcessing || !selectedGateway}
            >
              {paymentProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {paymentProcessing ? 'Платіж в обробці...' : 'Сплатити'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

