import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

/**
 * Send a chat message over WebSocket with optimistic local update.
 * The message is added to the chat store immediately, then sent over WS.
 *
 * @param {string} jobId
 * @param {string} text
 * @param {string|null} [imageUrl] — Pre-uploaded image URL (never send raw images over WS)
 */
export function sendChatMessage(jobId, text, imageUrl) {
  const auth = useAuthStore.getState();
  const message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    jobId,
    senderId: auth.user?.id || "unknown",
    senderRole: auth.user?.role || "customer",
    text,
    imageUrl: imageUrl || null,
    createdAt: new Date().toISOString(),
  };

  // Optimistic local update
  import("../store/chatStore")
    .then(({ useChatStore }) => {
      useChatStore.getState().receiveMessage(jobId, message);
    })
    .catch(() => {});

  // Send over WebSocket (lazy import to avoid circular dependency with socket.js)
  import("../socket")
    .then(({ sendWSMessage }) => {
      sendWSMessage({ type: "CHAT_MESSAGE", payload: message });
    })
    .catch(() => {});
}

/**
 * Mark a conversation as read — sends CHAT_READ over WebSocket.
 * @param {string} jobId
 */
export function markConversationRead(jobId) {
  // Local state update
  import("../store/chatStore")
    .then(({ useChatStore }) => {
      useChatStore.getState().markRead(jobId);
    })
    .catch(() => {});

  // Notify server
  import("../socket")
    .then(({ sendWSMessage }) => {
      sendWSMessage({ type: "CHAT_READ", payload: { jobId } });
    })
    .catch(() => {});
}

/**
 * Fetch chat history for a job from the server.
 * @param {string} jobId
 * @returns {Promise<Array>}
 */
export async function fetchChatHistory(jobId) {
  try {
    const { data } = await api.get(`/chat/history/${jobId}`);
    return data?.messages || [];
  } catch {
    return [];
  }
}
