import { useSettingsStore } from '../store/settingsStore';
import type { Theme } from '../types';

export function ThemeToggle() {
  const { settings, setTheme } = useSettingsStore();

  const themes: Theme[] = ['light', 'dark', 'system'];
  const icons: Record<Theme, string> = {
    light: '☀️',
    dark: '🌙',
    system: '💻'
  };

  const currentIndex = themes.indexOf(settings.theme);
  const nextTheme = themes[(currentIndex + 1) % themes.length];

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={`Theme: ${settings.theme} (click to switch)`}
      aria-label={`Switch theme, current: ${settings.theme}`}
    >
      <span className="text-lg">{icons[settings.theme]}</span>
    </button>
  );
}
