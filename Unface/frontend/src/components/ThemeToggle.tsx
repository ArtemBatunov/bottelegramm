import { useTheme } from '../context/ThemeContext';

/** Глобальный переключатель светлой / тёмной темы */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`fixed top-4 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full border shadow-md transition ${className} ${
        isDark
          ? 'border-gray-600 bg-gray-800/95 text-amber-200 hover:bg-gray-700'
          : 'border-gray-200/90 bg-white/95 text-charcoal hover:bg-white'
      }`}
      aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {isDark ? (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm5.657 2.343a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zM18 11a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1zm-2.343 5.657a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 0 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414zM12 20a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1zm-6.343-2.343a1 1 0 0 1 0-1.414l.707-.707a1 1 0 0 1 1.414 1.414l-.707.707a1 1 0 0 1-1.414 0zM6 13a1 1 0 1 1 0-2H5a1 1 0 1 1 0 2h1zm2.343-6.343a1 1 0 0 1 1.414 0l.707.707A1 1 0 0 1 9.05 8.778l-.707-.707a1 1 0 0 1 0-1.414zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}
