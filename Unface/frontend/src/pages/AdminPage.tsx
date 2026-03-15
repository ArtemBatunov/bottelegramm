import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

interface User {
  id: number;
  email: string;
  schoolId: number;
  school: { name: string };
  birthDate: string;
  chatStatus: string;
  banStatus: boolean;
  createdAt: string;
}

interface Chat {
  id: number;
  user1: { id: number; email: string };
  user2: { id: number; email: string };
  status: string;
  createdAt: string;
  _count: { messages: number };
}

interface Report {
  id: number;
  chatId: number;
  reason: string;
  createdAt: string;
  fromUser: { id: number; email: string };
  chat: { user1: { email: string }; user2: { email: string } };
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'users' | 'chats' | 'reports'>('users');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [u, c, r] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/chats'),
        api.get('/admin/reports'),
      ]);
      setUsers(u.data.users);
      setChats(c.data.chats);
      setReports(r.data.reports);
    } catch { setError('Доступ запрещён'); }
  };

  useEffect(() => { load(); }, []);

  const banUser = async (userId: number) => {
    if (!confirm('Заблокировать пользователя?')) return;
    try {
      await api.post('/admin/ban-user', { userId });
      load();
    } catch { setError('Ошибка'); }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-pastel-gray flex items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pastel-gray p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Панель администратора</h1>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 rounded-lg ${tab === 'users' ? 'bg-gray-700 text-white' : 'bg-white'}`}
          >Пользователи</button>
          <button
            onClick={() => setTab('chats')}
            className={`px-4 py-2 rounded-lg ${tab === 'chats' ? 'bg-gray-700 text-white' : 'bg-white'}`}
          >Чаты</button>
          <button
            onClick={() => setTab('reports')}
            className={`px-4 py-2 rounded-lg ${tab === 'reports' ? 'bg-gray-700 text-white' : 'bg-white'}`}
          >Жалобы</button>
        </div>

        {tab === 'users' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Школа</th>
                  <th className="px-4 py-2 text-left">Статус</th>
                  <th className="px-4 py-2 text-left">Бан</th>
                  <th className="px-4 py-2 text-left">Действие</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">{u.id}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.school?.name}</td>
                    <td className="px-4 py-2">{u.chatStatus}</td>
                    <td className="px-4 py-2">{u.banStatus ? 'Да' : 'Нет'}</td>
                    <td className="px-4 py-2">
                      {!u.banStatus && (
                        <button onClick={() => banUser(u.id)} className="text-red-600 hover:underline">Бан</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'chats' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Участники</th>
                  <th className="px-4 py-2 text-left">Сообщений</th>
                  <th className="px-4 py-2 text-left">Статус</th>
                  <th className="px-4 py-2 text-left">Дата</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2">{c.id}</td>
                    <td className="px-4 py-2">{c.user1.email} / {c.user2.email}</td>
                    <td className="px-4 py-2">{c._count.messages}</td>
                    <td className="px-4 py-2">{c.status}</td>
                    <td className="px-4 py-2">{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reports' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">От</th>
                  <th className="px-4 py-2 text-left">Чат</th>
                  <th className="px-4 py-2 text-left">Причина</th>
                  <th className="px-4 py-2 text-left">Дата</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2">{r.id}</td>
                    <td className="px-4 py-2">{r.fromUser.email}</td>
                    <td className="px-4 py-2">{r.chat.user1.email} / {r.chat.user2.email}</td>
                    <td className="px-4 py-2">{r.reason}</td>
                    <td className="px-4 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link to="/chat" className="inline-block mt-6 text-gray-600 hover:text-gray-800">← Назад к чату</Link>
      </div>
    </div>
  );
}
