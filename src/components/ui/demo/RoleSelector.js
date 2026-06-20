"use client";

import { useState } from "react";

const ROLES = [
  { value: "customer", label: "Customer", icon: "👤" },
  { value: "mechanic", label: "Mechanic", icon: "🔧" },
  { value: "garage", label: "Garage", icon: "🏭" },
  { value: "admin", label: "Admin", icon: "🛡️" },
];

export function RoleSelector({ demoUser, onRoleChange }) {
  const [roleOpen, setRoleOpen] = useState(false);
  const activeRole = ROLES.find((r) => r.value === demoUser?.role) || ROLES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setRoleOpen(!roleOpen)}
        className="glass-lux-interactive px-3 py-1.5 type-label-1 flex items-center gap-1.5 rounded-lg text-[var(--foreground)]"
      >
        <span>{activeRole.icon}</span>
        <span>{activeRole.label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[var(--on-surface-variant)] transition-transform duration-200 ${
            roleOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {roleOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-40 glass-lux-strong overflow-hidden rounded-xl z-[60]">
          {ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => {
                onRoleChange(role.value);
                setRoleOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 type-body-2 flex items-center gap-2 transition-colors hover:bg-[rgba(var(--color-white-rgb),0.04)] ${
                role.value === demoUser?.role
                  ? "text-[var(--primary)] bg-[rgba(var(--color-primary-rgb),0.08)]"
                  : "text-[var(--on-surface)]"
              }`}
            >
              <span>{role.icon}</span>
              <span>{role.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
