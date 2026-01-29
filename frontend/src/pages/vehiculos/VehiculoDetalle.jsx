import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  PencilIcon,
  TruckIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  FireIcon,
  BoltIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import SelectModerno from '../../components/ui/SelectModerno';

export default function VehiculoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [vehiculo, setVehiculo] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});
  const [secretarias, setSecretarias] = useState([]);

  useEffect(() => { 
    cargarVehiculo(); 
    cargarSecretarias();
  }, [id]);

  const cargarSecretarias = async () => {
    try {
      const response = await api.get('/secretarias');
      setSecretarias(response.data);
    } catch (error) {
      console.error('Error cargando secretarías:', error);
    }
  };

  const cargarVehiculo = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vehiculos/${id}`);
      setVehiculo(res.data.vehiculo);
      setMovimientos(res.data.movimientos || []);
      setFormData(res.data.vehiculo || {});
    } catch {
      toast.error('Vehículo no encontrado');
      navigate('/vehiculos');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarCambios = async () => {
    try {
      await api.put(`/vehiculos/${id}`, formData);
      toast.success('Vehículo actualizado');
      setEditando(false);
      cargarVehiculo();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  const cambiarEstado = async (nuevoEstado) => {
    try {
      await api.put(`/vehiculos/${id}`, { estado_operativo: nuevoEstado });
      toast.success('Estado actualizado');
      cargarVehiculo();
    } catch { toast.error('Error al cambiar estado'); }
  };

  const proponerParaBaja = async () => {
    if (!confirm('¿Dictaminar este vehículo para baja?')) return;
    try {
      await api.put(`/vehiculos/${id}`, { propuesto_baja: 1, fecha_propuesta_baja: new Date().toISOString().split('T')[0] });
      toast.success('Dictaminado para baja');
      cargarVehiculo();
    } catch { toast.error('Error'); }
  };

  const quitarPropuestaBaja = async () => {
    try {
      await api.put(`/vehiculos/${id}`, { propuesto_baja: 0, fecha_propuesta_baja: null });
      toast.success('Dictamen removido');
      cargarVehiculo();
    } catch { toast.error('Error'); }
  };

  // Mapeo de meses en español
  const mesesES = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
    'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
  };

  const getSeguroEstado = (vigencia) => {
    if (!vigencia || vigencia === 'N/A' || vigencia === 'NO APLICA' || vigencia === 'SIN DATO') {
      return { label: 'No Aplica', clase: 'text-gray-500' };
    }
    let fecha;
    const clean = vigencia.toString().trim();
    
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('/');
      fecha = new Date(+y, +m - 1, +d);
    } 
    // Formato ISO YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      fecha = new Date(clean);
    }
    // Formato español: "31 DE AGOSTO 2026"
    else {
      const matchES = clean.match(/^(\d{1,2})\s+DE\s+(\w+)\s+(?:DE\s+)?(\d{4})$/i);
      if (matchES) {
        const dia = parseInt(matchES[1]);
        const mesNombre = matchES[2].toLowerCase();
        const anio = parseInt(matchES[3]);
        const mes = mesesES[mesNombre];
        if (mes !== undefined) {
          fecha = new Date(anio, mes, dia);
        }
      }
    }
    
    if (!fecha || isNaN(fecha)) return { label: 'Sin info', clase: 'text-gray-500' };
    const hoy = new Date();
    const en30 = new Date(); en30.setDate(hoy.getDate() + 30);
    if (fecha < hoy) return { label: 'Vencido', clase: 'text-red-600 font-semibold' };
    if (fecha <= en30) return { label: 'Por vencer', clase: 'text-yellow-600 font-semibold' };
    return { label: 'Vigente', clase: 'text-green-600 font-semibold' };
  };

  const puedeEditar = ['usuario_principal', 'admin', 'responsable_flota', 'admin_secretaria'].includes(user?.rol);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-red-600 rounded-full" /></div>;

  const seguro = getSeguroEstado(vehiculo.vigencia_seguro);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Navegación */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Volver</span>
        </button>
        {puedeEditar && (
          <button 
            onClick={() => setEditando(!editando)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${editando ? 'bg-gray-100 text-gray-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            <PencilIcon className="h-4 w-4" />
            {editando ? 'Cancelar' : 'Editar'}
          </button>
        )}
      </div>

      {editando ? (
        /* ========== MODO EDICIÓN - Igual que VehiculoNuevo ========== */
        <div className="space-y-6">
          {/* Identificación */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Identificación</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Inventario *</label>
                <input type="text" name="numero_inventario" value={formData.numero_inventario || ''} onChange={handleChange} className="input-field" placeholder="VER-2024-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placas *</label>
                <input type="text" name="placas" value={formData.placas || ''} onChange={handleChange} className="input-field" placeholder="ABC-123-A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Serie</label>
                <input type="text" name="numero_serie" value={formData.numero_serie || ''} onChange={handleChange} className="input-field" placeholder="VIN" />
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Características del Vehículo</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                <input type="text" name="marca" value={formData.marca || ''} onChange={handleChange} className="input-field" placeholder="Toyota" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Línea *</label>
                <input type="text" name="linea" value={formData.linea || formData.modelo || ''} onChange={handleChange} className="input-field" placeholder="Hilux" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo (Año) *</label>
                <input type="number" name="anio" value={formData.anio || ''} onChange={handleChange} className="input-field" placeholder="2024" min="1990" max="2030" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input type="text" name="color" value={formData.color || ''} onChange={handleChange} className="input-field" placeholder="Blanco" />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <SelectModerno
                  name="tipo"
                  value={formData.tipo || ''}
                  onChange={handleChange}
                  icon={TruckIcon}
                  groupedOptions={[
                    {
                      label: 'Vehículos Terrestres',
                      options: [
                        { value: 'sedan', label: 'Sedán', icon: TruckIcon },
                        { value: 'suv', label: 'SUV', icon: TruckIcon },
                        { value: 'camioneta', label: 'Camioneta', icon: TruckIcon },
                        { value: 'pick_up', label: 'Pick-up', icon: TruckIcon },
                        { value: 'van', label: 'Van / Minivan', icon: TruckIcon },
                        { value: 'autobus', label: 'Autobús', icon: TruckIcon },
                        { value: 'motocicleta', label: 'Motocicleta', icon: TruckIcon },
                      ]
                    },
                    {
                      label: 'Vehículos de Emergencia',
                      options: [
                        { value: 'ambulancia', label: 'Ambulancia', icon: ExclamationTriangleIcon },
                        { value: 'patrulla', label: 'Patrulla', icon: ExclamationTriangleIcon },
                        { value: 'bomberos', label: 'Camión de Bomberos', icon: FireIcon },
                        { value: 'grua', label: 'Grúa', icon: WrenchScrewdriverIcon },
                      ]
                    },
                    {
                      label: 'Maquinaria y Carga',
                      options: [
                        { value: 'camion_carga', label: 'Camión de Carga', icon: TruckIcon },
                        { value: 'volteo', label: 'Volteo', icon: TruckIcon },
                        { value: 'pipa', label: 'Pipa', icon: TruckIcon },
                        { value: 'maquinaria', label: 'Maquinaria', icon: WrenchScrewdriverIcon },
                      ]
                    },
                    {
                      label: 'Otros',
                      options: [
                        { value: 'otro', label: 'Otro', icon: DocumentTextIcon },
                      ]
                    }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                <input type="number" name="capacidad_pasajeros" value={formData.capacidad_pasajeros || ''} onChange={handleChange} className="input-field" min="1" max="60" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Combustible</label>
                <SelectModerno
                  name="tipo_combustible"
                  value={formData.tipo_combustible || ''}
                  onChange={handleChange}
                  icon={FireIcon}
                  options={[
                    { value: 'gasolina', label: 'Gasolina', icon: FireIcon },
                    { value: 'diesel', label: 'Diésel', icon: FireIcon },
                    { value: 'electrico', label: 'Eléctrico', icon: BoltIcon },
                    { value: 'hibrido', label: 'Híbrido', icon: BoltIcon },
                    { value: 'gas', label: 'Gas LP', icon: FireIcon },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Motor</label>
                <input type="text" name="numero_motor" value={formData.numero_motor || ''} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>

          {/* Asignación */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Asignación y Ubicación</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secretaría *</label>
                <SelectModerno
                  name="secretaria_id"
                  value={formData.secretaria_id?.toString() || ''}
                  onChange={handleChange}
                  icon={BuildingOfficeIcon}
                  placeholder="Seleccionar secretaría..."
                  options={secretarias.map(s => ({
                    value: s.id.toString(),
                    label: `${s.siglas} - ${s.nombre}`,
                    icon: BuildingOfficeIcon
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Régimen *</label>
                <SelectModerno
                  name="regimen"
                  value={formData.regimen || ''}
                  onChange={handleChange}
                  icon={DocumentTextIcon}
                  options={[
                    { value: 'Propio', label: 'Propio', icon: CheckCircleIcon },
                    { value: 'Arrendado', label: 'Arrendado', icon: CurrencyDollarIcon },
                    { value: 'Comodato', label: 'Comodato', icon: DocumentTextIcon },
                  ]}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                <input type="text" name="municipio" value={formData.municipio || ''} onChange={handleChange} className="input-field" placeholder="Xalapa" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación Física</label>
                <input type="text" name="ubicacion_fisica" value={formData.ubicacion_fisica || ''} onChange={handleChange} className="input-field" placeholder="Palacio de Gobierno" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado Operativo *</label>
                <SelectModerno
                  name="estado_operativo"
                  value={formData.estado_operativo || ''}
                  onChange={handleChange}
                  icon={CheckCircleIcon}
                  options={[
                    { value: 'Operando', label: 'Operando', icon: CheckCircleIcon },
                    { value: 'Disponible', label: 'Disponible', icon: DocumentPlusIcon },
                    { value: 'En taller', label: 'En Taller', icon: WrenchScrewdriverIcon },
                    { value: 'Mal estado', label: 'Mal Estado', icon: ExclamationTriangleIcon },
                    { value: 'Baja', label: 'Baja', icon: XCircleIcon },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Resguardatario */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Resguardatario</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" name="resguardante_nombre" value={formData.resguardante_nombre || ''} onChange={handleChange} className="input-field" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input type="text" name="resguardante_cargo" value={formData.resguardante_cargo || ''} onChange={handleChange} className="input-field" placeholder="Director de..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" name="resguardante_telefono" value={formData.resguardante_telefono || ''} onChange={handleChange} className="input-field" placeholder="228-123-4567" />
              </div>
            </div>
          </div>

          {/* Préstamo a otra Secretaría */}
          <div className="card border-2 border-amber-200 bg-amber-50/30">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="esta_prestado_edit"
                checked={formData.esta_prestado || false}
                onChange={(e) => setFormData(prev => ({ ...prev, esta_prestado: e.target.checked }))}
                className="h-5 w-5 text-amber-600 rounded focus:ring-amber-500"
              />
              <label htmlFor="esta_prestado_edit" className="font-semibold text-gray-900 cursor-pointer">
                Este vehículo está prestado a otra Secretaría
              </label>
            </div>
            
            {formData.esta_prestado && (
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-amber-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secretaría que lo tiene *
                  </label>
                  <SelectModerno
                    name="prestado_a_secretaria_id"
                    value={formData.prestado_a_secretaria_id?.toString() || ''}
                    onChange={handleChange}
                    icon={BuildingOfficeIcon}
                    placeholder="Seleccionar secretaría..."
                    options={secretarias
                      .filter(s => s.id != formData.secretaria_id)
                      .map(s => ({
                        value: s.id.toString(),
                        label: `${s.siglas} - ${s.nombre}`,
                        icon: BuildingOfficeIcon
                      }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La secretaría que actualmente tiene el vehículo
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Préstamo
                  </label>
                  <input
                    type="date"
                    name="prestamo_fecha_inicio"
                    value={formData.prestamo_fecha_inicio || ''}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo del Préstamo
                  </label>
                  <input
                    type="text"
                    name="prestamo_motivo"
                    value={formData.prestamo_motivo || ''}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ej: Apoyo en operativo, evento especial, etc."
                  />
                </div>
              </div>
            )}
            
            {!formData.esta_prestado && (
              <p className="text-sm text-gray-500">
                Marca esta opción si el vehículo pertenece a una secretaría pero actualmente está prestado a otra.
                El préstamo se registrará automáticamente en el sistema.
              </p>
            )}
          </div>

          {/* Información adicional */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Información Adicional</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Adquisición</label>
                <input type="date" name="fecha_adquisicion" value={formData.fecha_adquisicion || ''} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor en Libros</label>
                <input type="number" name="valor_libros" value={formData.valor_libros || ''} onChange={handleChange} className="input-field" placeholder="0.00" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilometraje</label>
                <input type="number" name="kilometraje" value={formData.kilometraje || ''} onChange={handleChange} className="input-field" placeholder="0" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aseguradora</label>
                <input type="text" name="seguro" value={formData.seguro || ''} onChange={handleChange} className="input-field" placeholder="Nombre de aseguradora" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Póliza</label>
                <input type="text" name="poliza_seguro" value={formData.poliza_seguro || ''} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia Póliza</label>
                <input type="text" name="vigencia_seguro" value={formData.vigencia_seguro || ''} onChange={handleChange} className="input-field" placeholder="DD/MM/YYYY" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea name="observaciones" value={formData.observaciones || ''} onChange={handleChange} className="input-field" rows={3} placeholder="Observaciones adicionales..." />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => { setEditando(false); setFormData(vehiculo); }} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={guardarCambios} className="btn-primary">Guardar Cambios</button>
          </div>
        </div>
      ) : (
        /* ========== MODO VISTA - 62 Variables del Padrón Vehicular ========== */
        <div className="space-y-6">
          {/* Acciones rápidas */}
          {puedeEditar && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => cambiarEstado('Disponible')} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">Marcar Disponible</button>
              <button onClick={() => cambiarEstado('En taller')} className="px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100">Enviar a Taller</button>
              {!vehiculo.propuesto_baja ? (
                <button onClick={proponerParaBaja} className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Proponer Baja</button>
              ) : (
                <button onClick={quitarPropuestaBaja} className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">Quitar propuesta</button>
              )}
            </div>
          )}

          {/* 1. IDENTIFICACIÓN */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">1. Identificación</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="N° Inventario" value={vehiculo.numero_inventario} highlight />
                <Row label="N° Económico" value={vehiculo.numero_economico} />
                <Row label="Placas" value={vehiculo.placas} highlight />
                <Row label="No. Serie (VIN)" value={vehiculo.numero_serie} />
                <Row label="No. Motor" value={vehiculo.numero_motor} />
              </tbody>
            </table>
          </div>

          {/* 2. CARACTERÍSTICAS DEL VEHÍCULO */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">2. Características del Vehículo</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Marca" value={vehiculo.marca} />
                <Row label="Línea" value={vehiculo.linea || vehiculo.modelo} />
                <Row label="Modelo (Año)" value={vehiculo.anio} />
                <Row label="Color" value={vehiculo.color} />
                <Row label="Tipo de Vehículo" value={vehiculo.tipo} />
                <Row label="Capacidad Pasajeros" value={vehiculo.capacidad_pasajeros} />
                <Row label="Tipo Combustible" value={vehiculo.tipo_combustible} />
                <Row label="Cilindraje" value={vehiculo.cilindraje} />
                <Row label="Cilindros" value={vehiculo.cilindros} />
                <Row label="Transmisión" value={vehiculo.transmision} />
              </tbody>
            </table>
          </div>

          {/* 3. ASIGNACIÓN */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">3. Asignación</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Dependencia" value={vehiculo.secretaria_siglas ? `${vehiculo.secretaria_siglas} - ${vehiculo.secretaria_nombre}` : '-'} />
                <Row label="Asignación Actual" value={vehiculo.asignacion_actual} />
                <Row label="Uso" value={vehiculo.uso} />
                <Row label="Área Responsable" value={vehiculo.area_responsable} />
                <Row label="Teléfono del Área" value={vehiculo.telefono_area} />
                <Row label="Quien Reporta" value={vehiculo.quien_reporta} />
              </tbody>
            </table>
          </div>

          {/* 4. ADQUISICIÓN */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">4. Adquisición</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Forma de Adquisición" value={vehiculo.forma_adquisicion} />
                <Row label="Régimen" value={vehiculo.regimen} />
                <Row label="Fecha de Adquisición" value={vehiculo.fecha_adquisicion ? new Date(vehiculo.fecha_adquisicion).toLocaleDateString('es-MX') : '-'} />
                <Row label="Proveedor de la Unidad" value={vehiculo.proveedor_unidad || vehiculo.proveedor_arrendadora} />
                <Row label="Valor de la Unidad" value={vehiculo.valor_factura ? `$${Number(vehiculo.valor_factura).toLocaleString()}` : '-'} />
                <Row label="Contrato de Adquisición" value={vehiculo.contrato} />
                <Row label="Valor del Contrato" value={vehiculo.valor_contrato ? `$${Number(vehiculo.valor_contrato).toLocaleString()}` : '-'} />
                <Row label="Factura Original" value={vehiculo.factura_original} />
                <Row label="Valor en Libros" value={vehiculo.valor_libros ? `$${Number(vehiculo.valor_libros).toLocaleString()}` : '-'} />
                <Row label="Valor de Mercado" value={vehiculo.valor_mercado ? `$${Number(vehiculo.valor_mercado).toLocaleString()}` : '-'} />
                <Row label="CFDI" value={vehiculo.cfdi} />
              </tbody>
            </table>
          </div>

          {/* 5. DOCUMENTACIÓN / PLACAS */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">5. Documentación y Placas</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Tipo de Placas" value={vehiculo.tipo_placas} />
                <Row label="Fecha Expedición Placas" value={vehiculo.fecha_expedicion_placas} />
                <Row label="Tarjeta de Circulación" value={vehiculo.tarjeta_circulacion} />
                <Row label="Vigencia Tarjeta" value={vehiculo.vigencia_tarjeta} />
                <Row label="Verificación Vehicular" value={vehiculo.verificacion_vehicular} />
                <Row label="Vigencia Verificación" value={vehiculo.vigencia_verificacion} />
                <Row label="Acta Entrega-Recepción" value={vehiculo.acta_entrega_recepcion} />
                <Row label="Resguardo Vehicular" value={vehiculo.resguardo_vehicular} />
                <Row label="Comprobante Reemplacamiento" value={vehiculo.comprobante_reemplacamiento} />
                <Row label="Pago Derechos Vehiculares" value={vehiculo.pago_derechos} />
              </tbody>
            </table>
          </div>

          {/* 6. INVENTARIO */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">6. Inventario</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Inventario Patrimonial" value={vehiculo.inventario_patrimonial} />
                <Row label="Fecha Alta en Inventario" value={vehiculo.fecha_alta_inventario} />
                <Row label="Bitácora de Mantenimiento" value={vehiculo.bitacora_mantenimiento} />
              </tbody>
            </table>
          </div>

          {/* 7. ESTATUS */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">7. Estatus</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Estatus Operativo" value={vehiculo.estatus_operativo || vehiculo.estado_operativo} valueClass={
                  (vehiculo.estatus_operativo || vehiculo.estado_operativo)?.toLowerCase().includes('operando') ? 'text-green-600 font-semibold' :
                  (vehiculo.estatus_operativo || vehiculo.estado_operativo)?.toLowerCase().includes('mantenimiento') ? 'text-yellow-600 font-semibold' :
                  (vehiculo.estatus_operativo || vehiculo.estado_operativo)?.toLowerCase().includes('fuera') ? 'text-red-600 font-semibold' : ''
                } />
                <Row label="Estatus Administrativo" value={vehiculo.estatus_administrativo} valueClass={
                  vehiculo.estatus_administrativo === 'Activo' ? 'text-green-600 font-semibold' :
                  vehiculo.estatus_administrativo === 'Baja' ? 'text-red-600 font-semibold' : 'text-yellow-600 font-semibold'
                } />
                <Row label="Condición" value={vehiculo.estatus} valueClass={
                  vehiculo.estatus === 'Bueno' ? 'text-green-600' :
                  vehiculo.estatus === 'Malo' ? 'text-red-600' : 'text-yellow-600'
                } />
                <Row label="En Uso" value={vehiculo.en_uso ? 'Sí' : 'No'} />
                <Row label="Propuesto para Baja" value={vehiculo.propuesto_baja ? 'Sí' : 'No'} valueClass={vehiculo.propuesto_baja ? 'text-red-600 font-semibold' : ''} />
                {vehiculo.fecha_propuesta_baja && <Row label="Fecha Propuesta Baja" value={vehiculo.fecha_propuesta_baja} />}
                {vehiculo.motivo_propuesta_baja && <Row label="Motivo Propuesta Baja" value={vehiculo.motivo_propuesta_baja} />}
              </tbody>
            </table>
          </div>

          {/* 8. UBICACIÓN */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">8. Ubicación</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Municipio" value={vehiculo.municipio} />
                <Row label="Ubicación Física" value={vehiculo.ubicacion_fisica} />
                <Row label="Ubicación Específica" value={vehiculo.ubicacion_especifica || vehiculo.direccion_ubicacion} />
                <Row label="Dirección Completa" value={vehiculo.direccion_completa} />
                {vehiculo.latitud && vehiculo.longitud && (
                  <Row label="Coordenadas" value={`${vehiculo.latitud}, ${vehiculo.longitud}`} />
                )}
              </tbody>
            </table>
          </div>

          {/* 9. RESGUARDATARIO */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">9. Resguardatario</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Nombre" value={vehiculo.resguardante_nombre} />
                <Row label="Cargo" value={vehiculo.resguardante_cargo} />
                <Row label="Teléfono" value={vehiculo.resguardante_telefono} />
                <Row label="Email" value={vehiculo.resguardante_email} />
              </tbody>
            </table>
          </div>

          {/* 10. SEGURO */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">10. Seguro</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Estado del Seguro" value={seguro.label} valueClass={seguro.clase} />
                <Row label="Aseguradora" value={vehiculo.aseguradora || vehiculo.seguro} />
                <Row label="No. Póliza" value={vehiculo.poliza_seguro} />
                <Row label="Vigencia del Seguro" value={vehiculo.vigencia_seguro} />
              </tbody>
            </table>
            {vehiculo.poliza_seguro && vehiculo.poliza_seguro !== 'SIN POLIZA' && vehiculo.poliza_seguro !== 'SIN DATO' && (
              <div className="mx-4 mb-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                <span className="font-semibold">Póliza registrada:</span> Este vehículo cuenta con número de póliza asignado.
              </div>
            )}
            {seguro.label === 'Vencido' && (
              <div className="mx-4 mb-4 p-3 bg-red-50 rounded-lg text-xs text-red-700">
                <span className="font-semibold">Atención:</span> La póliza de seguro está vencida. Se requiere renovación.
              </div>
            )}
          </div>

          {/* 11. MANTENIMIENTO Y CONDICIÓN */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">11. Mantenimiento y Condición</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Kilometraje Actual" value={vehiculo.kilometraje ? `${Number(vehiculo.kilometraje).toLocaleString()} km` : '-'} />
                <Row label="Último Servicio" value={vehiculo.ultimo_servicio || vehiculo.fecha_ultimo_servicio} />
                <Row label="% Motor" value={vehiculo.porcentaje_motor ? `${vehiculo.porcentaje_motor}%` : '-'} />
                <Row label="% Transmisión" value={vehiculo.porcentaje_transmision ? `${vehiculo.porcentaje_transmision}%` : '-'} />
                <Row label="% Chasis" value={vehiculo.porcentaje_chasis ? `${vehiculo.porcentaje_chasis}%` : '-'} />
                <Row label="Consumo Combustible" value={vehiculo.consumo_combustible ? `${vehiculo.consumo_combustible} L/100km` : '-'} />
                <Row label="Costo Anual Mantenimiento" value={vehiculo.costo_mantenimiento_anual ? `$${Number(vehiculo.costo_mantenimiento_anual).toLocaleString()}` : '-'} />
                <Row label="Proveedor Mantenimiento" value={vehiculo.proveedor_mantenimiento} />
                {vehiculo.desglose_mantenimiento && <Row label="Desglose Mantenimiento" value={vehiculo.desglose_mantenimiento} />}
                {vehiculo.observaciones_tecnicas && <Row label="Observaciones Técnicas" value={vehiculo.observaciones_tecnicas} />}
              </tbody>
            </table>
          </div>

          {/* 11.1 MECÁNICO */}
          {(vehiculo.costo_anual_mecanico || vehiculo.frecuencia_mecanico || vehiculo.proveedor_mecanico) && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="text-sm font-semibold text-gray-600">11.1 Servicio Mecánico</h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  <Row label="Costo Anual Mecánico" value={vehiculo.costo_anual_mecanico ? `$${Number(vehiculo.costo_anual_mecanico).toLocaleString()}` : '-'} />
                  <Row label="Frecuencia (veces/año)" value={vehiculo.frecuencia_mecanico} />
                  <Row label="Proveedor Mecánico" value={vehiculo.proveedor_mecanico} />
                  {vehiculo.desglose_mecanico && <Row label="Desglose Mecánico" value={vehiculo.desglose_mecanico} />}
                </tbody>
              </table>
            </div>
          )}

          {/* 11.2 ELÉCTRICO */}
          {(vehiculo.costo_anual_electrico || vehiculo.frecuencia_electrico || vehiculo.proveedor_electrico) && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="text-sm font-semibold text-gray-600">11.2 Servicio Eléctrico</h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  <Row label="Costo Anual Eléctrico" value={vehiculo.costo_anual_electrico ? `$${Number(vehiculo.costo_anual_electrico).toLocaleString()}` : '-'} />
                  <Row label="Frecuencia (veces/año)" value={vehiculo.frecuencia_electrico} />
                  <Row label="Proveedor Eléctrico" value={vehiculo.proveedor_electrico} />
                  {vehiculo.desglose_electrico && <Row label="Desglose Eléctrico" value={vehiculo.desglose_electrico} />}
                </tbody>
              </table>
            </div>
          )}

          {/* 12. EVIDENCIA Y OBSERVACIONES */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-600">12. Evidencia y Observaciones</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Evidencia Fotográfica" value={vehiculo.evidencia_fotografica} />
                <Row label="Situación Jurídica" value={vehiculo.situacion_juridica} />
              </tbody>
            </table>
            {vehiculo.observaciones && (
              <div className="p-4 border-t">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Observaciones</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{vehiculo.observaciones}</p>
              </div>
            )}
            {vehiculo.descripcion_detallada && (
              <div className="p-4 border-t">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Información Adicional</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{vehiculo.descripcion_detallada}</p>
              </div>
            )}
          </div>

          {/* Historial */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Historial de Movimientos</h3>
            {movimientos.length === 0 ? (
              <p className="text-sm text-gray-400">Sin movimientos registrados</p>
            ) : (
              <div className="space-y-2">
                {movimientos.slice(0, 10).map(m => (
                  <div key={m.id} className="flex items-center gap-3 text-sm py-2 border-b border-gray-50">
                    <span className="text-gray-400 text-xs w-24">{new Date(m.fecha_movimiento).toLocaleDateString('es-MX')}</span>
                    <span className="font-medium text-gray-700">{m.tipo_movimiento}</span>
                    <span className="text-gray-500">{m.descripcion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight, valueClass = '' }) {
  return (
    <tr className="flex flex-col sm:table-row">
      <td className="py-2 sm:py-3 px-4 text-gray-500 text-sm font-medium sm:w-48">{label}</td>
      <td className={`pb-3 sm:py-3 px-4 text-gray-900 ${highlight ? 'font-bold text-lg' : ''} ${valueClass} break-words`}>{value || '-'}</td>
    </tr>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-veracruz-100 focus:border-veracruz-500 transition-all hover:border-veracruz-400 hover:shadow-md" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select 
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium bg-white cursor-pointer focus:ring-2 focus:ring-veracruz-100 focus:border-veracruz-500 transition-all hover:border-veracruz-400 hover:shadow-md appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '20px',
          paddingRight: '44px'
        }}
        value={value || ''} 
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Seleccionar</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
