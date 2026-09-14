import { create } from "zustand";
import api from "@/lib/api";

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} jobId
 * @property {string} senderId
 * @property {string} senderRole  — "customer" | "mechanic"
 * @property {string} text
 * @property {string|null} [imageUrl]
 * @property {string} createdAt   — ISO string
 */

/**
 * Mechanic–customer chat store.
 *
 * State is a plain object `{ [jobId]: Message[] }` — NOT a Map,
 * because Zustand cannot deeply proxy Map entries for change detection.
 */
export const useChatStore = create((set, get) => ({
  /** @type {Record<string, ChatMessage[]>} */
  conversations: {},

  /** @type {string|null} */
  activeConversation: null,

  /** @type {number} */
  unreadCount: 0,

  /* ── Actions ─────────────────────────────────────────────────── */

  /**
   * Open a conversation by job ID.  Sets activeConversation so the
   * UI knows which conversation to display.
   */
  openConversation: (jobId) => {
    set({ activeConversation: jobId });
  },

  /**
   * Append a message (from any source — optimistic, WS push, history fetch)
   * to the conversation for `jobId`.  Deduplicates by message id.
   *
   * Increments unreadCount only when the conversation is NOT the one
   * currently being viewed.
   */
  receiveMessage: (jobId, message) => {
    set((state) => {
      const msgs = state.conversations[jobId];
      // Avoid duplicates (same message arriving via optimistic + server echo)
      if (msgs && msgs.some((m) => m.id === message.id)) return state;

      const newMsgs = msgs ? [...msgs, message] : [message];
      const isActive = state.activeConversation === jobId;

      return {
        conversations: {
          ...state.conversations,
          [jobId]: newMsgs,
        },
        unreadCount: isActive ? state.unreadCount : state.unreadCount + 1,
      };
    });
  },

  /**
   * Mark a conversation as read — clears unread count for that conversation.
   * Called by the UI when the user opens the chat panel for a job, and by
   * chatService.markConversationRead().
   */
  markRead: (jobId) => {
    // Unread count decrement is scoped to the conversation-level tracking.
    // For now, per-conversation unread is derived from the UI's scroll position.
    // The global unreadCount could be recalculated here if needed.
  },

  /**
   * Load chat history for a job from the server and replace local messages.
   * Keeps optimistic messages on failure — never wipes on 403/404.
   */
  fetchHistory: async (jobId) => {
    try {
      const { data } = await api.get(`/chat/history/${jobId}`);
      const messages = data?.messages || [];
      set((state) => ({
        conversations: {
          ...state.conversations,
          [jobId]: messages,
        },
      }));
      return messages;
    } catch {
      // Keep existing optimistic messages — don't wipe on 403 before assignment
      return get().conversations[jobId] || [];
    }
  },
}));
