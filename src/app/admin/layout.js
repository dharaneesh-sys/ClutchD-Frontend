"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { NAVIGATION_EVENT } from "@/lib/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { isAuthenticated, user, _hydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated) {
      router.push("/auth");
    } else if (user && user.role !== "admin") {
      router.push(`/dashboard/${user.role}`);
    }
  }, [_hydrated, isAuthenticated, user, router]);

  // Listen for navigation events from non-React contexts (e.g., axios interceptors)
  useEffect(() => {
    const handleNavigation = (event) => {
      const { path } = event.detail;
      if (path) {
        router.push(path);
      }
    };
    window.addEventListener(NAVIGATION_EVENT, handleNavigation);
    return () => window.removeEventListener(NAVIGATION_EVENT, handleNavigation);
  }, [router]);

  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setSidebarOpen(false);
  }

  if (!_hydrated || !isAuthenticated || !user || user.role !== "admin") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col lg:flex-row overflow-hidden relative z-10 p-3 sm:p-4 lg:p-6 gap-4 lg:gap-6 bg-[var(--background)] text-[var(--foreground)]`}>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <Logo size="md" showText />
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 transition-colors"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          fixed lg:relative top-0 left-0 z-50 lg:z-auto
          h-full w-72 lg:w-64
          transition-transform duration-300 ease-in-out
          rounded-2xl overflow-hidden border shadow-2xl
          border-border-subtle
        `}
      >
        <Sidebar currentPath={pathname} onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 rounded-2xl border shadow-2xl overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 bg-bg-card border-border-subtle">
        {children}
      </main>
    </div>
  );
}
