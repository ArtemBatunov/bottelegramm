import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    birthDate: '',
    phoneNumber: '',
    policyAgreed: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.policyAgreed) {
      setError('Необходимо согласие с политикой конфиденциальности');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/chat');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Ошибка регистрации';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-watercolor flex items-center justify-center p-6 py-10">
      <div className="w-full max-w-md bg-white/95 dark:bg-gray-900/95 rounded-[2rem] shadow-card-lg p-8 border border-white/60 dark:border-gray-700/80">
        <div className="flex justify-center mb-6">
          <BrandLogo />
        </div>
        <h2 className="text-xl font-semibold text-center text-charcoal dark:text-gray-100 mb-6">Регистрация</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Электронная почта</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input-pill py-2.5"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Пароль</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="input-pill py-2.5"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Подтверждение пароля</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="input-pill py-2.5"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Школа</label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
              className="input-pill py-2.5"
              required
              placeholder="Например: Школа №1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Дата рождения</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
              className="input-pill py-2.5"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">Телефон (необязательно)</label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              className="input-pill py-2.5"
            />
          </div>
          <label className="flex items-start gap-3 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={form.policyAgreed}
              onChange={(e) => setForm((f) => ({ ...f, policyAgreed: e.target.checked }))}
              className="mt-1 rounded border-gray-300 text-brand-coralDeep focus:ring-brand-coral"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
              Подтверждаю согласие с политикой конфиденциальности
            </span>
          </label>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-950/40 rounded-xl py-2 px-3">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-pill-primary mt-2">
            {loading ? 'Регистрация…' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-brand-coralDeep font-semibold hover:underline">
            Вход
          </Link>
        </p>
      </div>
    </div>
  );
}
