"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

const DISMISSED_KEY = "clutchd_push_banner_dismissed";

/**
 * Browser-level push permission request banner.
 *
 * Shows once to the user with "Allow" / "Later" buttons.
 * Dismissed banners are persisted in localStorage so they don't reappear.
 */
export function PushPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === "true") return;

    // Only show if the browser supports notifications and permission
    // hasn't already been granted or denied
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;

    // Small delay so the page renders first
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    try {
      await Notification.requestPermission();
    } catch {
      // Permission request failed — silently handle
    }
    setVisible(false);
  };

  const handleLater = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-fade-in-up max-w-sm mx-auto">
      <div className="glass-lux rounded-2xl p-4 border border-white/10 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
            <Bell size={20} className="text-primary-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Stay Updated
            </p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Get notified when a mechanic responds or your service status changes.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleAllow}
                className="inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Allow
              </button>
              <button
                type="button"
                onClick={handleLater}
                className="inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs font-medium text-text-muted hover:text-foreground hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                Later
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLater}
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-label="Dismiss"
          >
            <X size={14} className="text-text-dim" />
          </button>
        </div>
      </div>
    </div>
  );
}
