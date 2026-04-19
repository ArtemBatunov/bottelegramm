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
  reportStatus: string | null;
  createdAt: string;
  _count: { messages: number };
}

interface Report {
  id: number;
  chatId: number;
  reason: string;
  createdAt: string;
  fromUser: { id: number; email: string };
  chat: { user1: { id: number; email: string }; user2: { id: number; email: string } };
}

interface AdminChatDetail {
  id: number;
  status: string;
  reportStatus: string | null;
  createdAt: string;
  user1: { id: number; email: string };
  user2: { id: number; email: string };
  messages: Array<{
    id: number;
    text: string;
    userId: number;
    createdAt: string;
    user: { id: number; email: string };
  }>;
}

function getReportPartner(r: Report): { id: number; email: string } {
  return r.chat.user1.id === r.fromUser.id ? r.chat.user2 : r.chat.user1;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'users' | 'chats' | 'reports'>('users');
  const [error, setError] = useState('');
  const [viewingChatId, setViewingChatId] = useState<number | null>(null);
  const [chatDetail, setChatDetail] = useState<AdminChatDetail | null>(null);
  const [chatDetailLoading, setChatDetailLoading] = useState(false);
  const [chatDetailError, setChatDetailError] = useState('');

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
      setError('');
    } catch {
      setError('Доступ запрещён');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const banUser = async (userId: number, confirmMessage?: string) => {
    if (!confirm(confirmMessage ?? 'Заблокировать пользователя?')) return;
    try {
      await api.post('/admin/ban-user', { userId });
      load();
    } catch {
      setError('Не удалось выполнить действие');
    }
  };

  const unbanUser = async (userId: number) => {
    if (!confirm('Разблокировать пользователя?')) return;
    try {
      await api.post('/admin/unban-user', { userId });
      load();
    } catch {
      setError('Не удалось выполнить действие');
    }
  };

  const openChatView = async (chatId: number) => {
    setViewingChatId(chatId);
    setChatDetail(null);
    setChatDetailError('');
    setChatDetailLoading(true);
    try {
      const { data } = await api.get<{ chat: AdminChatDetail }>(`/admin/chats/${chatId}`);
      setChatDetail(data.chat);
    } catch {
      setChatDetailError('Не удалось загрузить переписку');
    } finally {
      setChatDetailLoading(false);
    }
  };

  const closeChatView = () => {
    setViewingChatId(null);
    setChatDetail(null);
    setChatDetailError('');
    setChatDetailLoading(false);
  };

  if (error && error === 'Доступ запрещён') {
    return (
      <div className="min-h-screen bg-watercolor flex items-center justify-center p-6">
        <p className="text-red-600 dark:text-red-400 text-lg bg-white/90 dark:bg-gray-900/90 px-8 py-4 rounded-2xl shadow-card border border-transparent dark:border-gray-700">
          {error}
        </p>
      </div>
    );
  }

  const tabBtn = (active: boolean) =>
    `px-5 py-2.5 rounded-full text-sm font-medium transition ${
      active
        ? 'bg-charcoal dark:bg-gray-100 text-white dark:text-charcoal shadow-md'
        : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-600'
    }`;

  return (
    <div className="min-h-screen bg-watercolor p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100 mb-2">Панель администратора</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Пользователи, чаты и жалобы</p>
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-white/90 dark:bg-gray-900/80 px-4 py-2 rounded-xl border border-red-200/60 dark:border-red-900/50">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mb-6">
          <button type="button" onClick={() => setTab('users')} className={tabBtn(tab === 'users')}>
            Пользователи
          </button>
          <button type="button" onClick={() => setTab('chats')} className={tabBtn(tab === 'chats')}>
            Чаты
          </button>
          <button type="button" onClick={() => setTab('reports')} className={tabBtn(tab === 'reports')}>
            Жалобы
          </button>
        </div>

        {tab === 'users' && (
          <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-card border border-white/60 dark:border-gray-700/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-pastel-green/40 dark:bg-gray-800/80 text-charcoal/80 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Школа</th>
                  <th className="px-4 py-3 text-left font-semibold">Статус</th>
                  <th className="px-4 py-3 text-left font-semibold">Бан</th>
                  <th className="px-4 py-3 text-left font-semibold">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/80 dark:text-gray-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.school?.name}</td>
                    <td className="px-4 py-3">{u.chatStatus}</td>
                    <td className="px-4 py-3">{u.banStatus ? 'Да' : 'Нет'}</td>
                    <td className="px-4 py-3 space-x-3">
                      {!u.banStatus ? (
                        <button
                          type="button"
                          onClick={() => banUser(u.id)}
                          className="text-rose-600 font-medium hover:underline"
                        >
                          Заблокировать
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => unbanUser(u.id)}
                          className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                        >
                          Разблокировать
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'chats' && (
          <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-card border border-white/60 dark:border-gray-700/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-pastel-green/40 dark:bg-gray-800/80 text-charcoal/80 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Участники</th>
                  <th className="px-4 py-3 text-left font-semibold">Сообщений</th>
                  <th className="px-4 py-3 text-left font-semibold">Статус</th>
                  <th className="px-4 py-3 text-left font-semibold">Дата</th>
                  <th className="px-4 py-3 text-left font-semibold">Переписка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/80 dark:text-gray-300">
                {chats.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">{c.id}</td>
                    <td className="px-4 py-3 break-all">
                      {c.user1.email} / {c.user2.email}
                    </td>
                    <td className="px-4 py-3">{c._count.messages}</td>
                    <td className="px-4 py-3">{c.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(c.createdAt).toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openChatView(c.id)}
                        className="text-brand-coralDeep font-medium hover:underline"
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reports' && (
          <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-card border border-white/60 dark:border-gray-700/80 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-pastel-green/40 dark:bg-gray-800/80 text-charcoal/80 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">От</th>
                  <th className="px-4 py-3 text-left font-semibold">Чат</th>
                  <th className="px-4 py-3 text-left font-semibold">Причина</th>
                  <th className="px-4 py-3 text-left font-semibold">Дата</th>
                  <th className="px-4 py-3 text-left font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/80 dark:text-gray-300">
                {reports.map((r) => {
                  const partner = getReportPartner(r);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">{r.id}</td>
                      <td className="px-4 py-3">{r.fromUser.email}</td>
                      <td className="px-4 py-3 break-all">
                        {r.chat.user1.email} / {r.chat.user2.email}
                      </td>
                      <td className="px-4 py-3">{r.reason}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-2 min-w-[10rem]">
                          <button
                            type="button"
                            onClick={() =>
                              banUser(
                                partner.id,
                                `Заблокировать собеседника (${partner.email}) по этой жалобе?`
                              )
                            }
                            className="text-left text-rose-600 font-medium hover:underline"
                          >
                            Заблокировать собеседника
                          </button>
                          <button
                            type="button"
                            onClick={() => openChatView(r.chatId)}
                            className="text-left text-brand-coralDeep font-medium hover:underline"
                          >
                            Открыть чат
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Link
          to="/chat"
          className="inline-block mt-8 text-brand-coralDeep font-medium hover:underline"
        >
          ← Назад к чату
        </Link>
      </div>

      {viewingChatId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-chat-title"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-700 max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/80">
              <h2 id="admin-chat-title" className="text-lg font-semibold text-charcoal dark:text-gray-100">
                Чат #{viewingChatId}
              </h2>
              <button
                type="button"
                onClick={closeChatView}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-charcoal dark:hover:text-white"
              >
                Закрыть
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {chatDetailLoading && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">Загрузка…</p>
              )}
              {chatDetailError && (
                <p className="text-red-600 dark:text-red-400 text-sm">{chatDetailError}</p>
              )}
              {!chatDetailLoading && chatDetail && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    <span className="font-medium text-charcoal/80 dark:text-gray-300">{chatDetail.user1.email}</span>
                    {' ↔ '}
                    <span className="font-medium text-charcoal/80 dark:text-gray-300">{chatDetail.user2.email}</span>
                    <span className="block mt-1">
                      Статус: {chatDetail.status}
                      {chatDetail.reportStatus ? ` · Жалоба: ${chatDetail.reportStatus}` : ''}
                    </span>
                  </p>
                  <ul className="space-y-2">
                    {chatDetail.messages.length === 0 && (
                      <li className="text-sm text-gray-500 dark:text-gray-400">Сообщений нет</li>
                    )}
                    {chatDetail.messages.map((m) => (
                      <li
                        key={m.id}
                        className="text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 px-3 py-2 border border-gray-100/80 dark:border-gray-700/60"
                      >
                        <span className="text-xs font-medium text-brand-coralDeep dark:text-amber-300/90">
                          {m.user.email}
                        </span>
                        <p className="text-charcoal dark:text-gray-200 mt-0.5 whitespace-pre-wrap break-words">
                          {m.text}
                        </p>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {new Date(m.createdAt).toLocaleString('ru-RU')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
