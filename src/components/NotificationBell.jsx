import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const ref = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifs(res.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = !seen && notifs.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); setSeen(true); }}
        className="relative hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E1D5] bg-white/80 dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-200 text-ink/70 transition hover:border-saffron hover:text-saffron"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-[#E8E1D5] dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8E1D5] dark:border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-ink dark:text-slate-100 text-sm">Notifications</span>
            <span className="text-xs text-ink/50 dark:text-slate-400">{notifs.length} items</span>
          </div>
          {notifs.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-8 h-8 text-ink/20 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-ink/50 dark:text-slate-400">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F1EAE2] dark:divide-slate-800 max-h-72 overflow-y-auto">
              {notifs.map((n) => (
                <li key={n.id} className="px-4 py-3 hover:bg-[#FAF7F3] dark:hover:bg-slate-800/60 transition">
                  <p className="text-sm text-ink/80 dark:text-slate-200 leading-snug">{n.message}</p>
                  <p className="text-xs text-ink/40 dark:text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 border-t border-[#E8E1D5]">
            <button onClick={() => { fetchNotifs(); setSeen(false); }} className="text-xs text-saffron hover:underline">Refresh</button>
          </div>
        </div>
      )}
    </div>
  );
}
