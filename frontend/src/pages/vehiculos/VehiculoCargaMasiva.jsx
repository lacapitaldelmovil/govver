import { useState, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function VehiculoCargaMasiva() {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
        toast.error('Solo se permiten archivos Excel (.xlsx) o CSV');
        return;
      }
      
      setArchivo(file);
      setResultado(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setArchivo(file);
      setResultado(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const subirArchivo = async () => {
    if (!archivo) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    setCargando(true);
    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const response = await api.post('/vehiculos/carga-masiva', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResultado(response.data);
      toast.success('Archivo procesado correctamente');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al procesar archivo');
      setResultado({
        exito: false,
        error: error.response?.data?.error || 'Error desconocido'
      });
    }
    setCargando(false);
  };

  const limpiar = () => {
    setArchivo(null);
    setResultado(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const descargarPlantilla = () => {
    // Crear CSV de plantilla
    const headers = [
      'numero_inventario',
      'placas',
      'marca',
      'linea',
      'modelo',
      'numero_serie',
      'numero_motor',
      'color',
      'tipo',
      'capacidad_pasajeros',
      'tipo_combustible',
      'regimen',
      'secretaria_siglas',
      'municipio',
      'ubicacion',
      'estado_operativo',
      'resguardatario_nombre'
    ];

    const ejemplo = [
      'VER-2024-001',
      'ABC-123-A',
      'Toyota',
      'Hilux',
      '2024',
      '1HGCG5655WA123456',
      'MOT12345',
      'Blanco',
      'camioneta',
      '5',
      'gasolina',
      'propio',
      'SSP',
      'Xalapa',
      'Palacio de Gobierno',
      'activo',
      'Juan Pérez'
    ];

    const csv = [headers.join(','), ejemplo.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_vehiculos.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Carga Masiva de Vehículos</h1>
        <p className="text-gray-500 mt-1">Importa vehículos desde un archivo Excel o CSV</p>
      </div>

      {/* Descargar plantilla */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900">Descarga la plantilla</h3>
            <p className="text-sm text-blue-700">Usa esta plantilla para asegurar el formato correcto</p>
          </div>
          <button onClick={descargarPlantilla} className="btn-primary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Plantilla CSV
          </button>
        </div>
      </div>

      {/* Zona de carga */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`card border-2 border-dashed transition-colors ${
          archivo ? 'border-veracruz-400 bg-veracruz-50' : 'border-gray-300 hover:border-veracruz-400'
        }`}
      >
        {!archivo ? (
          <div className="py-12 text-center">
            <CloudArrowUpIcon className="h-16 w-16 mx-auto text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              Arrastra tu archivo aquí
            </p>
            <p className="text-gray-500">o</p>
            <label className="mt-4 inline-block">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="btn-primary cursor-pointer">
                Seleccionar archivo
              </span>
            </label>
            <p className="mt-4 text-sm text-gray-500">
              Formatos aceptados: Excel (.xlsx) o CSV
            </p>
          </div>
        ) : (
          <div className="py-8">
            <div className="flex items-center justify-center gap-4">
              <DocumentIcon className="h-12 w-12 text-veracruz-500" />
              <div>
                <p className="font-medium text-gray-900">{archivo.name}</p>
                <p className="text-sm text-gray-500">
                  {(archivo.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={limpiar}
                className="p-2 text-gray-500 hover:text-red-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {!resultado && (
              <div className="mt-6 text-center">
                <button
                  onClick={subirArchivo}
                  disabled={cargando}
                  className="btn-primary"
                >
                  {cargando ? (
                    <>
                      <div className="spinner h-5 w-5" />
                      Procesando...
                    </>
                  ) : (
                    'Procesar Archivo'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resultados */}
      {resultado && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Resultado del Proceso</h3>
          
          {resultado.exito === false ? (
            <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Error al procesar</p>
                <p className="text-sm text-red-700">{resultado.error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="h-8 w-8 mx-auto text-green-500" />
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {resultado.insertados || 0}
                  </p>
                  <p className="text-sm text-green-600">Insertados</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <DocumentIcon className="h-8 w-8 mx-auto text-blue-500" />
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {resultado.actualizados || 0}
                  </p>
                  <p className="text-sm text-blue-600">Actualizados</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <ExclamationTriangleIcon className="h-8 w-8 mx-auto text-yellow-500" />
                  <p className="text-2xl font-bold text-yellow-700 mt-2">
                    {resultado.errores?.length || 0}
                  </p>
                  <p className="text-sm text-yellow-600">Con errores</p>
                </div>
              </div>

              {/* Errores detallados */}
              {resultado.errores?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Registros con errores:</h4>
                  <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                    {resultado.errores.map((error, idx) => (
                      <div key={idx} className="text-sm py-1 border-b border-gray-200 last:border-0">
                        <span className="text-gray-500">Fila {error.fila}:</span>{' '}
                        <span className="text-red-600">{error.mensaje}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <button onClick={limpiar} className="btn-secondary">
                  Cargar otro archivo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instrucciones */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Instrucciones</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-veracruz-500 font-bold">1.</span>
            Descarga la plantilla CSV y ábrela en Excel
          </li>
          <li className="flex items-start gap-2">
            <span className="text-veracruz-500 font-bold">2.</span>
            Llena los datos de cada vehículo en una fila (no borres los encabezados)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-veracruz-500 font-bold">3.</span>
            Guarda el archivo como Excel (.xlsx) o CSV
          </li>
          <li className="flex items-start gap-2">
            <span className="text-veracruz-500 font-bold">4.</span>
            Sube el archivo y revisa el resultado
          </li>
        </ul>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Los campos obligatorios son: numero_inventario, placas, marca, 
            linea, modelo, tipo, regimen y secretaria_siglas. La secretaría debe existir en el sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
