import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          // Guardar token en api
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true, user };
        } catch (error) {
          const message = error.response?.data?.error || 'Error al iniciar sesión';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Ignorar error de logout
        }
        
        delete api.defaults.headers.common['Authorization'];
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      // Refrescar usuario
      refreshUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/me');
          set({ user: response.data });
        } catch (error) {
          // Token inválido, hacer logout
          get().logout();
        }
      },

      // Verificar si el usuario tiene un rol específico
      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        if (typeof roles === 'string') return user.rol === roles;
        return roles.includes(user.rol);
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Inicializar auth al cargar la app
      initAuth: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          get().refreshUser();
        }
      }
    }),
    {
      name: 'flota-auth',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Inicializar al cargar
if (typeof window !== 'undefined') {
  useAuthStore.getState().initAuth();
}

export default useAuthStore;