import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/chat');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Ошибка входа';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-watercolor flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/95 dark:bg-gray-900/95 rounded-[2rem] shadow-card-lg p-8 border border-white/60 dark:border-gray-700/80">
        <div className="flex justify-center mb-8">
          <BrandLogo />
        </div>
        <h2 className="text-xl font-semibold text-center text-charcoal dark:text-gray-100 mb-6">Вход</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Электронная почта</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-pill"
              placeholder="you@school.ru"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-pill"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-950/40 rounded-xl py-2 px-3">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-pill-primary mt-2">
            {loading ? 'Вход…' : 'Вход'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-brand-coralDeep font-semibold hover:underline">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
