import { useState, useEffect, useRef } from "react";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";
import { useThemeStore } from "../../store/themeStore";
import api from "../../lib/api";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const { theme } = useThemeStore();
  const isLight = theme === "light";

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
      console.warn("Failed to fetch notifications", e);
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
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read/all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-600" : "bg-white/5 hover:bg-white/10 text-white/70"
        }`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={`absolute top-0 right-0 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold text-white ${
            isLight ? "bg-red-500" : "bg-red-500"
          }`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border z-[500] flex flex-col overflow-hidden max-h-[400px] ${
          isLight ? "bg-white border-slate-200" : "bg-[#18181b] border-white/10"
        }`}>
          <div className={`p-4 flex items-center justify-between border-b ${isLight ? "border-slate-100 bg-slate-50" : "border-white/5 bg-black/20"}`}>
            <h3 className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead} 
                className={`text-xs flex items-center gap-1 hover:underline ${isLight ? "text-slate-500" : "text-emerald-400"}`}
              >
                <CheckCircle2 size={12} /> Mark all read
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 size={24} className={`animate-spin ${isLight ? "text-slate-400" : "text-emerald-400"}`} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm opacity-50">
                You have no notifications.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={(e) => !n.read && markAsRead(n.id, e)}
                    className={`p-4 transition-colors cursor-pointer ${
                      !n.read 
                        ? (isLight ? "bg-yellow-50/50" : "bg-emerald-500/5") 
                        : (isLight ? "hover:bg-slate-50" : "hover:bg-white/5")
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                       <h4 className={`text-sm font-semibold mb-1 ${!n.read ? (isLight ? "text-yellow-700" : "text-emerald-300") : (isLight ? "text-slate-800" : "text-white/80")}`}>
                         {n.title}
                       </h4>
                       {!n.read && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${isLight ? "bg-yellow-500" : "bg-emerald-500"}`} />}
                    </div>
                    <p className={`text-xs mb-2 ${isLight ? "text-slate-600" : "text-emerald-100/70"}`}>{n.body}</p>
                    <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-emerald-100/40"}`}>
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
