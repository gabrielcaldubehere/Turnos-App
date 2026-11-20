import useTheme from "../../theme/useTheme";
import Icon from "../ui/Icon";

type ThemeToggleProps = {
  compact?: boolean;
};

function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-pressed={isDark}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={`inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-sage-300 hover:bg-zinc-50 hover:text-zinc-900 ${
        compact ? "h-9 w-9 shrink-0" : "gap-2 px-3 py-2 text-sm font-medium"
      }`}
    >
      <Icon name={isDark ? "sun" : "moon"} className="h-4 w-4" />
      {!compact && <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}

export default ThemeToggle;
