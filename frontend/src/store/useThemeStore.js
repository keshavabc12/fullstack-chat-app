import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "coffee",

  setTheme: (newTheme) => {
    localStorage.setItem("chat-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    set({ theme: newTheme });
  },

  initTheme: () => {
    const savedTheme = localStorage.getItem("chat-theme") || "coffee";
    document.documentElement.setAttribute("data-theme", savedTheme);
    set({ theme: savedTheme });
  },
}));
