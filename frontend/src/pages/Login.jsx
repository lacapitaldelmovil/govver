import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TruckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  // Cargar credenciales guardadas al iniciar
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRecordar(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor ingrese email y contraseña');
      return;
    }

    // Guardar o eliminar credenciales según la opción
    if (recordar) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedPassword', password);
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
    }

    const result = await login(email, password);
    
    if (result.success) {
      toast.success(`Bienvenido(a), ${result.user.nombre}`);
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl mx-4 border-2 border-gray-200">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img 
            src="/logo-veracruz.png" 
            alt="Gobierno de Veracruz" 
            className="h-24 w-auto bg-white rounded-lg p-2"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Flota Vehicular</h2>
        <p className="text-gray-600 mt-1">Gobierno del Estado de Veracruz</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo institucional
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@veracruz.gob.mx"
            className="input-field"
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pr-10"
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Checkbox Recordar */}
        <div className="flex items-center">
          <input
            id="recordar"
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
            className="h-4 w-4 text-veracruz-azul focus:ring-veracruz-azul border-gray-300 rounded cursor-pointer"
          />
          <label htmlFor="recordar" className="ml-2 block text-sm text-gray-700 cursor-pointer">
            Recordar usuario y contraseña
          </label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              Iniciando sesión...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          Sistema de uso exclusivo para funcionarios autorizados.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          © 2026 Gobierno del Estado de Veracruz
        </p>
      </div>
    </div>
  );
}
