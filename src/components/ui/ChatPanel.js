"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { sendChatMessage, markConversationRead } from "@/lib/chat/chatService";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { Modal } from "@/components/ui/Modal";
import api from "@/lib/api";
import {
  X, Send, ImagePlus, ChevronLeft, Loader2, XCircle,
} from "lucide-react";

const ROLE_BADGE = {
  customer: "Customer",
  mechanic: "Mechanic",
  garage: "Garage",
};

export function ChatPanel({ jobId, otherUserName, otherUserRole, onClose }) {
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const fetchHistory = useChatStore((s) => s.fetchHistory);
  const messages = conversations[jobId] || [];

  const [inputValue, setInputValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const isOwn = (msg) => msg.senderId === user?.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchHistory(jobId);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [jobId, fetchHistory]);

  useEffect(() => { markConversationRead(jobId); }, [jobId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    sendChatMessage(jobId, trimmed, null);
    setInputValue("");
  }, [inputValue, jobId]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleImagePick = useCallback(async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Long timeout + retryable — photos on 4G through the funnel are slow
      // (same class as the Google-login fix).
      const res = await api.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
        __isRetryable: true,
      });
      const imageUrl = res.data?.url || res.data?.imageUrl;
      if (imageUrl) sendChatMessage(jobId, "", imageUrl);
    } catch {
      // Upload failed — user can retry
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [jobId]);

  const badgeColor =
    otherUserRole === "mechanic"
      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
      : otherUserRole === "garage"
        ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
        : "bg-icon-highlight/20 text-icon-highlight border-icon-highlight/30";

  return (
    <>
      <div
        className={cn(
          "glass-lux w-[380px] max-w-[calc(100vw-32px)]",
          "flex flex-col overflow-hidden",
          "animate-scale-in origin-bottom-right",
          "shadow-[var(--glass-lux-shadow)]",
          "max-h-[600px] sm:max-h-[540px]"
        )}
        role="dialog"
        aria-label={`Chat with ${otherUserName}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-lux-border)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onClose}
              className="glass-lux-interactive w-7 h-7 flex items-center justify-center rounded-lg active-press shrink-0"
              aria-label="Back"
            >
              <ChevronLeft size={16} className="text-on-surface-variant" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="type-title-3 text-on-surface truncate">
                  {otherUserName}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                    badgeColor
                  )}
                >
                  {ROLE_BADGE[otherUserRole] || otherUserRole}
                </span>
              </div>
              <p className="text-[11px] text-text-dim truncate">
                {jobId ? `Job #${jobId.slice(0, 8)}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="glass-lux-interactive w-7 h-7 flex items-center justify-center rounded-lg active-press shrink-0"
            aria-label="Close chat"
          >
            <X size={14} className="text-on-surface-variant" />
          </button>
        </div>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2.5 min-h-[200px] max-h-[400px]"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-text-dim" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-dim text-sm text-center py-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} isOwn={isOwn(msg)} />
            ))
          )}
        </div>

        <div className="flex items-end gap-2 px-4 py-3 border-t border-[var(--glass-lux-border)]">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl transition-all flex-shrink-0 active-press",
              uploading
                ? "bg-white/5 text-dim cursor-not-allowed"
                : "bg-white/5 text-on-surface-variant hover:bg-white/10"
            )}
            aria-label="Attach image"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ImagePlus size={18} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="input-glass flex-1 min-h-[44px] resize-none"
            aria-label="Chat message"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl transition-all flex-shrink-0 active-press",
              inputValue.trim()
                ? "bg-primary text-white shadow-[0_0_16px_rgba(var(--color-primary-rgb),0.25)] hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.35)]"
                : "bg-white/5 text-dim cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title=""
        maxWidth="max-w-3xl"
      >
        {previewImage && (
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Full size preview"
              className="max-w-full max-h-[70vh] rounded-lg object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                         bg-white/10 hover:bg-white/20 text-on-surface transition-colors"
            >
              <XCircle size={16} />
              Close
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}