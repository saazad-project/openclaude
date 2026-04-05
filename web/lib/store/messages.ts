/**
 * Message Store for AI Chat
 */

import { create } from "zustand";
import type { Message } from "ai";
import { nanoid } from "nanoid";

// ============================================================
// TYPES
// ============================================================

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "success" | "error";
}

export interface MessageStore {
  // State
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  pendingToolCalls: ToolCall[];

  // Actions
  addMessage: (message: Omit<Message, "id">) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Tool call tracking
  addToolCall: (toolCall: Omit<ToolCall, "status">) => void;
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void;
  clearToolCalls: () => void;
}

// ============================================================
// STORE
// ============================================================

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  pendingToolCalls: [],

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, { ...message, id: nanoid() }],
    }));
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  },

  clearMessages: () => {
    set({ messages: [], pendingToolCalls: [] });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  addToolCall: (toolCall) => {
    set((state) => ({
      pendingToolCalls: [
        ...state.pendingToolCalls,
        { ...toolCall, status: "pending" },
      ],
    }));
  },

  updateToolCall: (id, updates) => {
    set((state) => ({
      pendingToolCalls: state.pendingToolCalls.map((tc) =>
        tc.id === id ? { ...tc, ...updates } : tc
      ),
    }));
  },

  clearToolCalls: () => {
    set({ pendingToolCalls: [] });
  },
}));
