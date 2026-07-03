"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, ImageIcon } from "lucide-react";

// CheckDouble is CheckCheck in lucide-react
const CheckDouble = CheckCheck;

/**
 * ChatBubble — renders a single chat message with text, optional image
 * thumbnail, timestamp, and read receipt.
 *
 * Props:
 *   message  — { id, text, imageUrl?, createdAt, senderRole }
 *   isOwn    — boolean (whether this message was sent by the current user)
 */
export function ChatBubble({ message, isOwn }) {
  const [imgError, setImgError] = useState(false);

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={cn(
        "flex flex-col max-w-[80%] animate-fade-in-up",
        isOwn ? "items-end self-end" : "items-start self-start"
      )}
    >
      {/* Bubble */}
      <div
        className={cn(
          "px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words space-y-1.5",
          isOwn
            ? "bg-primary/20 text-primary-light border border-primary/20 rounded-br-md"
            : "bg-white/5 text-on-surface border border-[var(--glass-lux-border)] rounded-bl-md"
        )}
      >
        {/* Text content */}
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}

        {/* Image thumbnail */}
        {message.imageUrl && !imgError && (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.imageUrl}
              alt="Shared image"
              className="max-w-full rounded-lg object-cover max-h-48 cursor-pointer
                         transition-transform hover:scale-[1.02] active:scale-[0.98]"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
          </div>
        )}

        {/* Fallback for broken image */}
        {message.imageUrl && imgError && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <ImageIcon size={14} />
            <span>Image unavailable</span>
          </div>
        )}
      </div>

      {/* Meta row: timestamp + read receipt */}
      <div
        className={cn(
          "flex items-center gap-1 mt-0.5 px-1",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        <span className="text-[10px] text-text-dim">{time}</span>
        {isOwn && (
          <span className="text-[10px] text-text-dim">
            {message.readAt ? (
              <CheckDouble size={12} className="text-primary-light" />
            ) : (
              <Check size={12} className="text-text-dim" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}