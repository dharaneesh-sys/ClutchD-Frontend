import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Search, MoreVertical, Eye, ShieldOff, ShieldCheck } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchUsers, toggleUserStatus } from "@/services/adminService";

export function UserTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const dropdownRef = useRef(null);
  const { theme } = useThemeStore();
  const { success: showSuccess, error: showError } = useToast();
  const isLight = theme === "light";

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (roleFilter !== "All Roles") {
        params.role = roleFilter.toLowerCase().replace(/s$/, "");
      }
      if (statusFilter !== "All Status") {
        params.status = statusFilter.toLowerCase();
      }
      const data = await fetchUsers(params);
      setUsers(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (user) => {
    setActionLoading(user.id);
    try {
      const newActive = user.status === "Suspended";
      await toggleUserStatus(user.id, newActive);
      setUsers(prev => prev.map(u =>
        u.id === user.id
          ? { ...u, status: newActive ? "Active" : "Suspended" }
          : u
      ));
      showSuccess(`${user.name} ${newActive ? "activated" : "suspended"}.`);
      setOpenDropdown(null);
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <GlassCard variant="outlined" className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${"text-text-muted"}`} />
            <Input
              placeholder="Search by name or ID..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${"bg-bg-card border-border-subtle text-text-primary focus:ring-2"}`}
            >
              <option className="bg-bg-card">All Roles</option>
              <option className="bg-bg-card">Customers</option>
              <option className="bg-bg-card">Mechanics</option>
              <option className="bg-bg-card">Garages</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${"bg-bg-card border-border-subtle text-text-primary focus:ring-2"}`}
            >
              <option className="bg-bg-card">All Status</option>
              <option className="bg-bg-card">Active</option>
              <option className="bg-bg-card">Suspended</option>
              <option className="bg-bg-card">Pending</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <p>{error}</p>
            <button onClick={loadUsers} className="mt-3 text-sm underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className={`w-full text-left text-sm ${"text-text-primary"}`}>
              <thead className={`text-xs uppercase border-b ${"text-text-dim border-border-subtle"}`}>
                <tr>
                  <th className="px-4 pb-3 font-medium">User ID</th>
                  <th className="px-4 pb-3 font-medium">Name</th>
                  <th className="px-4 pb-3 font-medium">Role</th>
                  <th className="px-4 pb-3 font-medium">Status</th>
                  <th className="px-4 pb-3 font-medium">Joined Date</th>
                  <th className="px-4 pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`border-b transition-colors ${"border-border-subtle hover:bg-bg-card"}`}>
                    <td className={`px-4 py-4 font-mono text-xs ${"text-text-muted"}`}>{user.id?.slice(0, 8)}</td>
                    <td className={`px-4 py-4 font-medium ${"text-text-primary"}`}>{user.name}</td>
                    <td className="px-4 py-4">{user.role}</td>
                    <td className="px-4 py-4">
                      <Badge variant={
                        user.status === 'Active' ? 'success' :
                        user.status === 'Suspended' ? 'danger' : 'warning'
                      }>
                        {user.status}
                      </Badge>
                    </td>
                    <td className={`px-4 py-4 ${"text-text-muted"}`}>{user.joined}</td>
                    <td className="px-4 py-4 text-right relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                        className={`p-1 rounded transition-colors ${"hover:bg-bg-card text-text-muted hover:text-text-primary"}`}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openDropdown === user.id && (
                        <div
                          ref={dropdownRef}
                          className={`absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border shadow-2xl overflow-hidden ${
                            "bg-bg-card border-border-subtle"
                          }`}
                        >
                          <button
                            onClick={() => { setProfileModal(user); setOpenDropdown(null); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                              "text-text-primary hover:bg-bg-card"
                            }`}
                          >
                            <Eye size={14} /> View Profile
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoading === user.id}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                              user.status === "Suspended"
                                ? "text-icon-highlight hover:bg-surface-soft"
                                : "text-red-500 hover:bg-surface-soft"
                            }`}
                          >
                            {user.status === "Suspended" ? (
                              <><ShieldCheck size={14} /> Activate User</>
                            ) : (
                              <><ShieldOff size={14} /> Suspend User</>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className={`py-12 text-center ${"text-text-dim"}`}>
                No users found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <Modal isOpen={!!profileModal} onClose={() => setProfileModal(null)} title="User Profile">
        {profileModal && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
              <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Name</p>
              <p className={`font-medium ${"text-text-primary"}`}>{profileModal.name}</p>
            </div>
            <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
              <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>User ID</p>
              <p className={`font-mono text-sm ${"text-text-primary"}`}>{profileModal.id}</p>
            </div>
            <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
              <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Role</p>
              <p className={`font-medium ${"text-text-primary"}`}>{profileModal.role}</p>
            </div>
            <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
              <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Status</p>
              <Badge variant={
                profileModal.status === 'Active' ? 'success' :
                profileModal.status === 'Suspended' ? 'danger' : 'warning'
              }>{profileModal.status}</Badge>
            </div>
            <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
              <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Joined</p>
              <p className={`font-medium ${"text-text-primary"}`}>{profileModal.joined}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
