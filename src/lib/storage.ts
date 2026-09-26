export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  contentBn?: string;
  contentEn?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "studyzone_chats";

export function getChats(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChats(chats: ChatSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function createChat(model: string): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [],
    model,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function updateChat(chats: ChatSession[], updated: ChatSession): ChatSession[] {
  const idx = chats.findIndex((c) => c.id === updated.id);
  if (idx === -1) return [updated, ...chats];
  const copy = [...chats];
  copy[idx] = updated;
  return copy;
}

export function deleteChat(chats: ChatSession[], id: string): ChatSession[] {
  return chats.filter((c) => c.id !== id);
}

export function clearAllChats(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function titleFromMessage(text: string): string {
  return text.slice(0, 48).trim() || "New Chat";
}
