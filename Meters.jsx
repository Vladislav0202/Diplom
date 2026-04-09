import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Gauge, Droplets, Flame, Zap, Send, Camera, TrendingUp, History, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const meterTypes = [
  { key: 'water_cold', label: 'Холодна вода', icon: Droplets, color: '#3b82f6', unit: 'м³' },
  { key: 'water_hot', label: 'Гаряча вода', icon: Flame, color: '#ef4444', unit: 'м³' },
  { key: 'electricity', label: 'Електроенергія', icon: Zap, color: '#f59e0b', unit: 'кВт·год' },
  { key: 'heat', label: 'Опалення', icon: Gauge, color: '#22c55e', unit: 'Гкал' },
];

export default function Meters() {
  const { token, currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 1 : 0);
  const [selectedMeter, setSelectedMeter] = useState('water_cold');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [readings, setReadings] = useState({ water_cold: '', water_hot: '', electricity: '', heat: '' });
  const [submitted, setSubmitted] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [meterReadings, setMeterReadings] = useState({ water_cold: [], water_hot: [], electricity: [], heat: [] });
  const [residents, setResidents] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);
  const [adminMeterReadings, setAdminMeterReadings] = useState({});

  const fetchAdminMeters = async (residentId) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/meters?resident=${residentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Meters API error:', res.status);
        return null;
      }
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch resident meters:', err);
      return null;
    }
  };

  const fetchData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/meters', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Meters API error:', res.status);
        return;
      }
      const data = await res.json();
      if (data && typeof data === 'object') {
        setMeterReadings({
          water_cold: Array.isArray(data.water_cold) ? data.water_cold : [],
          water_hot: Array.isArray(data.water_hot) ? data.water_hot : [],
          electricity: Array.isArray(data.electricity) ? data.electricity : [],
          heat: Array.isArray(data.heat) ? data.heat : []
        });
      }

      // Для адміна завантажуємо список мешканців
      if (isAdmin) {
        try {
          const resRes = await fetch('/api/admin/residents', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resRes.ok) {
            const residentsData = await resRes.json();
            setResidents(Array.isArray(residentsData) ? residentsData : []);
            
            // Завантажуємо показники для всіх мешканців
            const metersMap = {};
            for (const resident of residentsData) {
              const metersData = await fetchAdminMeters(resident.id);
              if (metersData) {
                metersMap[resident.id] = {
                  water_cold: Array.isArray(metersData.water_cold) ? metersData.water_cold : [],
                  water_hot: Array.isArray(metersData.water_hot) ? metersData.water_hot : [],
                  electricity: Array.isArray(metersData.electricity) ? metersData.electricity : [],
                  heat: Array.isArray(metersData.heat) ? metersData.heat : []
                };
              }
            }
            setAdminMeterReadings(metersMap);
            
            // Вибираємо першого мешканця за замовчуванням
            if (residentsData.length > 0) {
              setSelectedResident(residentsData[0].id);
            }
          }
        } catch (e) {
          console.error('Failed to fetch residents:', e);
        }
      }
    } catch (err) {
      console.error('Failed to fetch meters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const currentType = meterTypes.find(m => m.key === selectedMeter);
  const currentData = meterReadings[selectedMeter] || [];
  const lastReading = currentData.length > 0 ? currentData[currentData.length - 1] : { value: 0 };
  const prevReading = currentData.length > 1 ? currentData[currentData.length - 2] : { value: 0 };
  const consumption = (lastReading.value - prevReading.value).toFixed(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!readings[selectedMeter]) return alert('Введіть показник');
    
    try {
      await fetch('/api/meters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: selectedMeter,
          value: Number(readings[selectedMeter])
        })
      });
      setSubmitted(true);
      fetchData();
      
      setTimeout(() => { 
        setSubmitted(false); 
        setShowSubmitForm(false); 
        setReadings({ ...readings, [selectedMeter]: '' });
      }, 2000);
    } catch (err) {
      alert('Помилка');
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
        <h1 className="text-2xl font-bold">Лічильники</h1>
        {!isAdmin && (
          <button onClick={() => setShowSubmitForm(!showSubmitForm)} className="btn-primary">
            <Send size={16} /> Подати показники
          </button>
        )}
      </div>

      {/* Табуляція для адміна */}
      {isAdmin && (
        <div className="flex gap-2 border-b border-[var(--color-border)] -mx-6 px-6">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 1
                ? 'border-[var(--color-active-blue)] text-[var(--color-active-blue)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            Показники мешканців
          </button>
        </div>
      )}

      {/* Вкладка для особистих показників (тільки для звичайних користувачів) */}
      {!isAdmin && (
        <>
      {showSubmitForm && (
        <div className="card border-[var(--color-active-blue)] border-2 slide-up">
          <h3 className="font-semibold mb-4">Подання показників за березень 2026</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {meterTypes.map(meter => (
                <div key={meter.key}>
                  <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                    <meter.icon size={16} style={{ color: meter.color }} />
                    {meter.label} ({meter.unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder={meterReadings[meter.key]?.length ? `Попередній: ${meterReadings[meter.key]?.slice(-1)[0]?.value}` : '0.0'}
                    value={readings[meter.key]}
                    onChange={(e) => setReadings({ ...readings, [meter.key]: e.target.value })}
                    className="input"
                    disabled={selectedMeter !== meter.key}
                  />
                  {selectedMeter !== meter.key && <span className="text-[10px] text-gray-400 mt-1 block">Оберіть вкладку лічильника, щоб подати показник</span>}
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                <Camera size={16} /> Фотопідтвердження (необов'язково)
              </label>
              <input type="file" accept="image/*" className="input text-sm" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={submitted}>
                {submitted ? '✓ Надіслано!' : 'Надіслати показники'}
              </button>
              <button type="button" onClick={() => setShowSubmitForm(false)} className="btn-secondary">
                Скасувати
              </button>
            </div>
          </form>
        </div>
      )}

      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {meterTypes.map(meter => {
          const data = meterReadings[meter.key] || [];
          const last = data.length > 0 ? data[data.length - 1] : { value: 0 };
          const prev = data.length > 1 ? data[data.length - 2] : { value: 0 };
          const diff = (last.value - prev.value).toFixed(1);
          const isSelected = selectedMeter === meter.key;

          return (
            <button
              key={meter.key}
              onClick={() => setSelectedMeter(meter.key)}
              className={`card text-left transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-[var(--color-active-blue)] shadow-lg' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${meter.color}15` }}>
                  <meter.icon size={18} style={{ color: meter.color }} />
                </div>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">{meter.label}</span>
              </div>
              <p className="text-xl font-bold">{last.value}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{meter.unit}</p>
              <div className="flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: meter.color }}>
                <TrendingUp size={12} /> +{diff} за місяць
              </div>
            </button>
          );
        })}
      </div>

    
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${currentType.color}15` }}>
            <currentType.icon size={20} style={{ color: currentType.color }} />
          </div>
          <div>
            <h3 className="font-semibold">{currentType.label}</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Динаміка за 6 місяців</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={currentData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(val) => [`${val} ${currentType.unit}`, currentType.label]}
              contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={currentType.color}
              strokeWidth={3}
              dot={{ r: 5, fill: currentType.color, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-[var(--color-text-muted)]" />
          <h3 className="font-semibold">Історія показників — {currentType.label}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Місяць</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Показник</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Споживання</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((reading, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 text-sm">{reading.month}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{reading.value} {currentType.unit}</td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: currentType.color }}>
                    {i > 0 ? `+${(reading.value - currentData[i-1].value).toFixed(1)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Вкладка для показників мешканців (тільки для адміна) */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="card">
            <label className="block text-sm font-medium mb-2">Оберіть мешканця</label>
            <select
              value={selectedResident || ''}
              onChange={(e) => setSelectedResident(parseInt(e.target.value))}
              className="input"
            >
              {residents.map(resident => (
                <option key={resident.id} value={resident.id}>
                  Кв. {resident.apartment} - {resident.name}
                </option>
              ))}
            </select>
          </div>

          {selectedResident && adminMeterReadings[selectedResident] ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {meterTypes.map(meter => {
                  const data = adminMeterReadings[selectedResident][meter.key] || [];
                  const last = data.length > 0 ? data[data.length - 1] : { value: 0 };
                  const prev = data.length > 1 ? data[data.length - 2] : { value: 0 };
                  const diff = (last.value - prev.value).toFixed(1);

                  return (
                    <div key={meter.key} className="card">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${meter.color}15` }}>
                          <meter.icon size={18} style={{ color: meter.color }} />
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">{meter.label}</span>
                      </div>
                      <p className="text-xl font-bold">{last.value}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{meter.unit}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: meter.color }}>
                        <TrendingUp size={12} /> +{diff} за місяць
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <History size={18} className="text-[var(--color-text-muted)]" />
                  <h3 className="font-semibold">
                    Показники — {residents.find(r => r.id === selectedResident)?.name}
                  </h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {meterTypes.map(meter => {
                    const data = adminMeterReadings[selectedResident][meter.key] || [];
                    return (
                      <div key={meter.key} className="overflow-x-auto">
                        <h4 className="text-sm font-medium mb-2">{meter.label}</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--color-border)]">
                              <th className="text-left px-2 py-2 text-xs font-semibold text-[var(--color-text-muted)]">Місяць</th>
                              <th className="text-right px-2 py-2 text-xs font-semibold text-[var(--color-text-muted)]">Показник</th>
                              <th className="text-right px-2 py-2 text-xs font-semibold text-[var(--color-text-muted)]">Спожив.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((reading, i) => (
                              <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                                <td className="px-2 py-2 text-xs">{reading.month}</td>
                                <td className="px-2 py-2 text-xs text-right font-medium">{reading.value}</td>
                                <td className="px-2 py-2 text-xs text-right" style={{ color: meter.color }}>
                                  {i > 0 ? `+${(reading.value - data[i-1].value).toFixed(1)}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
