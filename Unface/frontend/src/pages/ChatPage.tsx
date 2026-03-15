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
    } catch {
      setError('Ошибка отправки жалобы');
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
      <div className="min-h-screen bg-pastel-gray flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-8">
          <h1 className="text-2xl font-bold text-gray-800">One Face</h1>
          <p className="text-gray-600">Нажмите кнопку, чтобы найти собеседника</p>
          {error && <p className="text-red-600">{error}</p>}
          <button
            onClick={findChat}
            disabled={searching}
            className="px-8 py-4 bg-pastel-green text-gray-800 rounded-xl font-medium hover:bg-pastel-green/80 disabled:opacity-50"
          >
            {searching ? 'Поиск...' : 'Найти чат'}
          </button>
          <div className="flex gap-4 justify-center">
            <button onClick={handleLogout} className="text-gray-600 hover:text-gray-800">Выход</button>
            <Link to="/admin" className="text-gray-600 hover:text-gray-800">Admin</Link>
          </div>
        </div>
      </div>
    );
  }

  if (searching && !chat) {
    return (
      <div className="min-h-screen bg-pastel-gray flex flex-col items-center justify-center p-6">
        <p className="text-lg text-gray-600">
          {waiting ? 'Ожидание собеседника...' : 'Поиск собеседника...'}
        </p>
        <div className="mt-4 w-12 h-12 border-4 border-pastel-green border-t-transparent rounded-full animate-spin" />
        {waiting && (
          <button
            onClick={stopSearch}
            className="mt-6 px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
          >
            Отменить поиск
          </button>
        )}
      </div>
    );
  }

  if (!chat) return null;

  return (
    <div className="h-screen bg-pastel-gray flex flex-col">
      <header className="bg-white shadow-sm flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pastel-green flex items-center justify-center text-gray-700 font-bold">
            ?
          </div>
          <span className="font-medium text-gray-800">Анонимный собеседник</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-10">
              <button onClick={nextChat} className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >Следующий чат</button>
              <button onClick={() => { setReportModal(true); setMenuOpen(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
              >Пожаловаться</button>
              <button onClick={handleLogout} className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >Выход</button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                msg.userId === user?.id ? 'bg-pastel-pink text-gray-800' : 'bg-pastel-green text-gray-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Сообщение..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pastel-green focus:border-transparent"
        />
        <button
          onClick={sendMessage}
          className="px-6 py-2 bg-pastel-green text-gray-800 rounded-xl font-medium hover:bg-pastel-green/80"
        >
          Отправить
        </button>
      </div>

      {reportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Пожаловаться</h2>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Причина жалобы..."
              className="w-full px-4 py-2 border rounded-lg mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => { setReportModal(false); setReportReason(''); }} className="flex-1 py-2 border rounded-lg">Отмена</button>
              <button onClick={handleReport} className="flex-1 py-2 bg-red-500 text-white rounded-lg">Отправить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
