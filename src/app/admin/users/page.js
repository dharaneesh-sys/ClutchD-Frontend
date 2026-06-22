"use client";

import { UserTable } from "@/components/admin/UserTable";

export default function UsersPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">Users &amp; Providers</h2>
        <p className="text-text-muted">Manage all registered accounts on the platform.</p>
      </div>
      
      <UserTable />
    </div>
  );
}
