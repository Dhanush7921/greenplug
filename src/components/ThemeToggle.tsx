import { useTheme } from '../lib/theme';
import { Icon } from './Icon';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className={`icon-btn theme-toggle ${className}`}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      data-magnetic="0.4"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
    >
      <Icon name="sun" className="icon sun" />
      <Icon name="moon" className="icon moon" />
    </button>
  );
}
