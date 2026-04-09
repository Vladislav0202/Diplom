import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Search, FileText, Download, AlertTriangle, TrendingUp, Building2, Filter, Loader2, Trash2, Edit2, X, Save, Droplets, Flame, Zap, Gauge } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const tabs = ['Мешканці', 'Показники', 'Документи'];

const statusConfig = {
  active: { label: 'Активний', badge: 'badge-success' },
  warning: { label: 'Попередження', badge: 'badge-warning' },
  blocked: { label: 'Заблокований', badge: 'badge-danger' },
};

const roleLabels = { resident: 'Мешканець', admin: 'Адміністратор' };

export default function Admin() {
  const { token, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [allMeters, setAllMeters] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  
  const documents = [
    { id: 1, name: 'Статут ОСББ', size: '2.4 MB', date: '12 Січ 2026', type: 'pdf' },
    { id: 2, name: 'Протокол загальних зборів №15', size: '1.1 MB', date: '05 Бер 2026', type: 'pdf' },
    { id: 3, name: 'Фінансовий звіт за 2025 рік', size: '3.8 MB', date: '20 Лют 2026', type: 'pdf' },
    { id: 4, name: 'Договір з підрядною організацією "Житло-Сервіс"', size: '1.5 MB', date: '15 Січ 2026', type: 'pdf' },
  ];

  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        try {
          const resRes = await fetch('/api/admin/residents', { headers });
          if (resRes.ok) {
            const data = await resRes.json();
            setResidents(Array.isArray(data) ? data : []);
          }
        } catch (e) { console.error('Admin: residents fetch failed', e); }
        
        try {
          const finRes = await fetch('/api/finance', { headers });
          if (finRes.ok) {
            const finData = await finRes.json();
            setBudgetData(Array.isArray(finData.budget) ? finData.budget : []);
          }
        } catch (e) { console.error('Admin: finance fetch failed', e); }
      } catch (err) {
        console.error('Помилка завантаження даних адміна:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);

  const handleDeleteResident = async (id, name) => {
    if (!window.confirm(`Ви дійсно хочете видалити мешканця ${name}? Це видалить всі його платежі, заявки та інші дані.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/residents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setResidents(residents.filter(r => r.id !== id));
      } else {
        alert('Помилка видалення');
      }
    } catch (err) {
      console.error(err);
      alert('Помилка сервера');
    }
  };

  const handleEditResident = (resident) => {
    setEditingUser(resident.id);
    setEditFormData({ ...resident });
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/admin/residents/${editingUser}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          apartment: editFormData.apartment,
          role: editFormData.role,
          area: editFormData.area || 0,
          debt: editFormData.debt || 0
        })
      });
      if (res.ok) {
        const updated = { ...editFormData, role: editFormData.role };
        setResidents(residents.map(r => r.id === editingUser ? { ...r, ...updated } : r));
        setEditingUser(null);
        setEditFormData({});
        alert('Дані мешканця успішно оновлено');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Помилка при оновленні: ${errData.error || res.status}`);
      }
    } catch (err) {
      console.error(err);
      alert('Помилка сервера');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({});
  };

  const filteredResidents = residents.filter(r => {
    if (filterRole !== 'all' && r.role !== filterRole) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.apartment.includes(searchQuery)) return false;
    return true;
  });

  const totalDebt = residents.reduce((a, r) => a + r.debt, 0);
  const debtors = residents.filter(r => r.debt > 0).length;
  const totalArea = residents.reduce((a, r) => a + r.area, 0);

  const debtChart = residents
    .filter(r => r.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .map(r => ({ name: `Кв.${r.apartment}`, debt: r.debt }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-[var(--color-active-blue)]" size={40} />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <AlertTriangle size={64} className="text-amber-500 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Немає доступу</h2>
        <p className="text-[var(--color-text-secondary)]">
          Ця сторінка доступна лише для адміністраторів ОСББ.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in">
      <h1 className="text-2xl font-bold">Панель адміністратора</h1>

     
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-[var(--color-active-blue)]" />
            <span className="text-xs text-[var(--color-text-muted)]">Мешканців</span>
          </div>
          <p className="text-2xl font-bold">{residents.length}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-purple-500" />
            <span className="text-xs text-[var(--color-text-muted)]">Площа (м²)</span>
          </div>
          <p className="text-2xl font-bold">{totalArea.toFixed(0)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs text-[var(--color-text-muted)]">Боржників</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{debtors}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-red-500" />
            <span className="text-xs text-[var(--color-text-muted)]">Заборгованість</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{totalDebt.toLocaleString()} ₴</p>
        </div>
      </div>

      
      <div className="flex gap-1 bg-[var(--color-surface-alt)] p-1 rounded-xl w-fit">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === i ? 'bg-white shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      
      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Ім'я або номер квартири..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input w-auto"
            >
              <option value="all">Усі ролі</option>
              <option value="resident">Мешканці</option>
              <option value="admin">Адміністратори</option>
            </select>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Кв.</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Мешканець</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Роль</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Площа</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Борг</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Статус</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map(r => (
                    <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium">{r.apartment}</td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium">{r.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{r.phone}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${r.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                          {roleLabels[r.role] || r.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right">{r.area} м²</td>
                      <td className="px-5 py-3.5 text-sm text-right font-medium">
                        {r.debt > 0 ? (
                          <span className="text-red-600">{r.debt.toLocaleString()} ₴</span>
                        ) : (
                          <span className="text-green-600">0 ₴</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`badge badge-success`}>Активний</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleEditResident(r)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Редагувати мешканця"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteResident(r.id, r.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Видалити мешканця"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



     
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {[
              { key: 'water_cold', label: 'Холодна вода', icon: Droplets, color: '#3b82f6', unit: 'м³' },
              { key: 'water_hot', label: 'Гаряча вода', icon: Flame, color: '#ef4444', unit: 'м³' },
              { key: 'electricity', label: 'Електроенергія', icon: Zap, color: '#f59e0b', unit: 'кВт·год' },
              { key: 'heat', label: 'Опалення', icon: Gauge, color: '#22c55e', unit: 'Гкал' },
            ].map(meter => (
              <div key={meter.key} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: meter.color }}>
                    <meter.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{meter.label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{meter.unit}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {residents.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                      <span className="text-sm">Кв. {r.apartment} ({r.name})</span>
                      <span className="text-sm font-semibold">{(45 + Math.random() * 20).toFixed(1)} {meter.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    
      {activeTab === 2 && (
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <FileText size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{doc.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{doc.date} · {doc.size}</p>
              </div>
              <button 
                className="btn-secondary btn-sm"
                onClick={() => {
                  const element = document.createElement("a");
                  const file = new Blob([`Демонстраційна версія документа: ${doc.name}\nДата: ${doc.date}\n\nЦе згенерований текстовий файл для демонстрації завантаження.`], {type: 'text/plain'});
                  element.href = URL.createObjectURL(file);
                  element.download = `${doc.name}.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
              >
                <Download size={14} /> Завантажити
              </button>
            </div>
          ))}
        </div>
      )}

     
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in" onClick={handleCancelEdit}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Редагування профілю</h2>
              <button onClick={handleCancelEdit} className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Ім'я</label>
                <input 
                  type="text" 
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input 
                  type="email" 
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Телефон</label>
                <input 
                  type="tel" 
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Квартира</label>
                <input 
                  type="text" 
                  value={editFormData.apartment || ''}
                  onChange={(e) => setEditFormData({...editFormData, apartment: e.target.value})}
                  className="input"
                  disabled
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Площа (м²)</label>
                <input 
                  type="number" 
                  value={editFormData.area || 0}
                  onChange={(e) => setEditFormData({...editFormData, area: Number(e.target.value)})}
                  className="input"
                  step="0.1"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Роль</label>
                <select 
                  value={editFormData.role || 'resident'}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="input"
                >
                  <option value="resident">Мешканець</option>
                  <option value="admin">Адміністратор</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Борг (₴)</label>
                <input 
                  type="number" 
                  value={editFormData.debt || 0}
                  onChange={(e) => setEditFormData({...editFormData, debt: Number(e.target.value)})}
                  className="input"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleSaveEdit}
                className="btn-primary flex-1 justify-center"
              >
                <Save size={16} /> Зберегти
              </button>
              <button 
                onClick={handleCancelEdit}
                className="btn-secondary flex-1 justify-center"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
