import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  TruckIcon,
  UserIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function NuevaAsignacion() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('vehiculo_id');

  const [enviando, setEnviando] = useState(false);
  const [paso, setPaso] = useState(preselectedId ? 2 : 1); // 1: seleccionar vehículo, 2: datos

  // Vehículos
  const [vehiculos, setVehiculos] = useState([]);
  const [loadingVeh, setLoadingVeh] = useState(true);
  const [busquedaVeh, setBusquedaVeh] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    conductor_nombre: '',
    conductor_cargo: '',
    conductor_telefono: '',
    conductor_email: '',
    conductor_licencia: '',
    fecha_salida: new Date().toISOString().split('T')[0],
    hora_salida: new Date().toTimeString().slice(0, 5),
    km_salida: '',
    combustible_salida: '',
    destino: '',
    motivo: '',
    observaciones_salida: ''
  });

  useEffect(() => { cargarVehiculos(); }, []);

  useEffect(() => {
    if (preselectedId && vehiculos.length > 0) {
      const v = vehiculos.find(v => v.id == preselectedId);
      if (v) {
        setVehiculoSeleccionado(v);
        setPaso(2);
      }
    }
  }, [preselectedId, vehiculos]);

  const cargarVehiculos = async () => {
    setLoadingVeh(true);
    try {
      const res = await api.get('/vehiculos?limit=500&activo=1');
      const lista = res.data.vehiculos || res.data || [];
      setVehiculos(lista);
    } catch { toast.error('Error al cargar vehículos'); }
    setLoadingVeh(false);
  };

  const vehiculosFiltrados = vehiculos.filter(v => {
    if (!busquedaVeh) return true;
    const term = busquedaVeh.toLowerCase();
    return `${v.marca} ${v.linea} ${v.modelo} ${v.placas} ${v.numero_economico} ${v.color} ${v.tipo}`.toLowerCase().includes(term);
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehiculoSeleccionado) {
      toast.error('Seleccione un vehículo');
      return;
    }
    if (!formData.conductor_nombre || !formData.motivo) {
      toast.error('Nombre del conductor y motivo son obligatorios');
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        vehiculo_id: vehiculoSeleccionado.id,
        ...formData,
        km_salida: formData.km_salida ? parseInt(formData.km_salida) : null
      };
      const res = await api.post('/asignaciones', payload);
      toast.success(res.data.message || 'Salida registrada');
      toast(`📋 Folio: ${res.data.folio}`, { icon: '✅', duration: 6000 });
      navigate('/vehiculos/asignaciones');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar salida');
    }
    setEnviando(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => paso === 2 && !preselectedId ? setPaso(1) : navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-veracruz-600" />
            {paso === 1 ? 'Seleccionar Vehículo' : 'Registrar Salida de Vehículo'}
          </h1>
          <p className="text-gray-500 text-sm">
            {paso === 1 ? 'Elija el vehículo que va a salir' : 'Llene los datos de la persona y la salida'}
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="hidden md:flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            paso === 1 ? 'bg-veracruz-100 text-veracruz-700' : 'bg-green-100 text-green-700'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              paso >= 2 ? 'bg-green-600' : 'bg-veracruz-600'
            }`}>{paso >= 2 ? '✓' : '1'}</span>
            Vehículo
          </div>
          <div className="w-6 h-0.5 bg-gray-300" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            paso === 2 ? 'bg-veracruz-100 text-veracruz-700' : 'bg-gray-100 text-gray-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              paso === 2 ? 'bg-veracruz-600' : 'bg-gray-300'
            }`}>2</span>
            Datos Salida
          </div>
        </div>
      </div>

      {/* ====== PASO 1: Seleccionar Vehículo ====== */}
      {paso === 1 && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="🔍  Buscar vehículo por marca, placas, económico…"
                value={busquedaVeh}
                onChange={(e) => setBusquedaVeh(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 bg-gray-50"
              />
              {busquedaVeh && (
                <button onClick={() => setBusquedaVeh('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">{vehiculosFiltrados.length} vehículos disponibles</p>
          </div>

          {loadingVeh ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-veracruz-600"></div>
            </div>
          ) : (
            <div className="grid gap-3">
              {vehiculosFiltrados.slice(0, 50).map((v) => {
                const sel = vehiculoSeleccionado?.id === v.id;
                return (
                  <div key={v.id}
                    onClick={() => { setVehiculoSeleccionado(v); setPaso(2); }}
                    className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${
                      sel ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-veracruz-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl ${sel ? 'bg-green-100' : 'bg-gray-100'}`}>
                        🚗
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{v.marca} {v.linea || v.modelo}</span>
                          {v.anio && <span className="text-gray-500">({v.anio})</span>}
                          {v.tipo && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{v.tipo}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{v.placas || 'S/P'}</span>
                          {v.numero_economico && <span>Eco: {v.numero_economico}</span>}
                          {v.color && <span>{v.color}</span>}
                          {v.kilometraje > 0 && <span>{Number(v.kilometraje).toLocaleString()} km</span>}
                        </div>
                      </div>
                      <ArrowRightIcon className="h-5 w-5 text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ====== PASO 2: Formulario de Salida ====== */}
      {paso === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehículo seleccionado */}
          {vehiculoSeleccionado && (
            <div className="bg-gradient-to-r from-veracruz-50 to-blue-50 rounded-xl border-2 border-veracruz-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-veracruz-100 flex items-center justify-center text-xl">🚗</div>
                  <div>
                    <p className="font-bold text-gray-900">{vehiculoSeleccionado.marca} {vehiculoSeleccionado.linea || vehiculoSeleccionado.modelo} <span className="text-gray-500 font-normal">({vehiculoSeleccionado.anio})</span></p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-mono bg-white px-2 py-0.5 rounded border text-xs">{vehiculoSeleccionado.placas || 'S/P'}</span>
                      {vehiculoSeleccionado.color && <span>{vehiculoSeleccionado.color}</span>}
                      {vehiculoSeleccionado.kilometraje > 0 && <span>{Number(vehiculoSeleccionado.kilometraje).toLocaleString()} km</span>}
                    </div>
                  </div>
                </div>
                {!preselectedId && (
                  <button type="button" onClick={() => setPaso(1)} className="text-sm text-veracruz-600 hover:text-veracruz-800 font-medium">
                    Cambiar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Datos del conductor */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-veracruz-600" />
              Persona Asignada
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo del conductor *</label>
                <input type="text" name="conductor_nombre" value={formData.conductor_nombre} onChange={handleChange}
                  placeholder="Nombre de la persona a quien se asigna el vehículo"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                <input type="text" name="conductor_cargo" value={formData.conductor_cargo} onChange={handleChange}
                  placeholder="Ej: Director, Coordinador, Chofer..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                <input type="tel" name="conductor_telefono" value={formData.conductor_telefono} onChange={handleChange}
                  placeholder="228 000 0000"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" name="conductor_email" value={formData.conductor_email} onChange={handleChange}
                  placeholder="correo@veracruz.gob.mx"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">N° Licencia de conducir</label>
                <input type="text" name="conductor_licencia" value={formData.conductor_licencia} onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
              </div>
            </div>
          </div>

          {/* Datos de la salida */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRightIcon className="h-5 w-5 text-amber-600" />
              Datos de Salida
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motivo de la salida *</label>
                <textarea name="motivo" value={formData.motivo} onChange={handleChange}
                  rows={2} placeholder="¿Para qué se asigna el vehículo?"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <MapPinIcon className="h-4 w-4 inline mr-1" /> Destino
                </label>
                <input type="text" name="destino" value={formData.destino} onChange={handleChange}
                  placeholder="Ej: Xalapa, Veracruz Puerto, Coatzacoalcos..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <ClockIcon className="h-4 w-4 inline mr-1" /> Fecha de Salida *
                  </label>
                  <input type="date" name="fecha_salida" value={formData.fecha_salida} onChange={handleChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora de Salida</label>
                  <input type="time" name="hora_salida" value={formData.hora_salida} onChange={handleChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kilometraje de Salida</label>
                  <input type="number" name="km_salida" value={formData.km_salida} onChange={handleChange}
                    placeholder={vehiculoSeleccionado?.kilometraje ? `Último: ${Number(vehiculoSeleccionado.kilometraje).toLocaleString()} km` : 'Km actual'}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nivel de Combustible</label>
                  <select name="combustible_salida" value={formData.combustible_salida} onChange={handleChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500 bg-white">
                    <option value="">— Seleccionar —</option>
                    <option value="Lleno">⛽ Lleno</option>
                    <option value="3/4">⛽ 3/4</option>
                    <option value="1/2">⛽ 1/2</option>
                    <option value="1/4">⛽ 1/4</option>
                    <option value="Vacío">⛽ Vacío</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                <textarea name="observaciones_salida" value={formData.observaciones_salida} onChange={handleChange}
                  rows={2} placeholder="Información adicional, condiciones del vehículo al salir..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-veracruz-500 focus:border-veracruz-500" />
              </div>
            </div>
          </div>

          {/* Resumen y enviar */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
            <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-500">Vehículo</p>
                <p className="font-bold text-gray-900">{vehiculoSeleccionado?.marca} {vehiculoSeleccionado?.linea || vehiculoSeleccionado?.modelo} ({vehiculoSeleccionado?.placas || 'S/P'})</p>
              </div>
              <div>
                <p className="text-gray-500">Asignado a</p>
                <p className="font-bold text-gray-900">{formData.conductor_nombre || '---'}</p>
              </div>
              <div>
                <p className="text-gray-500">Salida</p>
                <p className="font-bold text-gray-900">{formData.fecha_salida} {formData.hora_salida}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-amber-200 pt-4">
              <p className="text-xs text-gray-500">Se registrará la salida y se generará un folio de control</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => navigate('/vehiculos/asignaciones')}
                  className="px-4 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                  Cancelar
                </button>
                <button type="submit" disabled={enviando || !formData.conductor_nombre || !formData.motivo}
                  className="px-6 py-2.5 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 disabled:opacity-50 font-medium flex items-center gap-2">
                  {enviando ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Registrando...</>
                  ) : (
                    <><CheckCircleIcon className="h-5 w-5" /> Registrar Salida</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
