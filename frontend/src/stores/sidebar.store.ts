import { create } from "zustand";

// Luu trang thai dong/mo cua sidebar
interface SidebarState {
  isOpen: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  isMobileOpen: false,

  // Dong/mo sidebar tren desktop
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  // Dong/mo sidebar tren mobile (overlay)
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}));
