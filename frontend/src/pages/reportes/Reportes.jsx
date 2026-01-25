import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  DocumentArrowDownIcon,
  ChartBarIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoReporte, setTipoReporte] = useState('');
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    cargarStats();
    
    // Fechas por defecto: último mes
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    
    setFechaFin(hoy.toISOString().split('T')[0]);
    setFechaInicio(hace30.toISOString().split('T')[0]);
  }, []);

  const cargarStats = async () => {
    try {
      const response = await api.get('/reportes/estadisticas');
      setStats(response.data);
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    }
    setLoading(false);
  };

  const generarReporte = async (tipo) => {
    setGenerando(true);
    setTipoReporte(tipo);
    
    try {
      const response = await api.get(`/reportes/${tipo}`, {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Determinar extensión según tipo de reporte
      const extension = tipo === 'ejecutivo' ? 'html' : 'csv';
      link.setAttribute('download', `reporte_${tipo}_${fechaInicio}_${fechaFin}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(tipo === 'ejecutivo' ? 'Reporte Ejecutivo descargado. Ábrelo en tu navegador para ver e imprimir.' : 'Reporte descargado');
    } catch (error) {
      toast.error('Error al generar reporte');
    }
    setGenerando(false);
    setTipoReporte('');
  };

  const reportesDisponibles = [
    {
      id: 'ejecutivo',
      titulo: 'Reporte Ejecutivo',
      descripcion: 'Resumen profesional completo con análisis de toda la flota, costos, eficiencia y recomendaciones',
      icon: DocumentChartBarIcon,
      color: 'bg-gradient-to-r from-veracruz-600 to-veracruz-800',
      destacado: true,
      formato: 'HTML'
    },
    {
      id: 'vehiculos',
      titulo: 'Inventario de Vehículos',
      descripcion: 'Lista completa de todos los vehículos con su estado actual',
      icon: TruckIcon,
      color: 'bg-blue-500',
      formato: 'CSV'
    },
    {
      id: 'solicitudes',
      titulo: 'Solicitudes de Préstamo',
      descripcion: 'Historial de solicitudes en el período seleccionado',
      icon: ClockIcon,
      color: 'bg-green-500',
      formato: 'CSV'
    },
    {
      id: 'eficiencia',
      titulo: 'Eficiencia por Secretaría',
      descripcion: 'Indicadores de uso y eficiencia vehicular por dependencia',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      formato: 'CSV'
    },
    {
      id: 'costos',
      titulo: 'Análisis de Costos',
      descripcion: 'Vehículos rentados vs propios y gastos asociados',
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      formato: 'CSV'
    },
    {
      id: 'ocupacion',
      titulo: 'Ocupación Vehicular',
      descripcion: 'Análisis de vehículos ociosos y subutilizados',
      icon: BuildingOfficeIcon,
      color: 'bg-red-500',
      formato: 'CSV'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Centro de Reportes</h1>
        <p className="text-gray-500 mt-1">Genera y descarga reportes personalizados</p>
      </div>

      {/* Stats rápidas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-veracruz-600">{stats.total_vehiculos || 0}</p>
            <p className="text-sm text-gray-500">Vehículos Totales</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">{stats.vehiculos_operando || 0}</p>
            <p className="text-sm text-gray-500">Operando</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-cyan-600">{stats.vehiculos_disponibles || 0}</p>
            <p className="text-sm text-gray-500">Disponibles</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.total_secretarias || 0}</p>
            <p className="text-sm text-gray-500">Secretarías</p>
          </div>
        </div>
      )}

      {/* Filtros de fecha */}
      <div className="card">
        <h3 className="font-medium text-gray-900 mb-4">Período del Reporte</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const hoy = new Date();
                const hace7 = new Date();
                hace7.setDate(hace7.getDate() - 7);
                setFechaFin(hoy.toISOString().split('T')[0]);
                setFechaInicio(hace7.toISOString().split('T')[0]);
              }}
              className="btn-secondary text-sm"
            >
              7 días
            </button>
            <button
              onClick={() => {
                const hoy = new Date();
                const hace30 = new Date();
                hace30.setDate(hace30.getDate() - 30);
                setFechaFin(hoy.toISOString().split('T')[0]);
                setFechaInicio(hace30.toISOString().split('T')[0]);
              }}
              className="btn-secondary text-sm"
            >
              30 días
            </button>
            <button
              onClick={() => {
                const hoy = new Date();
                const hace90 = new Date();
                hace90.setDate(hace90.getDate() - 90);
                setFechaFin(hoy.toISOString().split('T')[0]);
                setFechaInicio(hace90.toISOString().split('T')[0]);
              }}
              className="btn-secondary text-sm"
            >
              90 días
            </button>
          </div>
        </div>
      </div>

      {/* Grid de reportes */}
      {/* Reporte Ejecutivo Destacado */}
      <div className="card bg-gradient-to-r from-veracruz-50 to-blue-50 border-2 border-veracruz-200 hover:shadow-xl transition-all">
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-veracruz-600 to-veracruz-800 text-white shadow-lg">
            <DocumentChartBarIcon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xl text-gray-900">Reporte Ejecutivo</h3>
              <span className="px-2 py-1 bg-veracruz-100 text-veracruz-700 text-xs font-semibold rounded-full">DESTACADO</span>
            </div>
            <p className="text-gray-600 mt-2">
              Resumen profesional completo con análisis integral de toda la flota vehicular del Estado de Veracruz. 
              Incluye estado operativo, distribución por secretaría, análisis de costos de arrendamiento, 
              estado de documentación, antigüedad de flota, y recomendaciones estratégicas.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">KPIs principales</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Análisis de costos</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Por secretaría</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Recomendaciones</span>
            </div>
            <button
              onClick={() => generarReporte('ejecutivo')}
              disabled={generando}
              className="mt-4 flex items-center gap-2 bg-veracruz-600 hover:bg-veracruz-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md"
            >
              {generando && tipoReporte === 'ejecutivo' ? (
                <>
                  <div className="spinner h-5 w-5 border-white" />
                  Generando Reporte...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Descargar Reporte Ejecutivo (HTML)
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              El archivo HTML se puede abrir en cualquier navegador e imprimir como PDF
            </p>
          </div>
        </div>
      </div>

      {/* Otros reportes */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportesDisponibles.filter(r => r.id !== 'ejecutivo').map((reporte) => (
          <div key={reporte.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${reporte.color} text-white`}>
                <reporte.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{reporte.titulo}</h3>
                <p className="text-sm text-gray-500 mt-1">{reporte.descripcion}</p>
                <button
                  onClick={() => generarReporte(reporte.id)}
                  disabled={generando}
                  className="mt-4 flex items-center gap-2 text-veracruz-600 hover:text-veracruz-700 font-medium text-sm"
                >
                  {generando && tipoReporte === reporte.id ? (
                    <>
                      <div className="spinner h-4 w-4" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Descargar {reporte.formato || 'CSV'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Reportes Personalizados</h4>
            <p className="text-sm text-blue-700 mt-1">
              ¿Necesitas un reporte específico? Contacta al administrador del sistema 
              para solicitar reportes personalizados con filtros adicionales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
