"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "@/components/profile/ProfileMenu";

/**
 * Profile layout wraps all /marketplace/profile/* routes.
 * - On lg+ screens: shows a sidebar with ProfileMenu
 * - On mobile: full-width content (BottomNav and marketplace back
 *   button are already provided by the parent marketplace layout)
 *
 * The sticky header is intentionally omitted because the parent
 * marketplace layout already provides back navigation and the
 * BottomNav includes a profile tab.
 */
export default function ProfileLayout({ children }) {
  const pathname = usePathname();
  const isRootProfile = pathname === "/marketplace/profile";

  return (
    <div className="flex-1 flex">
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-white/[0.06] p-4 overflow-y-auto">
        <ProfileMenu />
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 min-w-0", isRootProfile ? "" : "pb-20 lg:pb-6")}>
        {children}
      </main>
    </div>
  );
}
