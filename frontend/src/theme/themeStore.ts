import { createContext } from "react";

export type Theme = "light" | "dark";

export type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

export const THEME_STORAGE_KEY = "turnos.theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export default ThemeContext;
