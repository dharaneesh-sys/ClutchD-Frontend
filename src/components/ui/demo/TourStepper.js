"use client";

export function TourStepper({
  isTourActive,
  tourStep,
  tourStepsTotal,
  tourLabel,
  onPrev,
  onNext,
  onStart,
  onCreateRequest,
  onAdvanceStatus,
  onReset,
}) {
  return (
    <div className="px-4 py-3 space-y-3">
      {isTourActive && (
        <div className="flex items-center justify-between px-3 py-2 bg-[rgba(var(--color-primary-rgb),0.06)] rounded-[0.625rem] border border-[rgba(var(--color-primary-rgb),0.1)]">
          <button
            onClick={onPrev}
            className="glass-lux-interactive px-2 py-1 active-press rounded-md text-[var(--on-surface-variant)]"
            aria-label="Previous step"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="flex flex-col items-center gap-1">
            <span className="type-label-1 text-[var(--primary)]">
              Step {tourStep + 1}/{tourStepsTotal}
            </span>
            {tourLabel && (
              <span className="text-sm text-center max-w-[220px] truncate text-[var(--on-surface-variant)]">
                {tourLabel}
              </span>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: tourStepsTotal }).map((_, i) => (
                <span
                  key={i}
                  className={`inline-block w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    i <= tourStep
                      ? "bg-[var(--primary)]"
                      : "bg-[rgba(var(--color-white-rgb),0.12)]"
                  } ${i === tourStep ? "scale-[1.3]" : "scale-100"}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={onNext}
            className="glass-lux-interactive px-2 py-1 active-press rounded-md text-[var(--primary)]"
            aria-label="Next step"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isTourActive && (
          <button
            onClick={onStart}
            className="glass-lux-interactive hover-lift active-press px-4 py-2 type-label-1 flex items-center gap-2 flex-1 justify-center rounded-[0.625rem] text-[var(--primary)] border border-[rgba(var(--color-primary-rgb),0.15)]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon
                points="10 8 16 12 10 16 10 8"
                fill="currentColor"
                stroke="none"
              />
            </svg>
            Investor Tour
          </button>
        )}

        {!isTourActive && (
          <>
            <button
              onClick={onCreateRequest}
              className="glass-lux-interactive hover-lift active-press px-3 py-2 type-label-1 flex items-center gap-1.5 rounded-[0.625rem] text-[var(--on-surface)]"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create
            </button>

            <button
              onClick={onAdvanceStatus}
              className="glass-lux-interactive hover-lift active-press px-3 py-2 type-label-1 flex items-center gap-1.5 rounded-[0.625rem] text-[var(--on-surface)]"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
              Advance
            </button>

            <button
              onClick={onReset}
              className="glass-lux-interactive hover-lift active-press px-3 py-2 type-label-1 flex items-center gap-1.5 rounded-[0.625rem] text-[var(--danger)]"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
