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

      {/* Login rápido (solo para demo) */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center mb-3">Acceso rápido (Demo)</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEmail('admin.dif@veracruz.gob.mx');
              setPassword('Dif2024!');
            }}
            className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            Admin DIF
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('superadmin@veracruz.gob.mx');
              setPassword('Admin2024!');
            }}
            className="flex-1 px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
          >
            Super Admin
          </button>
        </div>
      </div>

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
