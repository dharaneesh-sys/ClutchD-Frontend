import { useState, useEffect } from "react";
import { getConnectionState } from "@/lib/socket";

const POLL_INTERVAL = 3000;

const STATE_CONFIG = {
  connected: {
    label: "Live: Connected",
    dot: "bg-primary-light",
    pulse: false,
  },
  connecting: {
    label: "Live: Reconnecting...",
    dot: "bg-amber-400",
    pulse: true,
  },
  closing: {
    label: "Live: Reconnecting...",
    dot: "bg-amber-400",
    pulse: true,
  },
  disconnected: {
    label: "Live: Disconnected",
    dot: "bg-red-400",
    pulse: false,
  },
};

export function ConnectionIndicator() {
  const [state, setState] = useState("disconnected");
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Poll immediately on mount
    setState(getConnectionState());

    const id = setInterval(() => {
      setState(getConnectionState());
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, []);

  const config = STATE_CONFIG[state] ?? STATE_CONFIG.disconnected;

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.dot} ${
          config.pulse ? "animate-pulse" : ""
        }`}
        aria-label={config.label}
      />

      {hovered && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap z-[600] pointer-events-none shadow-lg bg-foreground text-background"
        >
          {config.label}
        </div>
      )}
    </div>
  );
}
