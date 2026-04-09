import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Car, DoorOpen, QrCode, Plus, Wifi, WifiOff, Lock, Unlock, Copy, X, Clock, User, Truck, Wrench as WrenchIcon, Eye, Loader2 } from 'lucide-react';

const tabs = ['Камери', 'СКУД', 'Гостьові перепустки'];

export default function Security() {
  const { token, currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 0 : 1); 
  const [camerasList, setCamerasList] = useState([]);
  const [accessList, setAccessList] = useState([]);
  const [passesList, setPassesList] = useState([]);
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loading, setLoading] = useState(true);

  const allTabs = ['Камери', 'СКУД', 'Гостьові перепустки'];
  const displayTabs = isAdmin ? allTabs : allTabs.slice(1); 

  const fetchSecurityData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/security', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Security API error:', res.status);
        return;
      }
      const data = await res.json();
      if (data && typeof data === 'object') {
        setCamerasList(Array.isArray(data.cameras) ? data.cameras : []);
        setAccessList(Array.isArray(data.accessPoints) ? data.accessPoints : []);
        setPassesList(Array.isArray(data.guestPasses) ? data.guestPasses : []);
      }
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [token]);

  const handleUnlock = async (id) => {
    setAccessList(accessList.map(ap =>
      ap.id === id ? { ...ap, status: 'unlocked' } : ap
    ));
    
    try {
      await fetch(`/api/security/door/${id}/unlock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch(err) {
      console.error(err);
    }

    setTimeout(() => {
      setAccessList(prev => prev.map(ap =>
        ap.id === id ? { ...ap, status: 'locked' } : ap
      ));
    }, 5000);
  };

  const handleCreatePass = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    
    try {
      await fetch('/api/security/guest-pass', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.get('name'),
          type: form.get('type'),
          validUntil: `${form.get('date')} ${form.get('time')}`
        })
      });
      setShowCreatePass(false);
      fetchSecurityData();
    } catch (err) {
      alert('Помилка створення перепустки');
    }
  };

  const iconMap = {
    car: Car,
    fence: DoorOpen,
    door: DoorOpen,
  };

  const typeIcons = {
    courier: Truck,
    guest: User,
    service: WrenchIcon,
  };

  const typeLabels = {
    courier: "Кур'єр",
    guest: 'Гість',
    service: 'Сервіс',
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
      <h1 className="text-2xl font-bold">Безпека</h1>

      
      <div className="flex gap-1 bg-[var(--color-surface-alt)] p-1 rounded-xl w-fit">
        {displayTabs.map((tab, i) => {
          const realIndex = isAdmin ? i : i + 1;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(realIndex)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === realIndex ? 'bg-white shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

     
      {activeTab === 0 && isAdmin && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {camerasList.map((cam) => (
              <div key={cam.id} className="card overflow-hidden p-0 group cursor-pointer" onClick={() => setSelectedCamera(cam)}>
                <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <Camera size={32} className="text-white/30 mx-auto mb-2" />
                    <p className="text-white/50 text-sm">Натисніть для перегляду</p>
                  </div>
                  
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {cam.status === 'online' ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">LIVE</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs text-red-400 font-medium">OFFLINE</span>
                      </>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-all flex items-center justify-center">
                    <Eye size={32} className="text-white/0 group-hover:text-white/50 transition-all" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm">{cam.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{cam.location}</p>
                </div>
              </div>
            ))}
          </div>

         
          {selectedCamera && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 fade-in" onClick={() => setSelectedCamera(null)}>
              <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white">
                    <h3 className="font-semibold">{selectedCamera.name}</h3>
                    <p className="text-sm text-white/50">{selectedCamera.location}</p>
                  </div>
                  <button onClick={() => setSelectedCamera(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                    <X size={20} className="text-white" />
                  </button>
                </div>
                <div className="aspect-video bg-slate-800 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Camera size={48} className="text-white/20 mx-auto mb-3" />
                    {selectedCamera.status === 'online' ? (
                      <>
                        <p className="text-white/50">Демо: Пряма трансляція</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-red-400 text-sm font-medium">REC</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-white/50">Камера офлайн</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      
      {activeTab === 1 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {accessList.map(ap => {
            const IconComp = iconMap[ap.icon] || DoorOpen;
            const isUnlocked = ap.status === 'unlocked';
            return (
              <div key={ap.id} className={`card flex items-center gap-4 transition-all ${isUnlocked ? 'ring-2 ring-green-400 bg-green-50/50' : ''}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  isUnlocked ? 'bg-green-100 text-green-600' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
                }`}>
                  <IconComp size={26} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{ap.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                    {isUnlocked ? (
                      <><Unlock size={12} className="text-green-500" /> Відкрито (5 сек)</>
                    ) : (
                      <><Lock size={12} /> Заблоковано</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleUnlock(ap.id)}
                  disabled={isUnlocked}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isUnlocked
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                  style={isUnlocked ? { animation: 'pulse-glow 1.5s ease-in-out infinite' } : {}}
                >
                  {isUnlocked ? '✓ Відкрито' : 'Відкрити'}
                </button>
              </div>
            );
          })}
        </div>
      )}

     
      {activeTab === 2 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCreatePass(true)} className="btn-primary">
              <Plus size={16} /> Нова перепустка
            </button>
          </div>

          <div className="space-y-3">
            {passesList.map(pass => {
              const TypeIcon = typeIcons[pass.type] || User;
              const isExpired = pass.status === 'expired';
              return (
                <div key={pass.id} className={`card flex items-center gap-4 ${isExpired ? 'opacity-50' : ''}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isExpired ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <TypeIcon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{pass.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {typeLabels[pass.type]} · До {pass.validUntil}
                    </p>
                  </div>
                  <div className="text-center shrink-0">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      isExpired ? 'bg-gray-100' : 'bg-[var(--color-surface-alt)]'
                    }`}>
                      <QrCode size={32} className={isExpired ? 'text-gray-300' : 'text-[var(--color-text-primary)]'} />
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">{pass.code}</p>
                  </div>
                  <span className={`badge ${isExpired ? 'bg-gray-100 text-gray-500' : 'badge-success'}`}>
                    {isExpired ? 'Завершено' : 'Активна'}
                  </span>
                </div>
              );
            })}
          </div>

          
          {showCreatePass && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in" onClick={() => setShowCreatePass(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold">Нова перепустка</h2>
                  <button onClick={() => setShowCreatePass(false)} className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <form className="space-y-4" onSubmit={handleCreatePass}>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Ім'я відвідувача</label>
                    <input name="name" required className="input" placeholder="Наприклад: Нова Пошта" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Тип</label>
                    <select name="type" className="input">
                      <option value="guest">Гість</option>
                      <option value="courier">Кур'єр</option>
                      <option value="service">Сервісна служба</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Дата</label>
                      <input type="date" name="date" required className="input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Час</label>
                      <input type="time" name="time" required className="input" />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full justify-center">
                    <QrCode size={16} /> Створити QR-перепустку
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
