import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function VehiculoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [vehiculo, setVehiculo] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => { cargarVehiculo(); }, [id]);

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
        /* ========== MODO EDICIÓN ========== */
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Editar Vehículo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <InputField label="Marca" value={formData.marca} onChange={v => setFormData({...formData, marca: v})} />
            <InputField label="Línea" value={formData.linea || formData.modelo} onChange={v => setFormData({...formData, linea: v, modelo: v})} />
            <InputField label="Año" value={formData.anio} onChange={v => setFormData({...formData, anio: v})} type="number" />
            <InputField label="Color" value={formData.color} onChange={v => setFormData({...formData, color: v})} />
            <InputField label="Placas" value={formData.placas} onChange={v => setFormData({...formData, placas: v})} />
            <InputField label="No. Serie" value={formData.numero_serie} onChange={v => setFormData({...formData, numero_serie: v})} />
            <InputField label="No. Motor" value={formData.numero_motor} onChange={v => setFormData({...formData, numero_motor: v})} />
            <InputField label="Capacidad Pasajeros" value={formData.capacidad_pasajeros} onChange={v => setFormData({...formData, capacidad_pasajeros: v})} type="number" />
            <SelectField label="Combustible" value={formData.tipo_combustible} onChange={v => setFormData({...formData, tipo_combustible: v})} options={['Gasolina', 'Diesel', 'Electrico', 'Hibrido', 'Gas']} />
            <InputField label="Cilindros" value={formData.cilindros} onChange={v => setFormData({...formData, cilindros: v})} type="number" />
            <SelectField label="Transmisión" value={formData.transmision} onChange={v => setFormData({...formData, transmision: v})} options={['Automatica', 'Manual']} />
            <SelectField label="Estado Operativo" value={formData.estado_operativo} onChange={v => setFormData({...formData, estado_operativo: v})} options={['Operando', 'Disponible', 'En taller', 'Mal estado', 'Baja']} />
            <SelectField label="Condición" value={formData.estatus} onChange={v => setFormData({...formData, estatus: v})} options={['Bueno', 'Regular', 'Malo']} />
            <InputField label="Kilometraje" value={formData.kilometraje} onChange={v => setFormData({...formData, kilometraje: v})} type="number" />
            <InputField label="Municipio" value={formData.municipio} onChange={v => setFormData({...formData, municipio: v})} />
            <InputField label="Ubicación Física" value={formData.ubicacion_fisica} onChange={v => setFormData({...formData, ubicacion_fisica: v})} />
            <InputField label="Área Responsable" value={formData.area_responsable} onChange={v => setFormData({...formData, area_responsable: v})} />
            <InputField label="Póliza Seguro" value={formData.poliza_seguro} onChange={v => setFormData({...formData, poliza_seguro: v})} />
            <InputField label="Vigencia Seguro" value={formData.vigencia_seguro} onChange={v => setFormData({...formData, vigencia_seguro: v})} placeholder="DD/MM/YYYY" />
            <InputField label="Resguardante" value={formData.resguardante_nombre} onChange={v => setFormData({...formData, resguardante_nombre: v})} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} value={formData.observaciones || ''} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={() => { setEditando(false); setFormData(vehiculo); }} className="px-5 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={guardarCambios} className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Guardar</button>
          </div>
        </div>
      ) : (
        /* ========== MODO VISTA ========== */
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

          {/* Grid principal */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Marca / Línea" value={`${vehiculo.marca} ${vehiculo.linea || vehiculo.modelo} ${vehiculo.anio || ''}`} />
                <Row label="Placas" value={vehiculo.placas} highlight />
                <Row label="No. Económico" value={vehiculo.numero_economico} />
                <Row label="No. Inventario" value={vehiculo.numero_inventario} />
                <Row label="No. Serie" value={vehiculo.numero_serie} />
                <Row label="No. Motor" value={vehiculo.numero_motor} />
                <Row label="Color" value={vehiculo.color} />
                <Row label="Tipo" value={vehiculo.tipo} />
                <Row label="Capacidad Pasajeros" value={vehiculo.capacidad_pasajeros} />
                <Row label="Combustible" value={vehiculo.tipo_combustible} />
                <Row label="Cilindros" value={vehiculo.cilindros} />
                <Row label="Transmisión" value={vehiculo.transmision} />
                <Row label="Régimen" value={vehiculo.regimen} />
                <Row label="Kilometraje" value={vehiculo.kilometraje ? `${Number(vehiculo.kilometraje).toLocaleString()} km` : '-'} />
                <Row label="Estado Operativo" value={vehiculo.estado_operativo} valueClass={
                  vehiculo.estado_operativo?.toLowerCase().includes('operando') ? 'text-green-600 font-semibold' :
                  vehiculo.estado_operativo?.toLowerCase().includes('mal') ? 'text-orange-600 font-semibold' :
                  vehiculo.estado_operativo?.toLowerCase().includes('baja') ? 'text-red-600 font-semibold' : ''
                } />
                <Row label="Condición" value={vehiculo.estatus} valueClass={
                  vehiculo.estatus === 'Bueno' ? 'text-green-600' :
                  vehiculo.estatus === 'Malo' ? 'text-red-600' : 'text-yellow-600'
                } />
                <Row label="En Uso" value={vehiculo.en_uso ? 'Sí' : 'No'} />
                <Row label="Municipio" value={vehiculo.municipio} />
                <Row label="Ubicación Física" value={vehiculo.ubicacion_fisica} />
                <Row label="Área Responsable" value={vehiculo.area_responsable} />
                <Row label="Situación Jurídica" value={vehiculo.situacion_juridica?.replace(/\n/g, ' - ')} />
              </tbody>
            </table>
          </div>

          {/* Seguro y Financiero */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Seguro</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  <Row label="Estado" value={seguro.label} valueClass={seguro.clase} />
                  <Row 
                    label="No. Póliza" 
                    value={(() => {
                      // Extraer solo el número de póliza (primera línea antes del salto de línea)
                      const poliza = vehiculo.poliza_seguro;
                      if (!poliza || poliza === 'SIN POLIZA' || poliza === 'SIN DATO') return 'Sin póliza';
                      const partes = poliza.split('\n');
                      return partes[0].trim();
                    })()} 
                    valueClass={
                      vehiculo.poliza_seguro && vehiculo.poliza_seguro !== 'SIN POLIZA' && vehiculo.poliza_seguro !== 'SIN DATO' 
                        ? 'font-mono font-semibold text-gray-900' 
                        : 'text-gray-400'
                    } 
                  />
                  <Row label="Vigencia" value={vehiculo.vigencia_seguro || 'Sin información'} />
                  <Row 
                    label="Aseguradora" 
                    value={(() => {
                      // Función para normalizar nombre de aseguradora
                      const normalizarAseguradora = (nombre) => {
                        if (!nombre) return null;
                        const upper = nombre.toUpperCase().trim();
                        // Si contiene variantes de "GENERAL" y "SEGURO", normalizamos
                        if ((upper.includes('GENERAL') || upper.includes('GENEAL') || upper.includes('GENEL')) && 
                            (upper.includes('SEGURO') || upper.includes('SERUGOS') || upper.includes('SEGUROSS') || upper.includes('SEGUIRO'))) {
                          return 'GENERAL DE SEGUROS, S.A.';
                        }
                        return upper;
                      };
                      
                      const poliza = vehiculo.poliza_seguro;
                      if (!poliza) return 'Sin información';
                      
                      // Si hay un salto de línea, la aseguradora está en la segunda parte
                      if (poliza.includes('\n')) {
                        const partes = poliza.split('\n');
                        if (partes[1] && partes[1].trim()) {
                          return normalizarAseguradora(partes[1]);
                        }
                      }
                      
                      // Buscar texto después del paréntesis
                      const matchParentesis = poliza.match(/\)\s*([A-Za-záéíóúñÁÉÍÓÚÑ\s,.]+)$/);
                      if (matchParentesis && matchParentesis[1] && matchParentesis[1].trim().length > 3) {
                        return normalizarAseguradora(matchParentesis[1]);
                      }
                      
                      return 'Sin información';
                    })()}
                    valueClass="font-semibold text-gray-900"
                  />
                </tbody>
              </table>
              {vehiculo.poliza_seguro && vehiculo.poliza_seguro !== 'SIN POLIZA' && vehiculo.poliza_seguro !== 'SIN DATO' && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                  <span className="font-semibold">Póliza registrada:</span> Este vehículo cuenta con número de póliza asignado.
                </div>
              )}
              {seguro.label === 'Vencido' && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-700">
                  <span className="font-semibold">⚠️ Atención:</span> La póliza de seguro está vencida. Se requiere renovación.
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Financiero</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  <Row label="Valor en Libros" value={vehiculo.valor_libros ? `$${Number(vehiculo.valor_libros).toLocaleString()}` : '-'} />
                  <Row label="Fecha Adquisición" value={vehiculo.fecha_adquisicion ? new Date(vehiculo.fecha_adquisicion).toLocaleDateString('es-MX') : '-'} />
                  <Row label="Proveedor" value={vehiculo.proveedor_arrendadora} />
                </tbody>
              </table>
            </div>
          </div>

          {/* Resguardante */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Resguardante</h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <Row label="Nombre" value={vehiculo.resguardante_nombre} />
                <Row label="Cargo" value={vehiculo.resguardante_cargo} />
                <Row label="Teléfono" value={vehiculo.resguardante_telefono} />
              </tbody>
            </table>
          </div>

          {/* Observaciones */}
          {vehiculo.observaciones && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Observaciones</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{vehiculo.observaciones}</p>
            </div>
          )}

          {vehiculo.descripcion_detallada && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Información Adicional</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{vehiculo.descripcion_detallada}</p>
            </div>
          )}

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
      <input type={type} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">Seleccionar</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
