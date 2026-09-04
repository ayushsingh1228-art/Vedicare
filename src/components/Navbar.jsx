import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Leaf, LogOut, Languages, MessagesSquare, CalendarCheck, FileHeart, Sparkles, LayoutDashboard, Stethoscope, ShieldCheck, Bell, MoonStar, SunMedium } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isHindi, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const loc = useLocation();
  const nav = useNavigate();

  const links = user?.role === "doctor"
    ? [{ to: "/doctor", label: "Appointments", icon: Stethoscope }]
    : user?.role === "admin"
      ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }]
      : [
          { to: "/dashboard",    label: "Home",      icon: LayoutDashboard },
          { to: "/chatbot",      label: "AI Chat",   icon: MessagesSquare },
          { to: "/appointments", label: "Book",      icon: CalendarCheck },
          { to: "/records",      label: "Records",   icon: FileHeart },
          { to: "/wellness",     label: "Wellness",  icon: Sparkles },
          { to: "/medicines",    label: "Reminders", icon: Bell },
        ];

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7DED0]/80 bg-[#F7F3EE]/90 text-ink dark:bg-[#111827]/90 dark:text-slate-100 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          to={user ? (user.role === "doctor" ? "/doctor" : user.role === "admin" ? "/admin" : "/dashboard") : "/"}
          className="flex items-center gap-2.5 shrink-0"
          data-testid="nav-logo"
        >
          <div className="w-9 h-9 rounded-xl bg-[#C85A17] flex items-center justify-center shadow-md shadow-saffron/20">
            <Leaf className="w-4.5 h-4.5 text-white" style={{ width: "1.1rem", height: "1.1rem" }} />
          </div>
          <span className="font-serif text-2xl tracking-tight text-ink">Vediccare</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {links.map((l) => {
            const active = loc.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                data-testid={`nav-${l.label.toLowerCase().replace(/\s/g, '-')}`}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#1D1A17] text-white"
                    : "text-ink/60 hover:text-ink hover:bg-white/70"
                }`}
              >
                <l.icon className="w-3.5 h-3.5" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E1D5] bg-white/80 text-ink/70 transition hover:border-saffron hover:text-saffron"
          >
            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>

          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-pressed={isHindi}
            data-testid="language-hindi"
            className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
              isHindi
                ? "border-saffron bg-saffron-light text-saffron"
                : "border-[#E8E1D5] text-ink/50 hover:border-saffron/50 hover:text-saffron"
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            {isHindi ? "EN" : "हि"}
          </button>

          {/* User avatar */}
          {user && (
            <div
              className="hidden sm:flex items-center gap-2 bg-white border border-[#E8E1D5] rounded-xl px-3 py-1.5"
              data-testid="nav-user"
            >
              <div className="w-7 h-7 rounded-lg bg-[#EEF3EA] flex items-center justify-center text-xs font-bold text-herb border border-herb/20">
                {initials}
              </div>
              <span className="text-sm font-medium text-ink/80 max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
            </div>
          )}

          {/* Logout */}
          <button
            data-testid="logout-btn"
            onClick={() => { logout(); nav("/"); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-ink/50 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden flex justify-around border-t border-[#E8E1D5]/60 bg-white/90 backdrop-blur-xl py-1">
        {links.map((l) => {
          const active = loc.pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-xs font-medium ${
                active ? "text-saffron" : "text-ink/45 hover:text-ink"
              }`}
            >
              <l.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
