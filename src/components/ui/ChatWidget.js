"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { DEMO_MODE } from "@/lib/demo/demoFlag";
import { useServiceStore } from "@/store/serviceStore";
import { useNotificationStore } from "@/store/notificationStore";
import { getConnectionState } from "@/lib/socket";

/* ------------------------------------------------------------------ */
/*  Demo-mode mock messages                                          */
/* ------------------------------------------------------------------ */

const DEMO_MESSAGES = [
  { id: "demo-1", role: "system", text: "🛠️ Welcome to ClutchD Live Assist" },
  { id: "demo-2", role: "system", text: "🔍 Searching for nearby mechanics..." },
  { id: "demo-3", role: "system", text: "👨‍🔧 Mechanic Rajesh M. has been assigned" },
  { id: "demo-4", role: "system", text: "🚗 Rajesh is en route to your location" },
  { id: "demo-5", role: "system", text: "🔧 Service is in progress" },
  { id: "demo-6", role: "me", text: "How long will the repair take?" },
  { id: "demo-7", role: "them", text: "Around 30 minutes, sir. Almost done!" },
  { id: "demo-8", role: "system", text: "💰 Payment pending — ₹850" },
  { id: "demo-9", role: "system", text: "✅ Service completed! Thank you." },
];

const STATUS_MESSAGE_MAP = {
  searching: "🔍 Searching for nearby mechanics...",
  assigned: (m) =>
    `👨‍🔧 Mechanic ${m?.name || "assigned"} has been assigned`,
  en_route: "🚗 Mechanic is en route to your location",
  in_progress: "🔧 Service is in progress",
  payment_pending: (p) =>
    p?.totalAmount
      ? `💰 Payment pending — ₹${p.totalAmount.toLocaleString("en-IN")}`
      : "💰 Payment pending",
  completed: "✅ Service completed! Thank you.",
};

let msgCounter = 0;
const nextId = () => `chat-${++msgCounter}-${Date.now()}`;

