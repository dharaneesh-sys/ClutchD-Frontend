"use client";

export function DemoToggle({ isDemoMode, onToggle }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus-lux ${
          isDemoMode
            ? "bg-[var(--primary)]"
            : "bg-[rgba(var(--color-white-rgb),0.08)]"
        }`}
        aria-label={`Toggle demo mode ${isDemoMode ? "off" : "on"}`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            isDemoMode ? "ml-auto mr-[3px]" : "ml-[3px] mr-auto"
          }`}
        />
      </button>

      <span className="type-title-3 select-none text-[var(--foreground)]">
        Demo Mode
      </span>

      {isDemoMode && (
        <span className="type-label-2 uppercase px-2 py-0.5 rounded-full bg-[rgba(var(--color-primary-rgb),0.12)] text-[var(--primary)] border border-[rgba(var(--color-primary-rgb),0.2)]">
          Demo
        </span>
      )}
    </div>
  );
}
