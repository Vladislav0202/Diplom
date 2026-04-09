import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Home, MapPin, Shield, LogOut, FileText, Download, Edit, Lock, Check, X, Save, Ruler } from 'lucide-react';

const roleLabels = {
  resident: 'Мешканець',
  admin: 'Адміністратор',
};

const roleBadge = {
  resident: 'badge-info',
  admin: 'bg-purple-50 text-purple-700',
};

export default function Profile() {
  const { currentUser, logout, token, checkAuth } = useAuth();
  const navigate = useNavigate();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    apartment: currentUser?.apartment || ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const documents = [
    { id: 1, name: 'Статут ОСББ', size: '2.4 MB', date: '12 Січ 2026', type: 'pdf' },
    { id: 2, name: 'Протокол загальних зборів №15', size: '1.1 MB', date: '05 Бер 2026', type: 'pdf' },
    { id: 3, name: 'Фінансовий звіт за 2025 рік', size: '3.8 MB', date: '20 Лют 2026', type: 'pdf' },
    { id: 4, name: 'Договір з підрядною організацією "Житло-Сервіс"', size: '1.5 MB', date: '15 Січ 2026', type: 'pdf' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Профіль оновлено!' });
        setIsEditingProfile(false);
        if (checkAuth) await checkAuth();
      } else {
        setMessage({ type: 'error', text: data.error || 'Помилка оновлення' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Помилка мережі' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'Паролі не співпадають' });
      return;
    }
    if (passwords.new.length < 4) {
      setMessage({ type: 'error', text: 'Мінімум 4 символи' });
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Пароль змінено!' });
        setShowPasswordForm(false);
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Помилка' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Помилка мережі' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const info = [
    { icon: User, label: 'ПІБ', field: 'name', value: currentUser?.name },
    { icon: Mail, label: 'Email', field: 'email', value: currentUser?.email },
    { icon: Phone, label: 'Телефон', field: 'phone', value: currentUser?.phone },
    { icon: Home, label: 'Квартира', field: 'apartment', value: currentUser?.apartment ? `№${currentUser.apartment}` : '—' },
    { icon: Ruler, label: 'Площа', field: null, value: currentUser?.area ? `${currentUser.area} м²` : '—' },
    { icon: MapPin, label: 'Адреса', field: null, value: 'проспект Дмитра Яворницького, 19' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <h1 className="text-2xl font-bold">Профіль</h1>

      
      {message.text && (
        <div className={`p-3 rounded-xl text-sm text-center font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

     
      <div className="card text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-indigo-500/25">
          {currentUser?.name?.charAt(0)}
        </div>
        <h2 className="text-xl font-bold">{currentUser?.name}</h2>
        <span className={`badge ${roleBadge[currentUser?.role]} mt-2`}>
          <Shield size={12} className="mr-1" /> {roleLabels[currentUser?.role]}
        </span>
      </div>

      
      <div className="card space-y-0 relative">
        {!isEditingProfile && (
          <button 
            onClick={() => {
              setFormData({
                name: currentUser?.name || '',
                email: currentUser?.email || '',
                phone: currentUser?.phone || '',
                apartment: currentUser?.apartment || ''
              });
              setIsEditingProfile(true);
            }} 
            className="absolute top-4 right-4 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-active-blue)] hover:bg-blue-50 bg-[var(--color-surface-alt)] rounded-lg transition-colors z-10"
            title="Редагувати профіль"
          >
            <Edit size={16} />
          </button>
        )}
        
        {isEditingProfile ? (
          <div className="p-2 space-y-4">
            <h3 className="font-semibold mb-4 text-lg">Редагування профілю</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">ПІБ</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input py-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input py-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Телефон</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input py-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Квартира</label>
                <input type="text" value={formData.apartment} onChange={e => setFormData({...formData, apartment: e.target.value})} className="input py-2" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-[var(--color-border)]">
              <button onClick={() => setIsEditingProfile(false)} disabled={saving} className="btn-secondary">
                Скасувати
              </button>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
                <Check size={16} /> Зберегти зміни
              </button>
            </div>
          </div>
        ) : (
          info.map((item, i) => (
            <div key={i} className={`flex items-center gap-4 py-3.5 ${i < info.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-alt)] flex items-center justify-center shrink-0">
                <item.icon size={18} className="text-[var(--color-text-muted)]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            </div>
          ))
        )}
      </div>

     
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Lock size={18} /> Безпека
          </h3>
          {!showPasswordForm && (
            <button onClick={() => setShowPasswordForm(true)} className="btn-secondary btn-sm">
              Змінити пароль
            </button>
          )}
        </div>
        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Поточний пароль</label>
              <input type="password" required autoComplete="new-password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Новий пароль</label>
              <input type="password" required autoComplete="new-password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Підтвердження</label>
              <input type="password" required autoComplete="new-password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="input" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary btn-sm">
                <Save size={14} /> Зберегти
              </button>
              <button type="button" onClick={() => { setShowPasswordForm(false); setPasswords({ current: '', new: '', confirm: '' }); }} className="btn-secondary btn-sm">
                Скасувати
              </button>
            </div>
          </form>
        )}
      </div>

      {currentUser?.role === 'admin' && (
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText size={18} /> Документи
        </h3>
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-alt)] hover:bg-[var(--color-surface-hover)] transition-colors">
              <FileText size={16} className="text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{doc.size} · {doc.date}</p>
              </div>
              <button 
                className="text-[var(--color-active-blue)] hover:underline text-sm font-medium flex items-center gap-1"
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
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      )}

     
      <button onClick={handleLogout} className="btn-danger w-full justify-center">
        <LogOut size={16} /> Вийти з системи
      </button>
    </div>
  );
}
