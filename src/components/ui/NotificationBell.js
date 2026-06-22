import { useState, useEffect, useRef } from "react";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const { error: showError } = useToast();

  // Initial fetch of unread count
  useEffect(() => {
    api.get("/notifications?limit=1").then(res => {
      if (res.data?.unread_count !== undefined) {
        setUnreadCount(res.data.unread_count);
      }
    }).catch(() => {});
  }, []);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (e) {
      showError("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}`, { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch {
      showError("Failed to mark notification as read");
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read/all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      showError("Failed to mark all as read");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-surface-soft hover:bg-surface-mid text-text-muted"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold text-white bg-red-500">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border z-[500] flex flex-col overflow-hidden max-h-[400px] bg-surface border-border-subtle">
          <div className="p-4 flex items-center justify-between border-b border-border-subtle bg-surface-container-low">
            <h3 className="font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead} 
                  className="text-xs flex items-center gap-1 hover:underline text-text-muted"
                >
                  <CheckCircle2 size={12} /> Mark all read
                </button>
              )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 size={24} className="animate-spin text-text-muted" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm opacity-50">
                You have no notifications.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={(e) => !n.read && markAsRead(n.id, e)}
                      className={`p-4 transition-colors cursor-pointer ${
                        !n.read 
                          ? "bg-surface-soft" 
                          : "hover:bg-surface-container-low"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                       <h4 className={`text-sm font-semibold mb-1 ${!n.read ? "text-icon-highlight" : "text-text-primary"}`}>
                          {n.title}
                        </h4>
                        {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1 bg-primary" />}
                    </div>
                    <p className="text-xs mb-2 text-text-muted">{n.body}</p>
                    <p className="text-[10px] text-text-dim">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
