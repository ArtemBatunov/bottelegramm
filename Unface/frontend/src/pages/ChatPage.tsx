import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Message {
  id: number;
  text: string;
  userId: number;
  createdAt: string;
}

interface ChatState {
  id: number;
  partnerId: number;
  messages: Message[];
}

export default function ChatPage() {
  const [chat, setChat] = useState<ChatState | null>(null);
  const [searching, setSearching] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextChatInProgress = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (!token) return;
    loadCurrentChat();
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const loadCurrentChat = async () => {
    try {
      const { data } = await api.get('/chat/current');
      if (data.chat) {
        setChat(data.chat);
        connectSocket(data.chat.id);
      } else {
        setChat(null);
      }
    } catch {
      setChat(null);
    }
  };

  const connectSocket = (chatId: number) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    const socket = io(API_URL, {
      auth: { token },
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join_chat', chatId);
    });
    socket.on('receive_message', (msg: Message) => {
      setChat((c) => (c ? { ...c, messages: [...c.messages, msg] } : null));
    });
    socket.on('disconnect_chat', () => {
      if (!nextChatInProgress.current) {
        setChat(null);
      }
      socket.disconnect();
      socketRef.current = null;
    });
  };

  const findChat = async () => {
    setSearching(true);
    setError('');
    try {
      const res = await api.post('/matchmaking/find-chat');
      const { data, status } = res;
      if (status === 202 && data.waiting) {
        setWaiting(true);
        pollForMatch();
        return;
      }
      setChat({
        id: data.chatId,
        partnerId: data.partnerId,
        messages: [],
      });
      connectSocket(data.chatId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Ошибка поиска';
      setError(msg);
    } finally {
      setSearching(false);
    }
  };

  const pollForMatch = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('/chat/current');
        if (data.chat) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setSearching(false);
          setWaiting(false);
          setChat(data.chat);
          connectSocket(data.chat.id);
        }
      } catch {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setSearching(false);
        setWaiting(false);
        setError('Ошибка подключения');
      }
    }, 2000);
  };

  const stopSearch = async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    try {
      await api.post('/matchmaking/stop-search');
    } catch {
      // ignore
    }
    setSearching(false);
    setWaiting(false);
  };

  const nextChat = async () => {
    setMenuOpen(false);
    nextChatInProgress.current = true;
    if (socketRef.current && chat) {
      socketRef.current.emit('next_chat', chat.id);
    }
    setChat(null);
    setSearching(true);
    setError('');
    try {
      const { data } = await api.post('/matchmaking/next-chat');
      setChat({
        id: data.chatId,
        partnerId: data.partnerId,
        messages: [],
      });
      connectSocket(data.chatId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Нет доступных пользователей';
      setError(msg);
      setChat(null);
    } finally {
      setSearching(false);
      nextChatInProgress.current = false;
    }
  };

  const handleReport = async () => {
    if (!chat) return;
    try {
      await api.post('/chat/report', { chatId: chat.id, reason: reportReason });
      setReportModal(false);
      setReportReason('');
      setMenuOpen(false);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setChat(null);
    } catch {
      setError('Не удалось отправить жалобу');
    }
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !chat || !socketRef.current) return;
    socketRef.current.emit('send_message', { chatId: chat.id, text });
    setInput('');
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    logout();
    navigate('/');
  };

  if (!chat && !searching) {
    return (
      <div className="min-h-screen bg-watercolor flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/95 dark:bg-gray-900/95 rounded-[2rem] shadow-card-lg p-10 text-center border border-white/60 dark:border-gray-700/80 space-y-6">
          <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">One Face</h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Нажмите кнопку ниже, чтобы найти собеседника из вашей школы.
          </p>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/40 rounded-xl py-2 px-3">{error}</p>
          )}
          <button
            onClick={findChat}
            disabled={searching}
            className="btn-pill-primary"
            style={{ background: 'linear-gradient(180deg, #8fd9a8 0%, #5cb87a 100%)' }}
          >
            {searching ? 'Поиск…' : 'Найти чат'}
          </button>
          <div className="flex gap-6 justify-center text-sm pt-2">
            <button type="button" onClick={handleLogout} className="text-gray-500 dark:text-gray-400 hover:text-charcoal dark:hover:text-gray-200 transition">
              Выход
            </button>
            <Link to="/admin" className="text-brand-coralDeep font-medium hover:underline">
              Админ-панель
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (searching && !chat) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-chat-bg flex flex-col items-center justify-center p-6 text-gray-700 dark:text-gray-300">
        <p className="text-lg font-medium">
          {waiting ? 'Ожидание собеседника…' : 'Поиск собеседника…'}
        </p>
        <div className="mt-6 w-12 h-12 border-4 border-brand-lime/70 dark:border-chat-incoming/80 border-t-transparent rounded-full animate-spin" />
        {waiting && (
          <button
            type="button"
            onClick={stopSearch}
            className="mt-8 px-6 py-2.5 rounded-full border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-charcoal dark:hover:text-white hover:border-gray-500 dark:hover:border-gray-500 transition"
          >
            Отменить поиск
          </button>
        )}
      </div>
    );
  }

  if (!chat) return null;

  return (
    <div className="h-screen bg-slate-100 dark:bg-chat-bg flex">
      <aside className="w-16 sm:w-20 shrink-0 bg-white dark:bg-chat-sidebar flex flex-col items-center py-6 gap-8 border-r border-slate-200 dark:border-white/5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-11 h-11 rounded-full bg-slate-100 dark:bg-chat-panel flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-charcoal dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition"
            aria-expanded={menuOpen}
            aria-label="Меню"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute left-full top-0 ml-2 w-52 bg-white dark:bg-chat-panel rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 py-2 z-20">
              <button
                type="button"
                onClick={() => {
                  nextChat();
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Следующий чат
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportModal(true);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Пожаловаться
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Выход
              </button>
            </div>
          )}
        </div>
        <Link
          to="/account"
          className="w-11 h-11 rounded-full bg-slate-100 dark:bg-chat-panel flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-charcoal dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition"
          title="Аккаунт"
          aria-label="Аккаунт"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 bg-white/95 dark:bg-chat-panel/80 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-200/90 dark:bg-chat-incoming/30 flex items-center justify-center text-emerald-800 dark:text-chat-incoming font-bold text-lg shrink-0">
              ?
            </div>
            <span className="font-medium text-charcoal dark:text-gray-100 truncate">Анонимный собеседник</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 dark:bg-chat-bg">
          {chat.messages.map((msg) => {
            const mine = msg.userId === user?.id;
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-charcoal text-[15px] leading-snug shadow-sm ${
                    mine
                      ? 'bg-chat-outgoing rounded-br-md'
                      : 'bg-chat-incoming rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 p-4 bg-white/95 dark:bg-chat-panel/50 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2 max-w-4xl mx-auto bg-white dark:bg-chat-panel rounded-full pl-5 pr-1.5 py-1.5 shadow-inner ring-1 ring-slate-200/80 dark:ring-white/10">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Сообщение…"
              className="flex-1 min-w-0 bg-transparent text-charcoal dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none text-[15px] py-2"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="shrink-0 w-11 h-11 rounded-[0.65rem] bg-chat-sendSurface flex items-center justify-center text-chat-sendIcon shadow-md hover:brightness-110 active:scale-[0.97] transition outline-none focus-visible:ring-2 focus-visible:ring-chat-sendIcon/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-chat-panel"
              aria-label="Отправить"
            >
              <svg className="w-[22px] h-[22px] translate-x-px" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {reportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 p-4">
          <div className="bg-white dark:bg-chat-panel rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-white/10 shadow-2xl">
            <h2 className="text-lg font-semibold text-charcoal dark:text-white mb-3">Пожаловаться</h2>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Опишите причину…"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-chat-bg border border-slate-200 dark:border-white/10 rounded-xl text-charcoal dark:text-gray-200 placeholder:text-gray-500 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-coralDeep/40"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setReportModal(false);
                  setReportReason('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleReport}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-500"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
