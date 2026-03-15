import { api } from './client';

export interface Message {
  id: number;
  text: string;
  userId: number;
  createdAt: string;
}

export interface ChatData {
  id: number;
  partnerId: number;
  messages: Message[];
  createdAt: string;
}

export const chatApi = {
  getCurrent: () => api.get<{ chat: ChatData | null }>('/api/chat/current'),
  getHistory: () => api.get<{ chats: unknown[] }>('/api/chat/history'),
  report: (chatId: number, reason: string) =>
    api.post('/api/chat/report', { chatId, reason }),
};
