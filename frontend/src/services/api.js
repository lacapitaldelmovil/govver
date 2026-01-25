import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de request
api.interceptors.request.use(
  (config) => {
    // Token se agrega desde authStore
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          // Token expirado o inválido
          if (window.location.pathname !== '/login') {
            toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
            localStorage.removeItem('flota-auth');
            window.location.href = '/login';
          }
          break;
        case 403:
          toast.error('No tiene permisos para realizar esta acción');
          break;
        case 404:
          // No mostrar toast para 404, manejar en componente
          break;
        case 429:
          toast.error('Demasiadas solicitudes. Espere un momento.');
          break;
        case 500:
          toast.error('Error del servidor. Intente más tarde.');
          break;
        default:
          // Otros errores se manejan en el componente
          break;
      }
    } else if (error.request) {
      toast.error('Error de conexión. Verifique su red.');
    }

    return Promise.reject(error);
  }
);

export default api;
