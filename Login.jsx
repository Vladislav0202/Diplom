import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Shield, ArrowRight, Lock, Mail, Phone, Home } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [apartment, setApartment] = useState('');
  const [area, setArea] = useState('');
  const [role, setRole] = useState('resident');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          navigate('/');
        } else {
          setError(res.error || 'Помилка входу');
        }
      } else {
        const res = await register({ email, password, name, phone, apartment, area: parseFloat(area) || 0, role });
        if (res.success) {
          navigate('/');
        } else {
          setError(res.error || 'Помилка реєстрації');
        }
      }
    } catch (err) {
      setError('Сталася помилка, спробуйте пізніше.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg(data.message);
      } else {
        setError(data.error || 'Помилка відновлення паролю');
      }
    } catch {
      setError('Мережева помилка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-navy-900)] via-[var(--color-navy-800)] to-slate-900 flex items-center justify-center p-4">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg fade-in">
       
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-active-blue)] to-[var(--color-active-blue-dark)] shadow-2xl shadow-blue-500/30 mb-6">
            <Home size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Smart House</h1>
          <p className="text-white/50 mt-2">Система управління — проспект Дмитра Яворницького, 19</p>
        </div>

       
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex gap-4 mb-8">
            <button
               type="button"
               onClick={() => { setIsLogin(true); setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
               className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${isLogin && !isForgotPassword ? 'text-white border-blue-500' : 'text-white/40 border-transparent hover:text-white/70'}`}
             >
               УВІЙТИ
             </button>
             <button
               type="button"
               onClick={() => { setIsLogin(false); setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
               className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${!isLogin && !isForgotPassword ? 'text-white border-blue-500' : 'text-white/40 border-transparent hover:text-white/70'}`}
             >
               РЕЄСТРАЦІЯ
             </button>
          </div>

          <form onSubmit={isForgotPassword ? handleResetPassword : handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center mb-4">
                {successMsg}
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    required
                    placeholder="ПІБ"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder:text-white/30 hover:border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative">
                    <Home size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      placeholder="Квартира"
                      value={apartment}
                      onChange={e => setApartment(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder:text-white/30 hover:border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="number"
                      placeholder="Площа (м²)"
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      step="0.1"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder:text-white/30 hover:border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      placeholder="Телефон"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder:text-white/30 hover:border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

              
                <div className="flex gap-4 p-1 bg-slate-900/50 rounded-xl border border-white/10">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${role === 'resident' ? 'bg-blue-500/20 text-blue-400 font-semibold' : 'text-white/50 hover:text-white/80'}`}>
                    <input type="radio" name="role" value="resident" checked={role === 'resident'} onChange={e => setRole(e.target.value)} className="hidden" />
                    <User size={16} /> Мешканець
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${role === 'admin' ? 'bg-purple-500/20 text-purple-400 font-semibold' : 'text-white/50 hover:text-white/80'}`}>
                    <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={e => setRole(e.target.value)} className="hidden" />
                    <Shield size={16} /> Адмін
                  </label>
                </div>
              </>
            )}

            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                required
                placeholder="Email адреса"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder:text-white/30 hover:border-white/20 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
            
            {!isForgotPassword && (
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  required
                  placeholder="Пароль"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder:text-white/30 hover:border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                  autoComplete="current-password"
                />
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                  className="text-sm bg-transparent border-none text-white/50 hover:text-white/80 transition-all cursor-pointer"
                >
                  Забули пароль?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isForgotPassword ? 'Відновити пароль' : isLogin ? 'Увійти' : 'Зареєструватися'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {isForgotPassword && (
              <button
                type="button"
                className="w-full mt-3 text-sm text-white/50 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
              >
                Повернутися до входу
              </button>
            )}
          </form>
        </div>

       
        <div className="mt-8 text-center text-white/30 text-xs space-y-2">
          <p>Для перевірки адмінки використовуйте:</p>
          <p className="font-mono bg-white/5 inline-block px-3 py-1.5 rounded-lg border border-white/5">admin@osbb.ua / admin123</p>
        </div>
      </div>
    </div>
  );
}
