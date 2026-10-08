"use client";

import { UserTable } from "@/components/admin/UserTable";

export default function UsersPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="type-headline-3 mb-2 text-text-primary">Users &amp; Providers</h2>
        <p className="type-body-2 text-text-muted">Manage all registered accounts on the platform.</p>
      </div>
      
      <UserTable />
    </div>
  );
}
