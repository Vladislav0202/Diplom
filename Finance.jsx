import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, CreditCard, Receipt, Search, CheckCircle, X, Loader2, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const tabs = ['Платежі'];
const adminTabs = ['Платежі мешканців', 'Мешканці (Борги)', 'Бюджет будинку'];

export default function Finance() {
  const { token, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showPayModal, setShowPayModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    payments: [],
    balance: { current: 0, monthlyCharge: 0, lastPayment: { amount: 0, date: '-' }, breakdown: [] },
    budget: [],
    buildingStats: { totalDebt: 0, totalResidents: 0, paidThisMonth: 0, averageDebt: 0 },
    residentsDebts: [],
    historicalData: [],
    allPayments: []
  });
  const [payAmount, setPayAmount] = useState(0);

  const fetchData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/finance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Finance API error:', res.status);
        return;
      }
      const json = await res.json();
      if (json) {
        const newData = {
          payments: Array.isArray(json.payments) ? json.payments : [],
          balance: json.balance ? {
            current: json.balance.current || 0,
            monthlyCharge: json.balance.monthlyCharge || json.balance.monthlycharge || 0,
            lastPayment: json.balance.lastPayment || { amount: 0, date: '-' },
            breakdown: Array.isArray(json.balance.breakdown) ? json.balance.breakdown : []
          } : data.balance,
          budget: Array.isArray(json.budget) ? json.budget : [],
          buildingStats: json.buildingStats || data.buildingStats,
          residentsDebts: Array.isArray(json.residentsDebts) ? json.residentsDebts : [],
          historicalData: Array.isArray(json.historicalData) ? json.historicalData : [],
          allPayments: Array.isArray(json.allPayments) ? json.allPayments : []
        };
        setData(prev => ({ ...prev, ...newData }));
      }
    } catch (err) {
      console.error('Не вдалося завантажити дані фінансів', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

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
        await fetchData();
      } else {
        alert('Помилка при оплаті');
      }
    } catch (err) {
      alert('Помилка при оплаті');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const filtered = data.payments.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const isAdmin = currentUser?.role === 'admin';
  const displayTabs = isAdmin ? adminTabs : tabs;

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
        <h1 className="text-2xl font-bold">Фінанси</h1>
        {!isAdmin && (
          <button onClick={() => { setPayAmount(Math.abs(data.balance.current)); setShowPayModal(true); }} className="btn-primary">
            <CreditCard size={16} /> Сплатити
          </button>
        )}
      </div>

    
      <div className="flex gap-1 bg-[var(--color-surface-alt)] p-1 rounded-xl overflow-x-auto">
        {displayTabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === i ? 'bg-white shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

    
      {!isAdmin && activeTab === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-red-50 to-white border-red-100">
              <p className="text-sm text-[var(--color-text-secondary)]">Заборгованість</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{Math.abs(data.balance.current).toLocaleString('uk-UA')} ₴</p>
            </div>
            <div className="card bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <p className="text-sm text-[var(--color-text-secondary)]">Щомісячний внесок</p>
              <p className="text-2xl font-bold text-[var(--color-active-blue)] mt-1">{data.balance.monthlyCharge.toLocaleString()} ₴</p>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-white border-green-100">
              <p className="text-sm text-[var(--color-text-secondary)]">Останній платіж</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{data.balance.lastPayment.amount.toLocaleString()} ₴</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{data.balance.lastPayment.date}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Пошук платежів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input w-auto min-w-[160px]"
            >
              <option value="all">Усі статуси</option>
              <option value="paid">Оплачено</option>
              <option value="pending">Очікує оплати</option>
            </select>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Дата</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Опис</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Сума</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{p.date}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {p.type === 'payment' ? <Receipt size={16} className="text-green-500 shrink-0" /> : <Wallet size={16} className="text-blue-500 shrink-0" />}
                          <span className="text-sm font-medium">{p.description}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold">
                        <span className={p.type === 'payment' ? 'text-green-600' : ''}>
                          {p.type === 'payment' ? '-' : ''}{p.amount.toLocaleString()} ₴
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                          {p.status === 'paid' ? '✓ Оплачено' : '⏳ Очікує'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      
      {isAdmin && activeTab === 0 && (
        <div className="space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Дата</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Квартира</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Мешканець</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Опис</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Сума</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.allPayments || []).map(p => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{p.date}</td>
                      <td className="px-5 py-4 text-sm font-medium">Кв. {p.apartment}</td>
                      <td className="px-5 py-4 text-sm">{p.resident_name}</td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium">{p.description}</span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold">
                        <span className={p.type === 'payment' ? 'text-green-600' : ''}>
                          {p.type === 'payment' ? '-' : ''}{p.amount.toLocaleString()} ₴
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                          {p.status === 'paid' ? '✓ Оплачено' : '⏳ Очікує'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data.allPayments || data.allPayments.length === 0) && (
                <div className="p-8 text-center text-[var(--color-text-secondary)]">
                  Немає платежів
                </div>
              )}
            </div>
          </div>
        </div>
      )}

     
      {isAdmin && activeTab === 1 && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Квартира</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Мешканець</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Борг (₴)</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody>
                {(data.residentsDebts || []).map((resident) => (
                  <tr key={resident.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="px-5 py-4 text-sm font-medium">Кв. {resident.apartment}</td>
                    <td className="px-5 py-4 text-sm">{resident.name}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold">
                      <span className={resident.debt > 0 ? 'text-red-600' : 'text-green-600'}>
                        {resident.debt.toLocaleString()} ₴
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`badge ${resident.debt > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {resident.debt > 0 ? '⏳ Борг' : '✓ Нормально'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

   
      {(isAdmin && activeTab === 2) && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4">Розподіл витрат</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.budget}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.budget.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `${val}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {data.budget.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-[var(--color-text-secondary)]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Витрати за категоріями (грн)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.budget} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => `${val.toLocaleString()} ₴`} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {data.budget.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="font-semibold mb-4">Деталізація бюджету</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.budget.map((item) => (
                <div key={item.name} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--color-surface-alt)]">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: item.color }}>
                    {item.value}%
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-lg font-bold">{item.amount.toLocaleString()} ₴</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

     
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
              <p className="text-3xl font-bold mt-1">{Math.abs(data.balance.current).toLocaleString('uk-UA')} ₴</p>
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
