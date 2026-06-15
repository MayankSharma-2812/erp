import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      setAuth: ({ user, accessToken }) =>
        set({
          user,
          accessToken,
          isAuthenticated: !!user,
        }),
        
      setAccessToken: (accessToken) =>
        set({
          accessToken,
        }),
        
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'vidyaerp-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist user and isAuthenticated, NOT the sensitive accessToken
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