/* ------------------------------------------------------------------ */
/*  ChatWidget                                                        */
/* ------------------------------------------------------------------ */

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  /* ── WebSocket connection polling ──────────────────────────────── */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setWsConnected(getConnectionState() === "connected");
    });
    const id = setInterval(() => {
      setWsConnected(getConnectionState() === "connected");
    }, 3000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  /* ── Seed demo / welcome message ───────────────────────────────── */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMessages(
        DEMO_MODE
          ? DEMO_MESSAGES
          : [
              {
                id: nextId(),
                role: "system",
                text: wsConnected
                  ? "🛠️ Live Assist connected"
                  : "🛠️ Live Assist — reconnecting...",
              },
            ]
      );
    });
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Subscribe to STATUS_UPDATE via serviceStore ───────────────── */
  useEffect(() => {
    const unsub = useServiceStore.subscribe((state, prev) => {
      const req = state.activeRequest;
      const prevReq = prev.activeRequest;
      if (!req || req === prevReq) return;

      const status = req.status;
      const builder = STATUS_MESSAGE_MAP[status];
      if (!builder) return;

      const text = typeof builder === "function" ? builder(req.mechanic || req.pricing) : builder;

      setMessages((prevMsgs) => [
        ...prevMsgs,
        { id: nextId(), role: "system", text },
      ]);
    });

    return unsub;
  }, []);

  /* ── Subscribe to NOTIFICATION_UPDATE via notificationStore ────── */
  useEffect(() => {
    const unsub = useNotificationStore.subscribe((state, prev) => {
      if (state.unreadCount <= prev.unreadCount) return;
      setMessages((prevMsgs) => [
        ...prevMsgs,
        {
          id: nextId(),
          role: "system",
          text: `🔔 ${state.unreadCount} unread notification${
            state.unreadCount !== 1 ? "s" : ""
          }`,
        },
      ]);
    });

    return unsub;
  }, []);

  /* ── Auto-scroll on new messages ───────────────────────────────── */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  /* ── Focus input when panel opens ──────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      // small RAF delay so the panel finishes rendering
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "me", text: trimmed },
    ]);
    setInputValue("");

    // Echo a mock reply in demo mode
    if (DEMO_MODE) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "them",
            text: "We're on it! Our team will update you shortly.",
          },
        ]);
      }, 1200);
    }
  }, [inputValue]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className="fixed bottom-6 right-6 z-[900] flex flex-col items-end gap-3">
      {/* ── Chat Panel ──────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={cn(
            "glass-lux w-[360px] max-w-[calc(100vw-48px)]",
            "flex flex-col overflow-hidden",
            "animate-scale-in origin-bottom-right",
            "shadow-[var(--glass-lux-shadow)]",
            "max-h-[600px] sm:max-h-[540px]"
          )}
          role="dialog"
          aria-label="Live chat"
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-lux-border)]">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  wsConnected ? "bg-primary-light" : "bg-amber-400",
                  wsConnected ? "" : "animate-pulse"
                )}
              />
              <span className="type-title-3 text-on-surface">
                Live Assist
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="glass-lux-interactive w-7 h-7 flex items-center justify-center rounded-lg active-press"
              aria-label="Close chat"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-on-surface-variant"
              >
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </button>
          </div>

          {/* ── Messages ────────────────────────────────────────── */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2.5 min-h-[200px] max-h-[400px]"
          >
            {messages.length === 0 && (
              <p className="text-dim text-sm text-center py-8">
                No messages yet
              </p>
            )}

            {messages.map((msg) => {
              const isMe = msg.role === "me";
              const isThem = msg.role === "them";
              const isSystem = msg.role === "system";

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "animate-fade-in-up",
                    isSystem && "flex justify-center",
                    isMe && "flex justify-end",
                    isThem && "flex justify-start"
                  )}
                >
                  {isSystem ? (
                    <span className="inline-block px-3 py-1.5 rounded-full text-xs text-dim bg-white/5 border border-[var(--glass-lux-border)] leading-tight text-center max-w-[85%]">
                      {msg.text}
                    </span>
                  ) : (
                    <div
                      className={cn(
                        "max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words",
                        isMe &&
                          "bg-primary/20 text-primary-light border border-primary/20",
                        isThem &&
                          "bg-white/5 text-on-surface border border-[var(--glass-lux-border)]"
                      )}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Input ───────────────────────────────────────────── */}
          <div className="flex items-end gap-2 px-4 py-3 border-t border-[var(--glass-lux-border)]">
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
                "w-11 h-11 flex items-center justify-center rounded-xl transition-all flex-shrink-0",
                "active-press",
                inputValue.trim()
                  ? "bg-primary text-white shadow-[0_0_16px_rgba(var(--color-primary-rgb),0.25)] hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.35)]"
                  : "bg-white/5 text-dim cursor-not-allowed"
              )}
              aria-label="Send message"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 9l13-7-7 13-2-4-4-2z" />
                <path d="M8 11l3-3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Bubble Button ──────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all active-press",
          "shadow-[0_8px_32px_rgba(var(--color-primary-rgb),0.3)]",
          isOpen
            ? "bg-red-500/20 border border-red-400/30 text-red-400 rotate-45"
            : "bg-primary text-white hover:shadow-[0_12px_40px_rgba(var(--color-primary-rgb),0.4)] hover-lift"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l10 10M16 6l-10 10" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 11a8 8 0 01-10.5 7.5L4 20l1.5-4.5A8 8 0 1119 11z" />
          </svg>
        )}
      </button>

      {/* ── Connection status dot on bubble ─────────────────────── */}
      {!isOpen && (
        <span
          className={cn(
            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--background)]",
            wsConnected ? "bg-primary-light" : "bg-amber-400",
            wsConnected ? "" : "animate-pulse"
          )}
          style={{ bottom: "-2px", right: "-2px" }}
        />
      )}
    </div>
  );
}
