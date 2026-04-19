import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export default function HomePage() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-watercolor flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/95 dark:bg-gray-900/95 rounded-[2rem] shadow-card-lg overflow-hidden border border-white/60 dark:border-gray-700/80">
        <div className="px-8 pt-10 pb-8 text-center space-y-8">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          {token ? (
            <Link
              to="/chat"
              className="block w-full py-3.5 rounded-full font-semibold uppercase tracking-wide text-center text-white shadow-md transition hover:brightness-105"
              style={{ background: 'linear-gradient(180deg, #8fd9a8 0%, #5cb87a 100%)' }}
            >
              Перейти в чат
            </Link>
          ) : (
            <div className="flex flex-col gap-4">
              <Link to="/login" className="btn-pill-secondary">
                Вход
              </Link>
              <Link to="/register" className="btn-pill-primary">
                Регистрация
              </Link>
            </div>
          )}
        </div>
        <div className="bg-pastel-green/90 dark:bg-emerald-950/50 px-8 py-6 text-center border-t border-white/40 dark:border-gray-700/60">
          <p className="text-sm sm:text-base text-charcoal/90 dark:text-gray-200 leading-relaxed font-medium">
            <span className="font-semibold">One Face</span>
            {' — '}
            новое пространство для искреннего общения. Сервис случайно соединяет учеников одного учебного
            заведения: кто ваш собеседник, вы узнаете только в диалоге. Здесь нет профилей — только живое
            общение.
          </p>
        </div>
      </div>
    </div>
  );
}
