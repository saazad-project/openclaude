'use client'

import { create } from 'zustand'

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  result?: unknown
  status: 'pending' | 'success' | 'error'
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  createdAt: Date
}

interface MessageStore {
  messages: Message[]
  isLoading: boolean
  error: string | null
  
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => string
  updateMessage: (id: string, updates: Partial<Message>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  
  addMessage: (message) => {
    const id = Math.random().toString(36).substring(2, 15)
    set(state => ({
      messages: [...state.messages, {
        ...message,
        id,
        createdAt: new Date(),
      }],
    }))
    return id
  },
  
  updateMessage: (id, updates) => {
    set(state => ({
      messages: state.messages.map(m => 
        m.id === id ? { ...m, ...updates } : m
      ),
    }))
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading })
  },
  
  setError: (error) => {
    set({ error })
  },
  
  clearMessages: () => {
    set({ messages: [], error: null })
  },
}))
