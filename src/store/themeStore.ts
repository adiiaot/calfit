import { create } from 'zustand';
import { ColorScheme } from '../theme/colors';

interface ThemeState {
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setTheme: (scheme: ColorScheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colorScheme: 'light',
  toggleTheme: () =>
    set((state) => ({
      colorScheme: state.colorScheme === 'dark' ? 'light' : 'dark',
    })),
  setTheme: (scheme) => set({ colorScheme: scheme }),
}));