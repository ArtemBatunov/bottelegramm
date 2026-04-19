import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

interface Profile {
  id: number;
  email: string;
  schoolId: number;
  phoneNumber: string | null;
  birthDate: string;
  chatStatus: string;
  school: { name: string };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/user/profile')
      .then((res) => setProfile(res.data))
      .catch(() => setError('Не удалось загрузить профиль'));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-watercolor flex items-center justify-center p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-watercolor flex items-center justify-center text-charcoal dark:text-gray-200">
        Загрузка…
      </div>
    );
  }

  const birth = new Date(profile.birthDate);
  const birthStr = birth.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-watercolor p-6">
      <div className="max-w-md mx-auto">
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 text-brand-coralDeep font-medium hover:underline mb-6"
        >
          ← Назад к чату
        </Link>
        <div className="bg-white/95 dark:bg-gray-900/95 rounded-[2rem] shadow-card-lg border border-white/60 dark:border-gray-700/80 p-8">
          <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100 mb-6">Аккаунт</h1>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 mb-0.5">Электронная почта</dt>
              <dd className="text-charcoal dark:text-gray-200 font-medium break-all">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 mb-0.5">Школа</dt>
              <dd className="text-charcoal dark:text-gray-200 font-medium">{profile.school?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 mb-0.5">Дата рождения</dt>
              <dd className="text-charcoal dark:text-gray-200 font-medium">{birthStr}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 mb-0.5">Телефон</dt>
              <dd className="text-charcoal dark:text-gray-200 font-medium">{profile.phoneNumber ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 mb-0.5">Статус в чате</dt>
              <dd className="text-charcoal dark:text-gray-200 font-medium">{profile.chatStatus}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
