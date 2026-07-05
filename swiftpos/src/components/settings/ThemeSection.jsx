import { useTheme } from '@/lib/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex bg-muted rounded-lg p-1">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
          theme === 'light' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
        }`}
      >
        <Sun className="w-3.5 h-3.5" /> Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
          theme === 'dark' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
        }`}
      >
        <Moon className="w-3.5 h-3.5" /> Dark
      </button>
    </div>
  );
}
