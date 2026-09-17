import { createContext, useContext, useMemo } from "react";

const ThemeContext = createContext(null);

// Dark mode disabled — UI breaks in dark mode, removing it for now.
// Always returns light. No-op toggle so Navbar doesn't crash.
export function ThemeProvider({ children }) {
  const value = useMemo(() => ({
    theme: "light",
    isDark: false,
    toggleTheme: () => {},
    setTheme: () => {},
  }), []);

  // Force light on mount (in case browser localStorage had "dark" saved)
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("dark");
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
