import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, PencilIcon, TruckIcon, BuildingOfficeIcon,
  WrenchScrewdriverIcon, CheckCircleIcon, XCircleIcon, ClockIcon,
  DocumentTextIcon, CurrencyDollarIcon, FireIcon, BoltIcon,
  MapPinIcon, UserIcon, ShieldCheckIcon, CameraIcon, Cog6ToothIcon,
  ArchiveBoxIcon, DocumentCheckIcon, ClipboardDocumentListIcon,
  PhotoIcon, TrashIcon, CloudArrowUpIcon, ArrowRightIcon, ChevronDownIcon
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
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [fotos, setFotos] = useState([]);

  // === Asignaciones ===
  const [asignacionActiva, setAsignacionActiva] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [modalSalida, setModalSalida] = useState(false);
  const [modalEntrada, setModalEntrada] = useState(false);
  const [enviandoAsg, setEnviandoAsg] = useState(false);
  const hoy = new Date().toISOString().split('T')[0];
  const ahora = new Date().toTimeString().slice(0,5);
  const [salidaForm, setSalidaForm] = useState({ conductor_nombre:'', conductor_cargo:'', fecha_salida:hoy, hora_salida:ahora, km_salida:'', combustible_salida:'', destino:'', motivo:'' });
  const [entradaForm, setEntradaForm] = useState({ fecha_entrada:hoy, hora_entrada:ahora, km_entrada:'', combustible_entrada:'', estado_devolucion:'bueno', observaciones:'' });

  // === Bitácora ===
  const [bitacora, setBitacora] = useState([]);
  const [bitacoraStats, setBitacoraStats] = useState({});
  const [filtroBit, setFiltroBit] = useState('todos');
  const [modalCombustible, setModalCombustible] = useState(false);
  const [modalIncidencia, setModalIncidencia] = useState(false);
  const [enviandoBit, setEnviandoBit] = useState(false);
  const [combForm, setCombForm] = useState({ fecha:hoy, hora:ahora, litros:'', costo_total:'', tipo_combustible:'gasolina_regular', km_actual:'', estacion:'', conductor_nombre:'', cfdi:'', observaciones:'' });
  const [incForm, setIncForm] = useState({ fecha:hoy, hora:ahora, tipo:'choque', gravedad:'leve', descripcion:'', ubicacion:'', conductor_nombre:'', costo_estimado_danos:'', observaciones:'' });

  // Control de secciones colapsables
  const [seccionesAbiertas, setSeccionesAbiertas] = useState(null); // null = modo individual, 'all' = todas abiertas, 'none' = todas cerradas
  const [secAsignaciones, setSecAsignaciones] = useState(true);
  const [secBitacora, setSecBitacora] = useState(true);
  const toggleAll = () => setSeccionesAbiertas(prev => prev === 'all' ? 'none' : 'all');

  useEffect(() => { cargarVehiculo(); cargarSecretarias(); }, [id]);

  const cargarSecretarias = async () => {
    try { const r = await api.get('/secretarias'); setSecretarias(r.data); } catch {}
  };

  const cargarVehiculo = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vehiculos/${id}`);
      setVehiculo(res.data.vehiculo);
      setMovimientos(res.data.movimientos || []);
      setFormData(res.data.vehiculo || {});
      setAsignacionActiva(res.data.asignacion_activa || null);
      setAsignaciones(res.data.asignaciones || []);
      if (res.data.vehiculo?.evidencia_fotografica) {
        setFotos(res.data.vehiculo.evidencia_fotografica.split(',').map(u => u.trim()).filter(Boolean));
      }
    } catch { toast.error('Vehículo no encontrado'); navigate('/vehiculos'); }
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
    } catch (error) { toast.error(error.response?.data?.error || 'Error al guardar'); }
  };

  const cambiarEstado = async (nuevoEstado) => {
    try { await api.put(`/vehiculos/${id}`, { estado_operativo: nuevoEstado }); toast.success('Estado actualizado'); cargarVehiculo(); } catch { toast.error('Error'); }
  };

  const proponerParaBaja = async () => {
    if (!confirm('¿Dictaminar este vehículo para baja?')) return;
    try { await api.put(`/vehiculos/${id}`, { propuesto_baja: 1, fecha_propuesta_baja: new Date().toISOString().split('T')[0] }); toast.success('Dictaminado para baja'); cargarVehiculo(); } catch { toast.error('Error'); }
  };

  const quitarPropuestaBaja = async () => {
    try { await api.put(`/vehiculos/${id}`, { propuesto_baja: 0, fecha_propuesta_baja: null }); toast.success('Dictamen removido'); cargarVehiculo(); } catch { toast.error('Error'); }
  };

  const handleUploadFotos = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFotos(true);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) fd.append('fotos', files[i]);
    try {
      const r = await api.post('/vehiculos/upload-fotos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (r.data.urls) { const nf = [...fotos, ...r.data.urls]; setFotos(nf); setFormData(prev => ({ ...prev, evidencia_fotografica: nf.join(', ') })); toast.success(r.data.message); }
    } catch (err) { toast.error(err.response?.data?.error || 'Error al subir'); }
    finally { setUploadingFotos(false); e.target.value = ''; }
  };

  const handleRemoveFoto = (idx) => {
    const nf = fotos.filter((_, i) => i !== idx);
    setFotos(nf);
    setFormData(prev => ({ ...prev, evidencia_fotografica: nf.join(', ') }));
  };

  // === Funciones Asignación ===
  const puedeAsignar = ['usuario_principal','admin','responsable_flota','admin_secretaria','gobernacion'].includes(user?.rol);

  const abrirSalida = () => {
    const h = new Date().toISOString().split('T')[0];
    const a = new Date().toTimeString().slice(0,5);
    setSalidaForm({ conductor_nombre:'', conductor_cargo:'', fecha_salida:h, hora_salida:a, km_salida: vehiculo?.kilometraje || '', combustible_salida:'', destino:'', motivo:'' });
    setModalSalida(true);
  };

  const abrirEntrada = () => {
    const h = new Date().toISOString().split('T')[0];
    const a = new Date().toTimeString().slice(0,5);
    setEntradaForm({ fecha_entrada:h, hora_entrada:a, km_entrada:'', combustible_entrada:'', estado_devolucion:'bueno', observaciones:'' });
    setModalEntrada(true);
  };

  const registrarSalida = async () => {
    if (!salidaForm.conductor_nombre || !salidaForm.destino || !salidaForm.km_salida) { toast.error('Completa los campos obligatorios'); return; }
    setEnviandoAsg(true);
    try {
      await api.post('/asignaciones', { vehiculo_id: parseInt(id), ...salidaForm, km_salida: parseInt(salidaForm.km_salida) });
      toast.success('Salida registrada');
      setModalSalida(false);
      cargarVehiculo();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al registrar salida'); }
    setEnviandoAsg(false);
  };

  const registrarEntrada = async () => {
    if (!entradaForm.km_entrada) { toast.error('Ingresa el kilometraje de entrada'); return; }
    setEnviandoAsg(true);
    try {
      await api.put(`/asignaciones/${asignacionActiva.id}/devolver`, { ...entradaForm, km_entrada: parseInt(entradaForm.km_entrada) });
      toast.success('Entrada registrada — vehículo devuelto');
      setModalEntrada(false);
      cargarVehiculo();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al registrar entrada'); }
    setEnviandoAsg(false);
  };

  // === Funciones Bitácora ===
  const cargarBitacora = async () => {
    try {
      const res = await api.get(`/bitacora/${id}`, { params: { tipo: filtroBit } });
      setBitacora(res.data.eventos || []);
      setBitacoraStats(res.data.stats || {});
    } catch { console.log('Bitácora no disponible aún'); }
  };

  useEffect(() => { if (id && !loading) cargarBitacora(); }, [id, filtroBit, loading]);

  const registrarCombustible = async () => {
    if (!combForm.litros || !combForm.fecha) { toast.error('Litros y fecha son obligatorios'); return; }
    setEnviandoBit(true);
    try {
      const resp = await api.post('/bitacora/combustible', {
        vehiculo_id: parseInt(id), ...combForm,
        litros: parseFloat(combForm.litros),
        costo_total: combForm.costo_total ? parseFloat(combForm.costo_total) : null,
        km_actual: combForm.km_actual ? parseInt(combForm.km_actual) : null
      });
      toast.success(`⛽ Carga registrada${resp.data.rendimiento_km_litro ? ` — Rendimiento: ${resp.data.rendimiento_km_litro} km/L` : ''}`);
      setModalCombustible(false);
      cargarBitacora();
      cargarVehiculo();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al registrar carga'); }
    setEnviandoBit(false);
  };

  const registrarIncidencia = async () => {
    if (!incForm.tipo || !incForm.descripcion || !incForm.fecha) { toast.error('Completa los campos obligatorios'); return; }
    setEnviandoBit(true);
    try {
      const resp = await api.post('/bitacora/incidencias', {
        vehiculo_id: parseInt(id), ...incForm,
        costo_estimado_danos: incForm.costo_estimado_danos ? parseFloat(incForm.costo_estimado_danos) : null
      });
      toast.success(`⚠️ Incidencia registrada — Folio: ${resp.data.folio}`);
      setModalIncidencia(false);
      cargarBitacora();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al registrar incidencia'); }
    setEnviandoBit(false);
  };

  const mesesES = { 'enero':0,'febrero':1,'marzo':2,'abril':3,'mayo':4,'junio':5,'julio':6,'agosto':7,'septiembre':8,'octubre':9,'noviembre':10,'diciembre':11 };
  const getSeguroEstado = (vigencia) => {
    if (!vigencia || vigencia === 'N/A' || vigencia === 'NO APLICA' || vigencia === 'SIN DATO') return { label: 'No Aplica', clase: 'text-gray-500' };
    let fecha; const clean = vigencia.toString().trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) { const [d,m,y]=clean.split('/'); fecha=new Date(+y,+m-1,+d); }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) { fecha=new Date(clean); }
    else { const mt=clean.match(/^(\d{1,2})\s+DE\s+(\w+)\s+(?:DE\s+)?(\d{4})$/i); if(mt){const ms=mesesES[mt[2].toLowerCase()]; if(ms!==undefined) fecha=new Date(+mt[3],ms,+mt[1]);} }
    if (!fecha || isNaN(fecha)) return { label: 'Sin info', clase: 'text-gray-500' };
    const hoy=new Date(); const en30=new Date(); en30.setDate(hoy.getDate()+30);
    if (fecha<hoy) return { label:'Vencido', clase:'text-red-600 font-semibold' };
    if (fecha<=en30) return { label:'Por vencer', clase:'text-yellow-600 font-semibold' };
    return { label:'Vigente', clase:'text-green-600 font-semibold' };
  };

  const puedeEditar = ['usuario_principal','admin','responsable_flota','admin_secretaria'].includes(user?.rol);
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-red-600 rounded-full" /></div>;
  const seguroEst = getSeguroEstado(vehiculo.vigencia_seguro || vehiculo.seg_vig_f);

  // ==================== CATÁLOGOS ====================
  const opcionesTipoVehiculoAgrupadas = [
    {label:'🚗 Automóviles', options:[
      {value:'sedan',label:'Automóvil sedán'},{value:'sedan',label:'Automóvil hatchback'},{value:'sedan',label:'Automóvil coupé'},
      {value:'sedan',label:'Automóvil convertible'},{value:'sedan',label:'Automóvil turismo'}]},
    {label:'🚙 SUV / Camioneta', options:[
      {value:'suv',label:'Camioneta SUV'},{value:'suv',label:'Camioneta crossover'},{value:'camioneta',label:'Camioneta'}]},
    {label:'🛻 Pick Up', options:[
      {value:'pickup',label:'Pick up cabina sencilla'},{value:'pickup',label:'Pick up cabina doble'}]},
    {label:'🚐 Van', options:[
      {value:'van',label:'Van de pasajeros'},{value:'van',label:'Van de carga / furgoneta'},{value:'van',label:'Minivan'}]},
    {label:'🚌 Autobús', options:[
      {value:'autobus',label:'Microbús'},{value:'autobus',label:'Autobús'},{value:'autobus',label:'Autobús turístico'}]},
    {label:'🏍️ Motocicleta', options:[
      {value:'motocicleta',label:'Motocicleta'},{value:'motocicleta',label:'Motocicleta equipada'},
      {value:'motocicleta',label:'Motoneta'},{value:'motocicleta',label:'Triciclo motorizado'}]},
    {label:'🚛 Camión', options:[
      {value:'camion',label:'Camión ligero'},{value:'camion',label:'Camión mediano'},{value:'camion',label:'Camión pesado'},
      {value:'camion',label:'Camión con caja seca'},{value:'camion',label:'Camión con redilas'},{value:'camion',label:'Camión plataforma'},
      {value:'camion',label:'Camión refrigerado'},{value:'camion',label:'Camión cisterna'},{value:'camion',label:'Camión de volteo'}]},
    {label:'🚚 Remolque', options:[
      {value:'remolque',label:'Remolque'},{value:'remolque',label:'Semirremolque'},{value:'remolque',label:'Remolque agrícola'}]},
    {label:'🏗️ Grúa / Tractor', options:[
      {value:'grua',label:'Grúa'},{value:'grua',label:'Grúa de rescate'},{value:'tractor',label:'Tractor'},
      {value:'tractor',label:'Tractor agrícola'},{value:'todoterreno',label:'Vehículo todo terreno (ATV/UTV)'}]},
    {label:'🚑 Emergencia / Médica', options:[
      {value:'emergencia',label:'Ambulancia'},{value:'emergencia',label:'Ambulancia de traslado'},
      {value:'emergencia',label:'Ambulancia de terapia intensiva'},{value:'emergencia',label:'Unidad médica móvil'},
      {value:'emergencia',label:'Unidad de vacunación móvil'}]},
    {label:'🚤 Embarcaciones', options:[
      {value:'embarcacion',label:'Embarcación'},{value:'embarcacion',label:'Lancha'},
      {value:'embarcacion',label:'Moto acuática'},{value:'embarcacion',label:'Barco'},{value:'remolque',label:'Remolque acuático'}]},
    {label:'✈️ Aéreo', options:[
      {value:'aeronave',label:'Aeronave'},{value:'aeronave',label:'Avión'},{value:'helicoptero',label:'Helicóptero'}]},
    {label:'📋 Otro', options:[{value:'otro',label:'Otro'}]},
  ];
  const opcionesCombustible = [{value:'Gasolina',label:'Gasolina'},{value:'Diésel',label:'Diésel'},{value:'Híbrido',label:'Híbrido'},{value:'Eléctrico',label:'Eléctrico'}];
  const opcionesAdquisicion = [{value:'Compra',label:'Compra'},{value:'Arrendamiento',label:'Arrendamiento'},{value:'Comodato',label:'Comodato'},{value:'Donación',label:'Donación'}];
  const opcionesPlacas = [{value:'Oficiales',label:'Oficiales'},{value:'Particulares',label:'Particulares'}];
  const opcionesOperativo = [{value:'Operando',label:'Operando'},{value:'En mantenimiento',label:'En mantenimiento'},{value:'Fuera de servicio',label:'Fuera de servicio'}];
  const opcionesAdmin = [{value:'Activo',label:'Activo'},{value:'En resguardo',label:'En resguardo'},{value:'Baja',label:'Baja'}];
  const opcionesSiNo = [{value:'Sí',label:'Sí'},{value:'No',label:'No'},{value:'En trámite',label:'En trámite'}];
  const opcionesCN = [{value:'1',label:'Cuenta'},{value:'2',label:'No cuenta'}];
  const opcionesVigencia = [{value:'Vigente',label:'Vigente'},{value:'No vigente',label:'No vigente'},{value:'En trámite',label:'En trámite'}];
  const opcionesUso = [
    {value:'1',label:'Notificación de oficios'},{value:'2',label:'Trámites administrativos'},
    {value:'3',label:'Transporte de personal'},{value:'4',label:'Transporte de personal directivo'},
    {value:'5',label:'Supervisión e inspección'},{value:'6',label:'Traslado de equipo'},
    {value:'7',label:'Traslado de insumos'},{value:'8',label:'Traslado de medicamentos'},
    {value:'9',label:'Atención médica'},{value:'10',label:'Atención social'},
    {value:'11',label:'Operación de programas públicos'},{value:'12',label:'Seguridad institucional'},
    {value:'13',label:'Protección civil y emergencias'},{value:'14',label:'Servicios públicos'},
    {value:'15',label:'Obra pública y mantenimiento'},{value:'16',label:'Servicios ambientales'},
    {value:'17',label:'Educación y cultura'},{value:'18',label:'Deporte y recreación'},
    {value:'19',label:'Comunicación social'},{value:'20',label:'Logística y apoyo operativo'},
    {value:'21',label:'Uso temporal o eventual'},{value:'999',label:'Otro'},
  ];
  const opcionesTipoMant = [{value:'1',label:'Preventivo'},{value:'2',label:'Correctivo'},{value:'3',label:'Predictivo'},{value:'999',label:'Otro'}];
  const opcionesFuente = [{value:'1',label:'Recurso estatal'},{value:'2',label:'Recurso propio'},{value:'3',label:'Recursos federales transferidos'},{value:'999',label:'Otro'}];
  const opcionesUbiDes = [{value:'1',label:'Estacionamiento techado (dependencia)'},{value:'2',label:'Estacionamiento abierto (dependencia)'},{value:'3',label:'Pensión techado'},{value:'4',label:'Pensión abierto'},{value:'999',label:'Otro'}];
  const opcionesTipoSeg = [{value:'1',label:'IPAX'},{value:'2',label:'Seguridad Privada'},{value:'999',label:'Otro'}];
  const opcionesStatGen = [{value:'1',label:'Muy bueno'},{value:'2',label:'Bueno'},{value:'3',label:'Regular'},{value:'4',label:'Malo'},{value:'5',label:'Muy malo'},{value:'999',label:'Otro'}];
  const opcionesCilindrada = [{value:'1',label:'3-4 Cilindros'},{value:'2',label:'4 Cilindros'},{value:'3',label:'4 Cil. Turbo'},{value:'4',label:'4 Cil./V6'},{value:'5',label:'V8/V12'},{value:'999',label:'Otro'}];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5" /><span>Volver</span>
        </button>
        <div className="text-center flex-1">
          <h1 className="text-lg font-bold text-gray-900">{vehiculo.marca} {vehiculo.linea || vehiculo.modelo} {vehiculo.anio}</h1>
          <p className="text-xs text-gray-500">Padrón Vehicular Estatal — 151 Variables</p>
        </div>
        {puedeEditar && (
          <button onClick={() => setEditando(!editando)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${editando ? 'bg-gray-100 text-gray-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
            <PencilIcon className="h-4 w-4" />{editando ? 'Cancelar' : 'Editar'}
          </button>
        )}
      </div>

      {editando ? (
        <form onSubmit={(e) => { e.preventDefault(); guardarCambios(); }} className="space-y-6">
          {/* ====== 1. IDENTIFICACIÓN ====== */}
          <EditSection num="1" title="Identificación">
            <div className="grid md:grid-cols-5 gap-4">
              <F l="N° Inventario *" n="numero_inventario" v={formData} h={handleChange} r />
              <F l="N° Económico" n="numero_economico" v={formData} h={handleChange} />
              <F l="Placas *" n="placas" v={formData} h={handleChange} r />
              <F l="N° Serie (VIN)" n="numero_serie" v={formData} h={handleChange} />
              <F l="N° Motor" n="numero_motor" v={formData} h={handleChange} />
            </div>
          </EditSection>

          {/* ====== 2. CARACTERÍSTICAS ====== */}
          <EditSection num="2" title="Características">
            <div className="grid md:grid-cols-4 gap-4">
              <F l="Marca *" n="marca" v={formData} h={handleChange} r />
              <F l="Línea *" n="linea" v={formData} h={handleChange} r />
              <F l="Modelo (Año) *" n="anio" v={formData} h={handleChange} t="number" r />
              <F l="Color" n="color" v={formData} h={handleChange} />
            </div>
            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo Vehículo *</label>
                <SelectModerno name="tipo" value={formData.tipo||''} onChange={handleChange} groupedOptions={opcionesTipoVehiculoAgrupadas} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Cilindraje</label>
                <SelectModerno name="cilindraje" value={formData.cilindraje||''} onChange={handleChange} placeholder="..." options={opcionesCilindrada} /></div>
              <F l="Capacidad" n="capacidad_pasajeros" v={formData} h={handleChange} t="number" />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Combustible</label>
                <SelectModerno name="tipo_combustible" value={formData.tipo_combustible||''} onChange={handleChange} options={opcionesCombustible} /></div>
            </div>
          </EditSection>

          {/* ====== 3. ASIGNACIÓN ====== */}
          <EditSection num="3" title="Asignación">
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Secretaría *</label>
                {(user?.rol==='admin'||user?.rol==='gobernacion') ? (
                  <SelectModerno name="secretaria_id" value={(formData.secretaria_id||'').toString()} onChange={handleChange} placeholder="Seleccionar..." required options={secretarias.map(s=>({value:s.id.toString(),label:`${s.siglas} - ${s.nombre}`}))} />
                ) : (<div className="input-field text-sm bg-gray-100">{secretarias.find(s=>s.id==formData.secretaria_id)?.siglas||'...'}</div>)}</div>
              <F l="Asignación Actual" n="asignacion_actual" v={formData} h={handleChange} />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Uso *</label>
                <SelectModerno name="uso" value={formData.uso||''} onChange={handleChange} placeholder="..." options={opcionesUso} /></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">¿Doc. de asignación?</label>
                <SelectModerno name="asign" value={formData.asign||''} onChange={handleChange} placeholder="..." options={opcionesCN} /></div>
              <F l="Fecha Asignación" n="asig_fec" v={formData} h={handleChange} t="date" />
              <F l="Fecha Inicio Operación" n="f_uso" v={formData} h={handleChange} t="date" />
            </div>
            <div className="grid md:grid-cols-1 gap-4 mt-4">
              <F l="Unidad Responsable (Dir. General)" n="resp_ur" v={formData} h={handleChange} />
            </div>
            <div className="grid md:grid-cols-1 gap-4 mt-4">
              <F l="Área Responsable (AR)" n="ar" v={formData} h={handleChange} p="Área que genera, posee y actualiza la información" />
            </div>
          </EditSection>

          {/* ====== 4. RESPONSABLE DEL VEHÍCULO ====== */}
          <EditSection num="4" title="Responsable del Vehículo">
            <div className="grid md:grid-cols-4 gap-4">
              <F l="Primer Nombre" n="resp_n1" v={formData} h={handleChange} />
              <F l="Segundo Nombre" n="resp_n2" v={formData} h={handleChange} />
              <F l="Apellido Paterno" n="resp_ap" v={formData} h={handleChange} />
              <F l="Apellido Materno" n="resp_am" v={formData} h={handleChange} />
            </div>
            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <F l="RFC (homoclave)" n="resp_rfc" v={formData} h={handleChange} mx={13} p="XXXX000000XXX" />
              <F l="N° Trabajador" n="resp_nt" v={formData} h={handleChange} />
              <F l="Cargo" n="resguardante_cargo" v={formData} h={handleChange} />
              <F l="Teléfono" n="resguardante_telefono" v={formData} h={handleChange} />
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <F l="Email" n="resguardante_email" v={formData} h={handleChange} t="email" />
              <F l="Nombre Completo (resguardante)" n="resguardante_nombre" v={formData} h={handleChange} />
            </div>
          </EditSection>

          {/* ====== 5. ADQUISICIÓN Y PROVEEDOR ====== */}
          <EditSection num="5" title="Adquisición y Proveedor">
            <div className="grid md:grid-cols-4 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Forma Adquisición</label>
                <SelectModerno name="forma_adquisicion" value={formData.forma_adquisicion||''} onChange={handleChange} options={opcionesAdquisicion} /></div>
              <F l="Fecha Adquisición" n="fecha_adquisicion" v={formData} h={handleChange} t="date" />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Fuente Financiamiento</label>
                <SelectModerno name="fuente_fin" value={formData.fuente_fin||''} onChange={handleChange} placeholder="..." options={opcionesFuente} /></div>
              <F l="N° Contrato" n="contrato" v={formData} h={handleChange} />
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">Datos del Proveedor</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <F l="Razón Social (PV_RS)" n="pv_rs" v={formData} h={handleChange} />
              <F l="RFC Proveedor (PV_RFC)" n="pv_rfc" v={formData} h={handleChange} mx={13} />
              <F l="N° Padrón (PV_NP)" n="pv_np" v={formData} h={handleChange} />
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">Valores</h3>
            <div className="grid md:grid-cols-5 gap-4">
              <F l="CFDI" n="cfdi" v={formData} h={handleChange} />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Factura Original</label>
                <SelectModerno name="factura_original" value={formData.factura_original||''} onChange={handleChange} placeholder="..." options={opcionesCN} /></div>
              <F l="Valor Factura" n="valor_factura" v={formData} h={handleChange} t="number" />
              <F l="Valor Contrato" n="valor_contrato" v={formData} h={handleChange} t="number" />
              <F l="Valor Mercado" n="valor_mercado" v={formData} h={handleChange} t="number" />
            </div>
          </EditSection>

          {/* ====== 6. DOCUMENTACIÓN ====== */}
          <EditSection num="6" title="Documentación">
            <div className="grid md:grid-cols-4 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo Placas</label>
                <SelectModerno name="tipo_placas" value={formData.tipo_placas||''} onChange={handleChange} options={opcionesPlacas} /></div>
              <F l="Fecha Exp. Placas" n="fecha_expedicion_placas" v={formData} h={handleChange} t="date" />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tarjeta Circulación</label>
                <SelectModerno name="tarjeta_circulacion" value={formData.tarjeta_circulacion||''} onChange={handleChange} placeholder="..." options={opcionesVigencia} /></div>
              <F l="Vigencia Tarjeta" n="vigencia_tarjeta" v={formData} h={handleChange} t="date" />
            </div>
            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Acta Entrega</label>
                <SelectModerno name="acta_entrega_recepcion" value={formData.acta_entrega_recepcion||''} onChange={handleChange} placeholder="..." options={opcionesSiNo} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Resguardo</label>
                <SelectModerno name="resguardo_vehicular" value={formData.resguardo_vehicular||''} onChange={handleChange} placeholder="..." options={opcionesSiNo} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Verificación</label>
                <SelectModerno name="verificacion_vehicular" value={formData.verificacion_vehicular||''} onChange={handleChange} placeholder="..." options={[...opcionesVigencia,{value:'Exento',label:'Exento'}]} /></div>
              <F l="Vigencia Verif." n="vigencia_verificacion" v={formData} h={handleChange} t="date" />
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Reemplacamiento</label>
                <SelectModerno name="comprobante_reemplacamiento" value={formData.comprobante_reemplacamiento||''} onChange={handleChange} placeholder="..." options={[{value:'Sí',label:'Sí'},{value:'No',label:'No'},{value:'No aplica',label:'No aplica'}]} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Comprobante Placas (COMP_PL)</label>
                <SelectModerno name="comp_pl" value={formData.comp_pl||''} onChange={handleChange} placeholder="..." options={opcionesCN} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Bitácora Mant. (BIT_MAN)</label>
                <SelectModerno name="bit_man" value={formData.bit_man||''} onChange={handleChange} placeholder="..." options={opcionesCN} /></div>
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">Adeudos Vehiculares</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Pago Derechos</label>
                <SelectModerno name="pago_derechos" value={formData.pago_derechos||''} onChange={handleChange} placeholder="..." options={[{value:'Vigente',label:'Vigente'},{value:'No vigente',label:'No vigente'},{value:'Exento',label:'Exento'}]} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">¿Adeudo? (DD_VV)</label>
                <SelectModerno name="dd_vv" value={formData.dd_vv||''} onChange={handleChange} placeholder="..." options={opcionesCN} /></div>
              <F l="Monto Adeudo (DD_VVC)" n="dd_vvc" v={formData} h={handleChange} t="number" />
            </div>
          </EditSection>

          {/* ====== 7. INVENTARIO Y DEPRECIACIÓN ====== */}
          <EditSection num="7" title="Inventario y Depreciación">
            <div className="grid md:grid-cols-3 gap-4">
              <F l="N° Inv. Patrimonial" n="inventario_patrimonial" v={formData} h={handleChange} />
              <F l="Fecha Alta Inventario" n="fecha_alta_inventario" v={formData} h={handleChange} t="date" />
              <F l="Valor en Libros" n="valor_libros" v={formData} h={handleChange} t="number" />
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <F l="Tasa Depreciación % (P_DEPRE)" n="p_depre" v={formData} h={handleChange} t="number" />
              <F l="Vida Útil Remanente (meses)" n="vida_ur" v={formData} h={handleChange} t="number" />
              <F l="Depreciación Acumulada (DEP_AC)" n="dep_ac" v={formData} h={handleChange} t="number" />
            </div>
          </EditSection>

          {/* ====== 8. ESTATUS ====== */}
          <EditSection num="8" title="Estatus">
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Estatus Operativo *</label>
                <SelectModerno name="estatus_operativo" value={formData.estatus_operativo||formData.estado_operativo||''} onChange={handleChange} options={opcionesOperativo} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Estatus Administrativo *</label>
                <SelectModerno name="estatus_administrativo" value={formData.estatus_administrativo||''} onChange={handleChange} options={opcionesAdmin} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Status General (STAT_GEN)</label>
                <SelectModerno name="stat_gen" value={formData.stat_gen||''} onChange={handleChange} placeholder="..." options={opcionesStatGen} /></div>
            </div>
          </EditSection>

          {/* ====== 9. UBICACIÓN Y SEGURIDAD ====== */}
          <EditSection num="9" title="Ubicación y Seguridad del Resguardo">
            <div className="grid md:grid-cols-4 gap-4">
              <F l="Entidad Federativa" n="est_ubi" v={formData} h={handleChange} p="Veracruz" />
              <F l="Municipio" n="municipio" v={formData} h={handleChange} />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Descripción Ubicación</label>
                <SelectModerno name="ubicacion_fisica" value={formData.ubicacion_fisica||''} onChange={handleChange} placeholder="..." options={opcionesUbiDes} /></div>
              <F l="Ubicación Específica" n="ubicacion_especifica" v={formData} h={handleChange} />
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <F l="Latitud" n="latitud" v={formData} h={handleChange} p="19.5438000000000" />
              <F l="Longitud" n="longitud" v={formData} h={handleChange} p="-96.9102000000000" />
              <F l="Dirección Completa" n="direccion_completa" v={formData} h={handleChange} />
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">Seguridad del Resguardo</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">¿Seguridad 24hrs?</label>
                <SelectModerno name="ubi_seg" value={formData.ubi_seg||''} onChange={handleChange} placeholder="..." options={opcionesCN} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo Seguridad</label>
                <SelectModerno name="ubi_seg_t" value={formData.ubi_seg_t||''} onChange={handleChange} placeholder="..." options={opcionesTipoSeg} /></div>
              <F l="Empresa Seguridad" n="ubi_seg_e" v={formData} h={handleChange} />
            </div>
          </EditSection>

          {/* ====== 10. SEGURO ====== */}
          <EditSection num="10" title="Seguro Vehicular">
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">¿Cuenta con Seguro?</label>
                <SelectModerno name="seguro" value={formData.seguro||''} onChange={handleChange} placeholder="..." options={opcionesCN} /></div>
              <F l="Aseguradora" n="aseguradora" v={formData} h={handleChange} />
              <F l="N° Póliza" n="poliza_seguro" v={formData} h={handleChange} />
            </div>
            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <F l="Inicio Cobertura" n="seg_vig_i" v={formData} h={handleChange} t="date" />
              <F l="Fin Cobertura" n="seg_vig_f" v={formData} h={handleChange} t="date" />
              <F l="Valor Anual Póliza" n="val_pol" v={formData} h={handleChange} t="number" />
              <F l="Vigencia Seguro" n="vigencia_seguro" v={formData} h={handleChange} />
            </div>
          </EditSection>

          {/* ====== 11. USO, KILOMETRAJE Y COMBUSTIBLE ====== */}
          <EditSection num="11" title="Uso, Kilometraje y Combustible">
            <h3 className="font-medium text-gray-700 mb-3 text-sm">📅 Días de uso por semana (mes anterior)</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {['uso_s1','uso_s2','uso_s3','uso_s4'].map((n,i) => (
                <F key={n} l={`Semana ${i+1}`} n={n} v={formData} h={handleChange} t="number" />
              ))}
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">🚗 Kilometraje</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <F l="Km Acumulado (KM_AC)" n="km_ac" v={formData} h={handleChange} t="number" />
              <F l="Km Mes Anterior (KM_MEN)" n="km_men" v={formData} h={handleChange} t="number" />
              <F l="Kilometraje Actual" n="kilometraje" v={formData} h={handleChange} t="number" />
              <F l="Rendimiento (lts/km)" n="rend" v={formData} h={handleChange} t="number" />
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">📊 Km Mensual 2025</h3>
            <div className="grid md:grid-cols-6 gap-3">
              {[['Ene','km_en2025'],['Feb','km_fe2025'],['Mar','km_ma2025'],['Abr','km_ab2025'],['May','km_may2025'],['Jun','km_ju2025']].map(([l,n])=>(
                <F key={n} l={l} n={n} v={formData} h={handleChange} t="number" s />))}
            </div>
            <div className="grid md:grid-cols-6 gap-3 mt-2">
              {[['Jul','km_jul2025'],['Ago','km_ag2025'],['Sep','km_se2025'],['Oct','km_oc2025'],['Nov','km_no2025'],['Dic','km_di2025']].map(([l,n])=>(
                <F key={n} l={l} n={n} v={formData} h={handleChange} t="number" s />))}
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">⛽ Combustible</h3>
            <div className="grid md:grid-cols-5 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">¿Bitácora Combustible?</label>
                <SelectModerno name="carg_bit" value={formData.carg_bit||''} onChange={handleChange} placeholder="..." options={opcionesCN} /></div>
              {['car_s1','car_s2','car_s3','car_s4'].map((n,i)=>(
                <F key={n} l={`Carga S${i+1} (lts)`} n={n} v={formData} h={handleChange} t="number" />))}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <F l="Consumo (L/100km)" n="consumo_combustible" v={formData} h={handleChange} t="number" />
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">📊 Litros Mensual 2025</h3>
            <div className="grid md:grid-cols-6 gap-3">
              {[['Ene','lt_en2025'],['Feb','lt_fe2025'],['Mar','lt_ma2025'],['Abr','lt_ab2025'],['May','lt_may2025'],['Jun','lt_ju2025']].map(([l,n])=>(
                <F key={n} l={l} n={n} v={formData} h={handleChange} t="number" s />))}
            </div>
            <div className="grid md:grid-cols-6 gap-3 mt-2">
              {[['Jul','lt_jul2025'],['Ago','lt_ag2025'],['Sep','lt_se2025'],['Oct','lt_oc2025'],['Nov','lt_no2025'],['Dic','lt_di2025']].map(([l,n])=>(
                <F key={n} l={l} n={n} v={formData} h={handleChange} t="number" s />))}
            </div>
          </EditSection>

          {/* ====== 12. MANTENIMIENTO ====== */}
          <EditSection num="12" title="Mantenimiento">
            <h3 className="font-medium text-gray-700 mb-3 text-sm">🔧 Último Mantenimiento</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <F l="Fecha (MAN_FEC)" n="ultimo_servicio" v={formData} h={handleChange} t="date" />
              <F l="Costo (MAN_COST)" n="man_cost" v={formData} h={handleChange} t="number" />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo (MAN_TIPO)</label>
                <SelectModerno name="man_tipo" value={formData.man_tipo||''} onChange={handleChange} placeholder="..." options={opcionesTipoMant} /></div>
              <F l="Costo Anual Mant." n="costo_mantenimiento_anual" v={formData} h={handleChange} t="number" />
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <F l="Razón Social (MAN_RS)" n="man_rs" v={formData} h={handleChange} />
              <F l="RFC Proveedor (MP_RFC)" n="mp_rfc" v={formData} h={handleChange} mx={13} />
              <F l="N° Padrón (MP_NP)" n="mp_np" v={formData} h={handleChange} />
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">📊 Condición del Vehículo</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <F l="% Motor" n="porcentaje_motor" v={formData} h={handleChange} t="number" />
              <F l="% Transmisión" n="porcentaje_transmision" v={formData} h={handleChange} t="number" />
              <F l="% Chasis" n="porcentaje_chasis" v={formData} h={handleChange} t="number" />
              <F l="Proveedor Mant." n="proveedor_mantenimiento" v={formData} h={handleChange} />
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">📋 Historial Mantenimientos (Ejercicio Actual)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <F l="N° Mantenimientos (NUM_MAN)" n="num_man" v={formData} h={handleChange} t="number" />
            </div>
            {[1,2,3].map(i=>(
              <div key={i} className="bg-gray-50 p-3 rounded-lg mt-3">
                <p className="text-sm font-medium text-gray-600 mb-2">Mantenimiento #{i}</p>
                <div className="grid md:grid-cols-5 gap-3">
                  <div><label className="block text-xs text-gray-600 mb-1">Tipo</label>
                    <SelectModerno name={`m${i}_tipo`} value={formData[`m${i}_tipo`]||''} onChange={handleChange} placeholder="..." options={opcionesTipoMant} /></div>
                  <F l="Fecha" n={`m${i}_fec`} v={formData} h={handleChange} t="date" s />
                  <F l="RFC" n={`m${i}_rfc`} v={formData} h={handleChange} s />
                  <F l="N° Padrón" n={`m${i}_np`} v={formData} h={handleChange} s />
                  <F l="Razón Social" n={`m${i}_rs`} v={formData} h={handleChange} s />
                </div>
              </div>
            ))}
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">📋 Historial Mantenimientos 2025</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <F l="N° Mantenimientos 2025" n="numm_2025" v={formData} h={handleChange} t="number" />
            </div>
            {[1,2,3].map(i=>(
              <div key={i} className="bg-blue-50 p-3 rounded-lg mt-3">
                <p className="text-sm font-medium text-blue-600 mb-2">Mantenimiento #{i} (2025)</p>
                <div className="grid md:grid-cols-5 gap-3">
                  <div><label className="block text-xs text-gray-600 mb-1">Tipo</label>
                    <SelectModerno name={`m${i}t_2025`} value={formData[`m${i}t_2025`]||''} onChange={handleChange} placeholder="..." options={opcionesTipoMant} /></div>
                  <F l="Fecha" n={`m${i}f_2025`} v={formData} h={handleChange} t="date" s />
                  <F l="RFC" n={`m${i}r_2025`} v={formData} h={handleChange} s />
                  <F l="N° Padrón" n={`m${i}n_2025`} v={formData} h={handleChange} s />
                  <F l="Razón Social" n={`m${i}s_2025`} v={formData} h={handleChange} s />
                </div>
              </div>
            ))}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Desglose Mantenimiento</label>
              <textarea name="desglose_mantenimiento" value={formData.desglose_mantenimiento||''} onChange={handleChange} className="input-field text-sm" rows={2} />
            </div>
          </EditSection>

          {/* ====== 13. SERVICIO MECÁNICO ====== */}
          <EditSection num="13" title="Servicio Mecánico">
            <h3 className="font-medium text-gray-700 mb-3 text-sm">🔧 Mecánico — Mes Anterior</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <F l="Gasto Mensual (COST_MEC)" n="cost_mec" v={formData} h={handleChange} t="number" />
              <F l="Tipo Arreglo (MEC_TIPO)" n="mec_tipo" v={formData} h={handleChange} />
              <F l="Fecha Arreglo (MEC_FEC)" n="mec_fec" v={formData} h={handleChange} t="date" />
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <F l="RFC (MEC_RFC)" n="mec_rfc" v={formData} h={handleChange} mx={13} />
              <F l="N° Padrón (MEC_NP)" n="mec_np" v={formData} h={handleChange} />
              <F l="Razón Social (MEC_RS)" n="mec_rs" v={formData} h={handleChange} />
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">📊 Mecánico — 2025</h3>
            <div className="grid md:grid-cols-5 gap-4">
              <F l="Gasto Anual (CM_2025)" n="cm_2025" v={formData} h={handleChange} t="number" />
              <F l="Frecuencia (FM_2025)" n="fm_2025" v={formData} h={handleChange} t="number" />
              <F l="RFC (MR_2025)" n="mr_2025" v={formData} h={handleChange} />
              <F l="N° Padrón (MN_2025)" n="mn_2025" v={formData} h={handleChange} />
              <F l="Razón Social (MS_2025)" n="ms_2025" v={formData} h={handleChange} />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Desglose Mecánico</label>
              <textarea name="desglose_mecanico" value={formData.desglose_mecanico||''} onChange={handleChange} className="input-field text-sm" rows={2} />
            </div>
            <h3 className="font-medium text-gray-700 mt-6 mb-3 border-t pt-4 text-sm">⚡ Servicio Eléctrico</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <F l="Costo Anual Eléctrico" n="costo_anual_electrico" v={formData} h={handleChange} t="number" />
              <F l="Frecuencia (veces/año)" n="frecuencia_electrico" v={formData} h={handleChange} t="number" />
              <F l="Proveedor Eléctrico" n="proveedor_electrico" v={formData} h={handleChange} />
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Desglose Eléctrico</label>
              <textarea name="desglose_electrico" value={formData.desglose_electrico||''} onChange={handleChange} className="input-field text-sm" rows={2} />
            </div>
            <div className="mt-6 border-t pt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones Técnicas</label>
              <textarea name="observaciones_tecnicas" value={formData.observaciones_tecnicas||''} onChange={handleChange} className="input-field text-sm" rows={2} />
            </div>
          </EditSection>

          {/* ====== 14. PRÉSTAMO ====== */}
          <div className="card border-2 border-amber-200 bg-amber-50/30">
            <div className="flex items-center gap-3 mb-4">
              <input type="checkbox" id="epe" checked={formData.esta_prestado||false} onChange={(e)=>setFormData(prev=>({...prev,esta_prestado:e.target.checked}))} className="h-5 w-5 text-amber-600 rounded" />
              <label htmlFor="epe" className="text-base font-bold text-gray-900 cursor-pointer">
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-sm mr-2">14</span>Prestado a otra Secretaría
              </label>
            </div>
            {formData.esta_prestado && (
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-amber-200">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Secretaría destino</label>
                  <SelectModerno name="prestado_a_secretaria_id" value={(formData.prestado_a_secretaria_id||'').toString()} onChange={handleChange} placeholder="..." options={secretarias.filter(s=>s.id!=formData.secretaria_id).map(s=>({value:s.id.toString(),label:s.siglas}))} /></div>
                <F l="Fecha Préstamo" n="prestamo_fecha_inicio" v={formData} h={handleChange} t="date" />
                <F l="Motivo" n="prestamo_motivo" v={formData} h={handleChange} />
              </div>
            )}
          </div>

          {/* ====== 15. EVIDENCIA ====== */}
          <EditSection num="15" title="Evidencia">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Subir Fotos</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-veracruz-400 transition-colors">
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleUploadFotos} className="hidden" id="fu-edit" disabled={uploadingFotos} />
                  <label htmlFor="fu-edit" className="cursor-pointer">
                    {uploadingFotos ? (<div className="flex flex-col items-center gap-2"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-veracruz-600"></div><span className="text-sm text-gray-500">Subiendo...</span></div>)
                    : (<div className="flex flex-col items-center gap-2"><CloudArrowUpIcon className="h-10 w-10 text-gray-400" /><span className="text-sm text-gray-600"><span className="text-veracruz-600 font-medium">Clic para seleccionar</span></span></div>)}
                  </label>
                </div>
              </div>
              {fotos.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Fotos ({fotos.length})</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {fotos.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt={`Foto ${i+1}`} className="w-full h-24 object-cover rounded-lg border" />
                        <button type="button" onClick={()=>handleRemoveFoto(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <F l="URLs de Fotos (alternativo)" n="evidencia_fotografica" v={formData} h={handleChange} p="Separar con coma" />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                <textarea name="observaciones" value={formData.observaciones||''} onChange={handleChange} className="input-field text-sm" rows={3} /></div>
            </div>
          </EditSection>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={()=>{setEditando(false);setFormData(vehiculo);}} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Cambios</button>
          </div>
        </form>
      ) : (
        /* ================================================================
           =================== MODO VISTA — 151 Variables =================
           ================================================================ */
        <div className="space-y-6">
          {puedeEditar && (
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>cambiarEstado('Disponible')} className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all">✅ Marcar Disponible</button>
              <button onClick={()=>cambiarEstado('En taller')} className="px-3 py-1.5 text-xs font-semibold bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 transition-all">🔧 Enviar a Taller</button>
              {!vehiculo.propuesto_baja ? (<button onClick={proponerParaBaja} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-all">⛔ Proponer Baja</button>)
              : (<button onClick={quitarPropuestaBaja} className="px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200 transition-all">↩️ Quitar propuesta</button>)}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={toggleAll} className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 flex items-center gap-2 font-medium transition-all border border-indigo-200">
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${seccionesAbiertas === 'all' ? 'rotate-180' : ''}`} />
              {seccionesAbiertas === 'all' ? 'Cerrar todas' : 'Abrir todas las secciones'}
            </button>
          </div>

          <Sec forceState={seccionesAbiertas} t="1. Identificación" defaultOpen={true}>
            <Row l="N° Inventario" v={vehiculo.numero_inventario} hi />
            <Row l="N° Económico" v={vehiculo.numero_economico} />
            <Row l="Placas" v={vehiculo.placas} hi />
            <Row l="No. Serie (VIN)" v={vehiculo.numero_serie} />
            <Row l="No. Motor" v={vehiculo.numero_motor} />
          </Sec>

          <Sec forceState={seccionesAbiertas} t="2. Características del Vehículo">
            <Row l="Marca" v={vehiculo.marca} />
            <Row l="Línea" v={vehiculo.linea||vehiculo.modelo} />
            <Row l="Modelo (Año)" v={vehiculo.anio} />
            <Row l="Color" v={vehiculo.color} />
            <Row l="Tipo de Vehículo" v={vehiculo.tipo} />
            <Row l="Cilindraje" v={vehiculo.cilindraje} />
            <Row l="Capacidad Pasajeros" v={vehiculo.capacidad_pasajeros} />
            <Row l="Tipo Combustible" v={vehiculo.tipo_combustible} />
            <Row l="Cilindros" v={vehiculo.cilindros} />
            <Row l="Transmisión" v={vehiculo.transmision} />
          </Sec>

          <Sec forceState={seccionesAbiertas} t="3. Asignación">
            <Row l="Dependencia" v={vehiculo.secretaria_siglas ? `${vehiculo.secretaria_siglas} - ${vehiculo.secretaria_nombre}` : '-'} />
            <Row l="Asignación Actual" v={vehiculo.asignacion_actual} />
            <Row l="Uso" v={vehiculo.uso} />
            <Row l="¿Doc. de Asignación?" v={vehiculo.asign} />
            <Row l="Fecha Asignación" v={vehiculo.asig_fec} />
            <Row l="Fecha Inicio Operación" v={vehiculo.f_uso} />
            <Row l="Unidad Responsable (Dir. Gral.)" v={vehiculo.resp_ur} />
            <Row l="Área Responsable (AR)" v={vehiculo.ar} />
          </Sec>

          <Sec forceState={seccionesAbiertas} t="4. Responsable del Vehículo">
            <Row l="Primer Nombre" v={vehiculo.resp_n1} />
            <Row l="Segundo Nombre" v={vehiculo.resp_n2} />
            <Row l="Apellido Paterno" v={vehiculo.resp_ap} />
            <Row l="Apellido Materno" v={vehiculo.resp_am} />
            <Row l="RFC (con homoclave)" v={vehiculo.resp_rfc} />
            <Row l="N° Trabajador" v={vehiculo.resp_nt} />
            <Row l="Nombre Completo" v={vehiculo.resguardante_nombre} />
            <Row l="Cargo" v={vehiculo.resguardante_cargo} />
            <Row l="Teléfono" v={vehiculo.resguardante_telefono} />
            <Row l="Email" v={vehiculo.resguardante_email} />
          </Sec>

          <Sec forceState={seccionesAbiertas} t="5. Adquisición y Proveedor">
            <Row l="Forma de Adquisición" v={vehiculo.forma_adquisicion} />
            <Row l="Fecha Adquisición" v={vehiculo.fecha_adquisicion ? new Date(vehiculo.fecha_adquisicion).toLocaleDateString('es-MX') : '-'} />
            <Row l="Fuente Financiamiento" v={vehiculo.fuente_fin} />
            <Row l="N° Contrato" v={vehiculo.contrato} />
            <Row l="Razón Social Proveedor (PV_RS)" v={vehiculo.pv_rs||vehiculo.proveedor_unidad} />
            <Row l="RFC Proveedor (PV_RFC)" v={vehiculo.pv_rfc} />
            <Row l="N° Padrón Proveedor (PV_NP)" v={vehiculo.pv_np} />
            <Row l="CFDI" v={vehiculo.cfdi} />
            <Row l="Factura Original" v={vehiculo.factura_original} />
            <Row l="Valor Factura" v={vehiculo.valor_factura ? `$${Number(vehiculo.valor_factura).toLocaleString()}` : '-'} />
            <Row l="Valor Contrato" v={vehiculo.valor_contrato ? `$${Number(vehiculo.valor_contrato).toLocaleString()}` : '-'} />
            <Row l="Valor Mercado" v={vehiculo.valor_mercado ? `$${Number(vehiculo.valor_mercado).toLocaleString()}` : '-'} />
          </Sec>

          <Sec forceState={seccionesAbiertas} t="6. Documentación y Placas">
            <Row l="Tipo de Placas" v={vehiculo.tipo_placas} />
            <Row l="Fecha Expedición Placas" v={vehiculo.fecha_expedicion_placas} />
            <Row l="Comprobante Placas (COMP_PL)" v={vehiculo.comp_pl} />
            <Row l="Tarjeta de Circulación" v={vehiculo.tarjeta_circulacion} />
            <Row l="Vigencia Tarjeta" v={vehiculo.vigencia_tarjeta} />
            <Row l="Verificación Vehicular" v={vehiculo.verificacion_vehicular} />
            <Row l="Vigencia Verificación" v={vehiculo.vigencia_verificacion} />
            <Row l="Acta Entrega-Recepción" v={vehiculo.acta_entrega_recepcion} />
            <Row l="Resguardo Vehicular" v={vehiculo.resguardo_vehicular} />
            <Row l="Comprobante Reemplacamiento" v={vehiculo.comprobante_reemplacamiento} />
            <Row l="Pago Derechos" v={vehiculo.pago_derechos} />
            <Row l="Bitácora Mantenimiento (BIT_MAN)" v={vehiculo.bit_man} />
            <Row l="¿Adeudo Derechos? (DD_VV)" v={vehiculo.dd_vv} />
            <Row l="Monto Adeudo (DD_VVC)" v={vehiculo.dd_vvc ? `$${Number(vehiculo.dd_vvc).toLocaleString()}` : '-'} />
          </Sec>

          <Sec forceState={seccionesAbiertas} t="7. Inventario y Depreciación">
            <Row l="Inventario Patrimonial" v={vehiculo.inventario_patrimonial} />
            <Row l="Fecha Alta Inventario" v={vehiculo.fecha_alta_inventario} />
            <Row l="Valor en Libros" v={vehiculo.valor_libros ? `$${Number(vehiculo.valor_libros).toLocaleString()}` : '-'} />
            <Row l="Tasa Depreciación % (P_DEPRE)" v={vehiculo.p_depre ? `${vehiculo.p_depre}%` : '-'} />
            <Row l="Vida Útil Remanente (meses)" v={vehiculo.vida_ur} />
            <Row l="Depreciación Acumulada (DEP_AC)" v={vehiculo.dep_ac ? `$${Number(vehiculo.dep_ac).toLocaleString()}` : '-'} />
          </Sec>

          <Sec forceState={seccionesAbiertas} t="8. Estatus">
            <Row l="Estatus Operativo" v={vehiculo.estatus_operativo||vehiculo.estado_operativo} vc={
              (vehiculo.estatus_operativo||vehiculo.estado_operativo||'').toLowerCase().includes('operando')?'text-green-600 font-semibold':
              (vehiculo.estatus_operativo||vehiculo.estado_operativo||'').toLowerCase().includes('mantenimiento')?'text-yellow-600 font-semibold':
              (vehiculo.estatus_operativo||vehiculo.estado_operativo||'').toLowerCase().includes('fuera')?'text-red-600 font-semibold':''} />
            <Row l="Estatus Administrativo" v={vehiculo.estatus_administrativo} vc={vehiculo.estatus_administrativo==='Activo'?'text-green-600 font-semibold':vehiculo.estatus_administrativo==='Baja'?'text-red-600 font-semibold':'text-yellow-600 font-semibold'} />
            <Row l="Status General (STAT_GEN)" v={vehiculo.stat_gen} />
            <Row l="En Uso" v={vehiculo.en_uso?'Sí':'No'} />
            <Row l="Propuesto para Baja" v={vehiculo.propuesto_baja?'Sí':'No'} vc={vehiculo.propuesto_baja?'text-red-600 font-semibold':''} />
            {vehiculo.fecha_propuesta_baja && <Row l="Fecha Propuesta Baja" v={vehiculo.fecha_propuesta_baja} />}
            {vehiculo.motivo_propuesta_baja && <Row l="Motivo" v={vehiculo.motivo_propuesta_baja} />}
          </Sec>

          <Sec forceState={seccionesAbiertas} t="9. Ubicación y Seguridad del Resguardo">
            <Row l="Entidad Federativa" v={vehiculo.est_ubi} />
            <Row l="Municipio" v={vehiculo.municipio} />
            <Row l="Descripción Ubicación" v={vehiculo.ubicacion_fisica} />
            <Row l="Ubicación Específica" v={vehiculo.ubicacion_especifica} />
            <Row l="Dirección Completa" v={vehiculo.direccion_completa} />
            {(vehiculo.latitud||vehiculo.longitud) && <Row l="Coordenadas" v={`${vehiculo.latitud||''}, ${vehiculo.longitud||''}`} />}
            <Row l="¿Seguridad 24hrs? (UBI_SEG)" v={vehiculo.ubi_seg} />
            <Row l="Tipo Seguridad (UBI_SEG_T)" v={vehiculo.ubi_seg_t} />
            <Row l="Empresa Seguridad (UBI_SEG_E)" v={vehiculo.ubi_seg_e} />
          </Sec>

          <Sec forceState={seccionesAbiertas} t="10. Seguro Vehicular">
            <Row l="¿Cuenta con Seguro?" v={vehiculo.seguro} />
            <Row l="Estado del Seguro" v={seguroEst.label} vc={seguroEst.clase} />
            <Row l="Aseguradora" v={vehiculo.aseguradora} />
            <Row l="No. Póliza" v={vehiculo.poliza_seguro} />
            <Row l="Inicio Cobertura (SEG_VIG_I)" v={vehiculo.seg_vig_i} />
            <Row l="Fin Cobertura (SEG_VIG_F)" v={vehiculo.seg_vig_f} />
            <Row l="Vigencia Seguro" v={vehiculo.vigencia_seguro} />
            <Row l="Valor Anual Póliza (VAL_POL)" v={vehiculo.val_pol ? `$${Number(vehiculo.val_pol).toLocaleString()}` : '-'} />
          </Sec>

          <Sec forceState={seccionesAbiertas} t="11. Uso, Kilometraje y Combustible">
            <Row l="Fecha Inicio Operación (F_USO)" v={vehiculo.f_uso} />
            <Row l="Uso Sem. 1 (días)" v={vehiculo.uso_s1} />
            <Row l="Uso Sem. 2 (días)" v={vehiculo.uso_s2} />
            <Row l="Uso Sem. 3 (días)" v={vehiculo.uso_s3} />
            <Row l="Uso Sem. 4 (días)" v={vehiculo.uso_s4} />
            <Row l="Km Acumulado Total (KM_AC)" v={vehiculo.km_ac ? `${Number(vehiculo.km_ac).toLocaleString()} km`:'-'} />
            <Row l="Km Mes Anterior (KM_MEN)" v={vehiculo.km_men ? `${Number(vehiculo.km_men).toLocaleString()} km`:'-'} />
            <Row l="Kilometraje Actual" v={vehiculo.kilometraje ? `${Number(vehiculo.kilometraje).toLocaleString()} km`:'-'} />
            <Row l="Rendimiento (lts/km)" v={vehiculo.rend} />
            <Row l="Consumo (L/100km)" v={vehiculo.consumo_combustible} />
            <Row l="¿Bitácora Combustible?" v={vehiculo.carg_bit} />
            <Row l="Carga S1 (lts)" v={vehiculo.car_s1} />
            <Row l="Carga S2 (lts)" v={vehiculo.car_s2} />
            <Row l="Carga S3 (lts)" v={vehiculo.car_s3} />
            <Row l="Carga S4 (lts)" v={vehiculo.car_s4} />
          </Sec>

          {(vehiculo.km_en2025||vehiculo.km_fe2025||vehiculo.km_ma2025||vehiculo.km_ab2025) && (
            <Sec forceState={seccionesAbiertas} t="11.1 Kilometraje Mensual 2025">
              {[['Enero','km_en2025'],['Febrero','km_fe2025'],['Marzo','km_ma2025'],['Abril','km_ab2025'],['Mayo','km_may2025'],['Junio','km_ju2025'],['Julio','km_jul2025'],['Agosto','km_ag2025'],['Septiembre','km_se2025'],['Octubre','km_oc2025'],['Noviembre','km_no2025'],['Diciembre','km_di2025']].map(([m,k])=>(
                <Row key={k} l={m} v={vehiculo[k]} />
              ))}
            </Sec>
          )}

          {(vehiculo.lt_en2025||vehiculo.lt_fe2025||vehiculo.lt_ma2025||vehiculo.lt_ab2025) && (
            <Sec forceState={seccionesAbiertas} t="11.2 Litros Combustible Mensual 2025">
              {[['Enero','lt_en2025'],['Febrero','lt_fe2025'],['Marzo','lt_ma2025'],['Abril','lt_ab2025'],['Mayo','lt_may2025'],['Junio','lt_ju2025'],['Julio','lt_jul2025'],['Agosto','lt_ag2025'],['Septiembre','lt_se2025'],['Octubre','lt_oc2025'],['Noviembre','lt_no2025'],['Diciembre','lt_di2025']].map(([m,k])=>(
                <Row key={k} l={m} v={vehiculo[k]} />
              ))}
            </Sec>
          )}

          <Sec forceState={seccionesAbiertas} t="12. Mantenimiento">
            <Row l="Último Servicio (MAN_FEC)" v={vehiculo.ultimo_servicio||vehiculo.fecha_ultimo_servicio} />
            <Row l="Costo Último Mant. (MAN_COST)" v={vehiculo.man_cost ? `$${Number(vehiculo.man_cost).toLocaleString()}`:'-'} />
            <Row l="Tipo Mant. (MAN_TIPO)" v={vehiculo.man_tipo} />
            <Row l="Razón Social (MAN_RS)" v={vehiculo.man_rs} />
            <Row l="RFC Proveedor (MP_RFC)" v={vehiculo.mp_rfc} />
            <Row l="N° Padrón (MP_NP)" v={vehiculo.mp_np} />
            <Row l="Costo Anual Mantenimiento" v={vehiculo.costo_mantenimiento_anual ? `$${Number(vehiculo.costo_mantenimiento_anual).toLocaleString()}`:'-'} />
            <Row l="Proveedor Mantenimiento" v={vehiculo.proveedor_mantenimiento} />
            <Row l="% Motor" v={vehiculo.porcentaje_motor ? `${vehiculo.porcentaje_motor}%`:'-'} />
            <Row l="% Transmisión" v={vehiculo.porcentaje_transmision ? `${vehiculo.porcentaje_transmision}%`:'-'} />
            <Row l="% Chasis" v={vehiculo.porcentaje_chasis ? `${vehiculo.porcentaje_chasis}%`:'-'} />
            {vehiculo.desglose_mantenimiento && <Row l="Desglose Mantenimiento" v={vehiculo.desglose_mantenimiento} />}
            {vehiculo.observaciones_tecnicas && <Row l="Observaciones Técnicas" v={vehiculo.observaciones_tecnicas} />}
          </Sec>

          {vehiculo.num_man && (
            <Sec forceState={seccionesAbiertas} t="12.1 Historial Mantenimientos (Ejercicio Actual)">
              <Row l="N° Mantenimientos (NUM_MAN)" v={vehiculo.num_man} />
              {[1,2,3].map(i=>[
                vehiculo[`m${i}_tipo`] && <Row key={`${i}t`} l={`Mant. #${i} — Tipo`} v={vehiculo[`m${i}_tipo`]} />,
                vehiculo[`m${i}_fec`] && <Row key={`${i}f`} l={`Mant. #${i} — Fecha`} v={vehiculo[`m${i}_fec`]} />,
                vehiculo[`m${i}_rfc`] && <Row key={`${i}r`} l={`Mant. #${i} — RFC`} v={vehiculo[`m${i}_rfc`]} />,
                vehiculo[`m${i}_np`] && <Row key={`${i}n`} l={`Mant. #${i} — N° Padrón`} v={vehiculo[`m${i}_np`]} />,
                vehiculo[`m${i}_rs`] && <Row key={`${i}s`} l={`Mant. #${i} — Razón Social`} v={vehiculo[`m${i}_rs`]} />,
              ])}
            </Sec>
          )}

          {vehiculo.numm_2025 && (
            <Sec forceState={seccionesAbiertas} t="12.2 Historial Mantenimientos 2025">
              <Row l="N° Mantenimientos 2025" v={vehiculo.numm_2025} />
              {[1,2,3].map(i=>[
                vehiculo[`m${i}t_2025`] && <Row key={`${i}t25`} l={`Mant. #${i} (2025) — Tipo`} v={vehiculo[`m${i}t_2025`]} />,
                vehiculo[`m${i}f_2025`] && <Row key={`${i}f25`} l={`Mant. #${i} (2025) — Fecha`} v={vehiculo[`m${i}f_2025`]} />,
                vehiculo[`m${i}r_2025`] && <Row key={`${i}r25`} l={`Mant. #${i} (2025) — RFC`} v={vehiculo[`m${i}r_2025`]} />,
                vehiculo[`m${i}n_2025`] && <Row key={`${i}n25`} l={`Mant. #${i} (2025) — N° Padrón`} v={vehiculo[`m${i}n_2025`]} />,
                vehiculo[`m${i}s_2025`] && <Row key={`${i}s25`} l={`Mant. #${i} (2025) — Razón Social`} v={vehiculo[`m${i}s_2025`]} />,
              ])}
            </Sec>
          )}

          <Sec forceState={seccionesAbiertas} t="13. Servicio Mecánico">
            <Row l="Gasto Mensual (COST_MEC)" v={vehiculo.cost_mec ? `$${Number(vehiculo.cost_mec).toLocaleString()}`:'-'} />
            <Row l="Tipo Arreglo (MEC_TIPO)" v={vehiculo.mec_tipo} />
            <Row l="Fecha Arreglo (MEC_FEC)" v={vehiculo.mec_fec} />
            <Row l="RFC (MEC_RFC)" v={vehiculo.mec_rfc} />
            <Row l="N° Padrón (MEC_NP)" v={vehiculo.mec_np} />
            <Row l="Razón Social (MEC_RS)" v={vehiculo.mec_rs} />
            <Row l="Gasto Anual 2025 (CM_2025)" v={vehiculo.cm_2025 ? `$${Number(vehiculo.cm_2025).toLocaleString()}`:'-'} />
            <Row l="Frecuencia 2025 (FM_2025)" v={vehiculo.fm_2025} />
            <Row l="RFC 2025 (MR_2025)" v={vehiculo.mr_2025} />
            <Row l="N° Padrón 2025 (MN_2025)" v={vehiculo.mn_2025} />
            <Row l="Razón Social 2025 (MS_2025)" v={vehiculo.ms_2025} />
            <Row l="Costo Anual Mecánico" v={vehiculo.costo_anual_mecanico ? `$${Number(vehiculo.costo_anual_mecanico).toLocaleString()}`:'-'} />
            <Row l="Frecuencia Mecánico" v={vehiculo.frecuencia_mecanico} />
            <Row l="Proveedor Mecánico" v={vehiculo.proveedor_mecanico} />
            {vehiculo.desglose_mecanico && <Row l="Desglose Mecánico" v={vehiculo.desglose_mecanico} />}
          </Sec>

          <Sec forceState={seccionesAbiertas} t="13.1 Servicio Eléctrico">
            <Row l="Costo Anual Eléctrico" v={vehiculo.costo_anual_electrico ? `$${Number(vehiculo.costo_anual_electrico).toLocaleString()}`:'-'} />
            <Row l="Frecuencia (veces/año)" v={vehiculo.frecuencia_electrico} />
            <Row l="Proveedor Eléctrico" v={vehiculo.proveedor_electrico} />
            {vehiculo.desglose_electrico && <Row l="Desglose Eléctrico" v={vehiculo.desglose_electrico} />}
          </Sec>

          {/* 14. EVIDENCIA */}
          <Sec forceState={seccionesAbiertas} t="14. Evidencia y Observaciones">
            {fotos.length > 0 && (
              <tr><td colSpan={2} className="px-4 pt-4 pb-2">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">📷 Fotos del Vehículo ({fotos.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {fotos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Foto ${i+1}`} className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition shadow-sm" />
                    </a>
                  ))}
                </div>
              </td></tr>
            )}
            {!fotos.length && <Row l="Evidencia Fotográfica" v={vehiculo.evidencia_fotografica} />}
            <Row l="Situación Jurídica" v={vehiculo.situacion_juridica} />
            {vehiculo.observaciones && (
              <tr><td colSpan={2} className="px-4 py-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Observaciones</p>
                <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3">{vehiculo.observaciones}</p>
              </td></tr>
            )}
            {vehiculo.descripcion_detallada && (
              <tr><td colSpan={2} className="px-4 py-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Información Adicional</p>
                <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3">{vehiculo.descripcion_detallada}</p>
              </td></tr>
            )}
          </Sec>

          {/* ==================== ASIGNACIONES ==================== */}
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <button
              onClick={() => setSecAsignaciones(p => !p)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-gray-50 group ${secAsignaciones ? 'bg-amber-50/50 border-b' : ''}`}
            >
              <span className="text-lg flex-shrink-0">🚗</span>
              <h3 className="font-bold flex-1 text-sm text-gray-800">15. Asignación / Uso Vehicular</h3>
              {asignacionActiva && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full animate-pulse mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> EN USO
                </span>
              )}
              {puedeAsignar && !asignacionActiva && (
                <span onClick={(e) => { e.stopPropagation(); abrirSalida(); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 text-xs font-bold transition-all shadow-sm mr-2">
                  <ArrowRightIcon className="h-3 w-3" /> Registrar Salida
                </span>
              )}
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${secAsignaciones ? 'rotate-180' : ''}`} />
            </button>

            {secAsignaciones && (
              <div>
                {/* Asignación activa */}
                {asignacionActiva ? (
                  <div className="p-4">
                    <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-amber-100/60 border-b border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                          </span>
                          <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Vehículo en uso</span>
                          <span className="text-xs text-amber-500 font-mono">#{asignacionActiva.folio}</span>
                        </div>
                        {puedeAsignar && (
                          <button onClick={abrirEntrada}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-bold transition-all shadow-sm">
                            <ArrowLeftIcon className="h-3 w-3" /> Registrar Entrada
                          </button>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <InfoMini icon="👤" label="Conductor" value={asignacionActiva.conductor_nombre} sub={asignacionActiva.conductor_cargo} />
                          <InfoMini icon="📅" label="Fecha salida" value={formatFecha(asignacionActiva.fecha_salida)} sub={asignacionActiva.hora_salida} />
                          <InfoMini icon="📍" label="Destino" value={asignacionActiva.destino || 'Sin especificar'} />
                          <InfoMini icon="🔢" label="Km salida" value={asignacionActiva.km_salida ? `${Number(asignacionActiva.km_salida).toLocaleString()} km` : '-'} />
                        </div>
                        {asignacionActiva.motivo && (
                          <div className="mt-3 text-xs text-amber-700 bg-amber-100/50 rounded-lg px-3 py-2">
                            <span className="font-semibold">Motivo:</span> {asignacionActiva.motivo}
                          </div>
                        )}
                        {(asignacionActiva.combustible_salida) && (
                          <div className="mt-2 text-xs text-gray-500">
                            ⛽ Combustible al salir: <span className="font-medium text-gray-700">{asignacionActiva.combustible_salida}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                      <CheckCircleIcon className="h-4 w-4" />
                      Vehículo disponible — sin asignación activa
                    </div>
                  </div>
                )}

                {/* Historial de asignaciones */}
                {asignaciones.length > 0 && (
                  <div className="border-t">
                    <div className="px-4 py-2.5 bg-gray-50 border-b">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Historial ({asignaciones.length})</p>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                      {asignaciones.map(a => {
                        const kmR = a.km_entrada && a.km_salida ? a.km_entrada - a.km_salida : null;
                        return (
                          <div key={a.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                              a.estado === 'en_uso' ? 'bg-amber-400 animate-pulse' :
                              a.estado === 'devuelto' ? 'bg-green-400' : 'bg-gray-300'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 text-sm truncate">{a.conductor_nombre}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  a.estado === 'en_uso' ? 'bg-amber-100 text-amber-700' :
                                  a.estado === 'devuelto' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>{a.estado === 'en_uso' ? 'En uso' : a.estado === 'devuelto' ? 'Devuelto' : 'Cancelado'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                <span>{formatFecha(a.fecha_salida)}{a.fecha_entrada ? ` → ${formatFecha(a.fecha_entrada)}` : ''}</span>
                                {a.destino && <span className="truncate">· {a.destino}</span>}
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {kmR > 0 && <p className="text-xs font-bold text-veracruz-600">{kmR.toLocaleString()} km</p>}
                              <p className="text-[10px] text-gray-300 font-mono">{a.folio}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ==================== BITÁCORA ==================== */}
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <button
              onClick={() => setSecBitacora(p => !p)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-gray-50 group ${secBitacora ? 'bg-indigo-50/50 border-b' : ''}`}
            >
              <span className="text-lg flex-shrink-0">📋</span>
              <h3 className="font-bold flex-1 text-sm text-gray-800">16. Bitácora Vehicular</h3>
              {bitacoraStats.total_eventos > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold mr-2">{bitacoraStats.total_eventos}</span>
              )}
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${secBitacora ? 'rotate-180' : ''}`} />
            </button>

            {secBitacora && (
              <div>
                {/* Controls bar */}
                <div className="px-4 py-3 bg-gray-50/80 border-b flex items-center justify-between flex-wrap gap-2">
                  {/* Filter pills */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { k:'todos', l:'Todos', emoji:'📋', sk:'total_eventos' },
                      { k:'asignacion', l:'Uso', emoji:'🚗', sk:'asignaciones' },
                      { k:'combustible', l:'Combustible', emoji:'⛽', sk:'combustible' },
                      { k:'mantenimiento', l:'Mant.', emoji:'🔧', sk:'mantenimientos' },
                      { k:'incidencia', l:'Incidencias', emoji:'⚠️', sk:'incidencias' },
                      { k:'movimiento', l:'Movimientos', emoji:'📝', sk:'movimientos' }
                    ].map(f => {
                      const count = bitacoraStats[f.sk] || 0;
                      return (
                        <button key={f.k}
                          onClick={() => setFiltroBit(f.k)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            filtroBit === f.k
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : count > 0
                                ? 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                                : 'bg-white text-gray-300 border border-gray-100 cursor-default'
                          }`}
                          disabled={count === 0 && f.k !== 'todos'}
                        >{f.emoji} {f.l}{count > 0 ? ` ${count}` : ''}</button>
                      );
                    })}
                  </div>
                  {/* Action buttons */}
                  {puedeAsignar && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { const h=new Date().toISOString().split('T')[0]; const a=new Date().toTimeString().slice(0,5); setCombForm({ fecha:h, hora:a, litros:'', costo_total:'', tipo_combustible:'gasolina_regular', km_actual:vehiculo?.kilometraje||'', estacion:'', conductor_nombre:'', cfdi:'', observaciones:'' }); setModalCombustible(true); }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold hover:bg-blue-100 transition-all">
                        ⛽ Combustible
                      </button>
                      <button onClick={() => { const h=new Date().toISOString().split('T')[0]; const a=new Date().toTimeString().slice(0,5); setIncForm({ fecha:h, hora:a, tipo:'choque', gravedad:'leve', descripcion:'', ubicacion:'', conductor_nombre:'', costo_estimado_danos:'', observaciones:'' }); setModalIncidencia(true); }}
                        className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-xs font-semibold hover:bg-orange-100 transition-all">
                        ⚠️ Incidencia
                      </button>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                {bitacora.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-3xl mb-2 opacity-40">📋</p>
                    <p className="text-sm text-gray-400">Sin eventos registrados</p>
                    <p className="text-xs text-gray-300 mt-0.5">Las asignaciones, cargas y mantenimientos aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                    {bitacora.map((ev, idx) => (
                      <BitacoraCard key={`${ev.categoria}-${ev.id}-${idx}`} ev={ev} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL REGISTRAR SALIDA ==================== */}
      {modalSalida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b bg-veracruz-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-veracruz-800 flex items-center gap-2">
                <ArrowRightIcon className="h-5 w-5" /> Registrar Salida
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {vehiculo.marca} {vehiculo.linea || vehiculo.modelo} — {vehiculo.placas}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conductor *</label>
                <input type="text" value={salidaForm.conductor_nombre}
                  onChange={e => setSalidaForm(f => ({ ...f, conductor_nombre: e.target.value }))}
                  placeholder="Nombre completo" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input type="text" value={salidaForm.conductor_cargo}
                  onChange={e => setSalidaForm(f => ({ ...f, conductor_cargo: e.target.value }))}
                  placeholder="Cargo del conductor" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha salida *</label>
                  <input type="date" value={salidaForm.fecha_salida}
                    onChange={e => setSalidaForm(f => ({ ...f, fecha_salida: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora salida *</label>
                  <input type="time" value={salidaForm.hora_salida}
                    onChange={e => setSalidaForm(f => ({ ...f, hora_salida: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Km salida *</label>
                  <input type="number" value={salidaForm.km_salida}
                    onChange={e => setSalidaForm(f => ({ ...f, km_salida: e.target.value }))}
                    placeholder="Kilometraje actual" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Combustible salida</label>
                  <select value={salidaForm.combustible_salida}
                    onChange={e => setSalidaForm(f => ({ ...f, combustible_salida: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">— Seleccionar —</option>
                    <option value="Lleno">Lleno</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="Vacío">Vacío</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destino *</label>
                <input type="text" value={salidaForm.destino}
                  onChange={e => setSalidaForm(f => ({ ...f, destino: e.target.value }))}
                  placeholder="Destino del viaje" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <textarea value={salidaForm.motivo}
                  onChange={e => setSalidaForm(f => ({ ...f, motivo: e.target.value }))}
                  placeholder="Motivo del viaje" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setModalSalida(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button onClick={registrarSalida} disabled={enviandoAsg}
                className="px-6 py-2 bg-veracruz-600 text-white rounded-lg hover:bg-veracruz-700 text-sm font-semibold disabled:opacity-50">
                {enviandoAsg ? 'Registrando...' : 'Registrar Salida'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL REGISTRAR ENTRADA ==================== */}
      {modalEntrada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b bg-green-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                <ArrowLeftIcon className="h-5 w-5" /> Registrar Entrada (Devolución)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {vehiculo.marca} {vehiculo.linea || vehiculo.modelo} — {vehiculo.placas}
              </p>
              {asignacionActiva && (
                <p className="text-xs text-amber-600 mt-1">
                  Folio: {asignacionActiva.folio} — Conductor: {asignacionActiva.conductor_nombre}
                </p>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha entrada *</label>
                  <input type="date" value={entradaForm.fecha_entrada}
                    onChange={e => setEntradaForm(f => ({ ...f, fecha_entrada: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora entrada *</label>
                  <input type="time" value={entradaForm.hora_entrada}
                    onChange={e => setEntradaForm(f => ({ ...f, hora_entrada: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Km entrada *</label>
                  <input type="number" value={entradaForm.km_entrada}
                    onChange={e => setEntradaForm(f => ({ ...f, km_entrada: e.target.value }))}
                    placeholder="Kilometraje al devolver" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Combustible entrada</label>
                  <select value={entradaForm.combustible_entrada}
                    onChange={e => setEntradaForm(f => ({ ...f, combustible_entrada: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">— Seleccionar —</option>
                    <option value="Lleno">Lleno</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="Vacío">Vacío</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de devolución</label>
                <select value={entradaForm.estado_devolucion}
                  onChange={e => setEntradaForm(f => ({ ...f, estado_devolucion: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="con_danos">Con daños</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea value={entradaForm.observaciones}
                  onChange={e => setEntradaForm(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Observaciones sobre el estado del vehículo" rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setModalEntrada(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button onClick={registrarEntrada} disabled={enviandoAsg}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:opacity-50">
                {enviandoAsg ? 'Registrando...' : 'Registrar Entrada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CARGA COMBUSTIBLE ==================== */}
      {modalCombustible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b bg-blue-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                ⛽ Registrar Carga de Combustible
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {vehiculo.marca} {vehiculo.linea || vehiculo.modelo} — {vehiculo.placas}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input type="date" value={combForm.fecha}
                    onChange={e => setCombForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <input type="time" value={combForm.hora}
                    onChange={e => setCombForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Litros *</label>
                  <input type="number" step="0.01" value={combForm.litros}
                    onChange={e => setCombForm(f => ({ ...f, litros: e.target.value }))}
                    placeholder="Ej: 45.5" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo total $</label>
                  <input type="number" step="0.01" value={combForm.costo_total}
                    onChange={e => setCombForm(f => ({ ...f, costo_total: e.target.value }))}
                    placeholder="Ej: 1200" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={combForm.tipo_combustible}
                    onChange={e => setCombForm(f => ({ ...f, tipo_combustible: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="gasolina_regular">Regular</option>
                    <option value="gasolina_premium">Premium</option>
                    <option value="diesel">Diésel</option>
                    <option value="gas_lp">Gas LP</option>
                    <option value="electrico">Eléctrico</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Km actual</label>
                  <input type="number" value={combForm.km_actual}
                    onChange={e => setCombForm(f => ({ ...f, km_actual: e.target.value }))}
                    placeholder="Kilometraje" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estación</label>
                  <input type="text" value={combForm.estacion}
                    onChange={e => setCombForm(f => ({ ...f, estacion: e.target.value }))}
                    placeholder="Nombre gasolinera" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conductor</label>
                  <input type="text" value={combForm.conductor_nombre}
                    onChange={e => setCombForm(f => ({ ...f, conductor_nombre: e.target.value }))}
                    placeholder="Quién cargó" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CFDI / Factura</label>
                  <input type="text" value={combForm.cfdi}
                    onChange={e => setCombForm(f => ({ ...f, cfdi: e.target.value }))}
                    placeholder="Folio factura" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea value={combForm.observaciones}
                  onChange={e => setCombForm(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Notas adicionales" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setModalCombustible(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button onClick={registrarCombustible} disabled={enviandoBit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-50">
                {enviandoBit ? 'Registrando...' : '⛽ Registrar Carga'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL INCIDENCIA ==================== */}
      {modalIncidencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b bg-orange-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                ⚠️ Registrar Incidencia / Siniestro
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {vehiculo.marca} {vehiculo.linea || vehiculo.modelo} — {vehiculo.placas}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input type="date" value={incForm.fecha}
                    onChange={e => setIncForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <input type="time" value={incForm.hora}
                    onChange={e => setIncForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select value={incForm.tipo}
                    onChange={e => setIncForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="choque">🚗 Choque</option>
                    <option value="robo">🔓 Robo</option>
                    <option value="vandalismo">💥 Vandalismo</option>
                    <option value="falla_mecanica">🔧 Falla mecánica</option>
                    <option value="ponchadura">🛞 Ponchadura</option>
                    <option value="inundacion">🌊 Inundación</option>
                    <option value="incendio">🔥 Incendio</option>
                    <option value="volcadura">🔄 Volcadura</option>
                    <option value="atropello">🚶 Atropello</option>
                    <option value="otro">📋 Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gravedad</label>
                  <select value={incForm.gravedad}
                    onChange={e => setIncForm(f => ({ ...f, gravedad: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="leve">🟢 Leve</option>
                    <option value="moderado">🟡 Moderado</option>
                    <option value="grave">🔴 Grave</option>
                    <option value="perdida_total">⚫ Pérdida total</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                <textarea value={incForm.descripcion}
                  onChange={e => setIncForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Describe lo que ocurrió..." rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                  <input type="text" value={incForm.ubicacion}
                    onChange={e => setIncForm(f => ({ ...f, ubicacion: e.target.value }))}
                    placeholder="Dónde ocurrió" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conductor</label>
                  <input type="text" value={incForm.conductor_nombre}
                    onChange={e => setIncForm(f => ({ ...f, conductor_nombre: e.target.value }))}
                    placeholder="Quién conducía" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo estimado daños $</label>
                  <input type="number" step="0.01" value={incForm.costo_estimado_danos}
                    onChange={e => setIncForm(f => ({ ...f, costo_estimado_danos: e.target.value }))}
                    placeholder="Monto" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <input type="text" value={incForm.observaciones}
                    onChange={e => setIncForm(f => ({ ...f, observaciones: e.target.value }))}
                    placeholder="Notas" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setModalIncidencia(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button onClick={registrarIncidencia} disabled={enviandoBit}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-semibold disabled:opacity-50">
                {enviandoBit ? 'Registrando...' : '⚠️ Registrar Incidencia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== COMPONENTES AUXILIARES ====================

function formatFecha(str) {
  if (!str) return '-';
  try {
    const d = new Date(str + (str.length === 10 ? 'T12:00:00' : ''));
    if (isNaN(d)) return str;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return str; }
}

function formatFechaHora(str) {
  if (!str) return '-';
  try {
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return str; }
}

function InfoMini({ icon, label, value, sub }) {
  return (
    <div className="bg-white/80 rounded-lg p-2.5 border border-white/50">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{icon} {label}</p>
      <p className="font-bold text-gray-800 text-sm leading-tight">{value || '-'}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function BitacoraCard({ ev }) {
  const cats = {
    asignacion: { border: 'border-l-amber-400', bg: '', icon: '🚗' },
    combustible: { border: 'border-l-blue-400', bg: '', icon: '⛽' },
    mantenimiento: { border: 'border-l-purple-400', bg: '', icon: '🔧' },
    incidencia: { border: 'border-l-red-400', bg: '', icon: '⚠️' },
    movimiento: { border: 'border-l-gray-300', bg: '', icon: '📋' },
  };
  const cat = cats[ev.categoria] || cats.movimiento;

  // === ASIGNACIÓN ===
  if (ev.categoria === 'asignacion') {
    const isEnUso = ev.estado_evento === 'en_uso';
    const isDevuelto = ev.estado_evento === 'devuelto';
    const kmR = ev.km_entrada && ev.km_salida ? ev.km_entrada - ev.km_salida : null;
    return (
      <div className={`px-4 py-3 border-l-4 ${isEnUso ? 'border-l-amber-400 bg-amber-50/30' : isDevuelto ? 'border-l-green-400' : 'border-l-gray-300'} hover:bg-gray-50/50 transition-all`}>
        <div className="flex items-center gap-2.5">
          <span className="text-base flex-shrink-0">{isEnUso ? '🔑' : isDevuelto ? '✅' : '❌'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-gray-800 text-sm">{ev.conductor_nombre}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isEnUso ? 'bg-amber-100 text-amber-700' : isDevuelto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>{isEnUso ? 'Salida' : isDevuelto ? 'Devuelto' : 'Cancelado'}</span>
              {ev.destino && <span className="text-xs text-gray-400">→ {ev.destino}</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
              <span>{formatFecha(ev.fecha_salida || ev.fecha)}{ev.hora_salida ? ` ${ev.hora_salida}` : ''}</span>
              {ev.km_salida && <span>· {Number(ev.km_salida).toLocaleString()} km</span>}
              {kmR > 0 && <span className="font-bold text-veracruz-600">({kmR.toLocaleString()} km recorridos)</span>}
            </div>
          </div>
          <span className="text-[10px] text-gray-300 font-mono flex-shrink-0">{ev.folio}</span>
        </div>
      </div>
    );
  }

  // === COMBUSTIBLE ===
  if (ev.categoria === 'combustible') {
    return (
      <div className={`px-4 py-3 border-l-4 ${cat.border} hover:bg-gray-50/50 transition-all`}>
        <div className="flex items-center gap-2.5">
          <span className="text-base flex-shrink-0">⛽</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-blue-700 text-sm">{ev.litros} L</span>
              {ev.costo_total && <span className="text-sm text-green-700 font-medium">${Number(ev.costo_total).toLocaleString()}</span>}
              {ev.tipo_combustible && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{ev.tipo_combustible.replace(/_/g, ' ')}</span>}
              {ev.conductor_nombre && <span className="text-xs text-gray-400">· {ev.conductor_nombre}</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
              {ev.estacion && <span>🏪 {ev.estacion}</span>}
              {ev.km_actual && <span>· {Number(ev.km_actual).toLocaleString()} km</span>}
              {ev.rendimiento_km_litro && <span className="text-green-600 font-semibold">· {ev.rendimiento_km_litro} km/L</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">{formatFecha(ev.fecha)}</p>
            {ev.hora && <p className="text-[10px] text-gray-300">{ev.hora}</p>}
          </div>
        </div>
      </div>
    );
  }

  // === MANTENIMIENTO ===
  if (ev.categoria === 'mantenimiento') {
    return (
      <div className={`px-4 py-3 border-l-4 ${cat.border} hover:bg-gray-50/50 transition-all`}>
        <div className="flex items-center gap-2.5">
          <span className="text-base flex-shrink-0">🔧</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                ev.estado_evento === 'completado' ? 'bg-green-100 text-green-700' :
                ev.estado_evento === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                'bg-purple-100 text-purple-700'
              }`}>{ev.tipo_mantenimiento === 'preventivo' ? 'Preventivo' : ev.tipo_mantenimiento === 'correctivo' ? 'Correctivo' : 'Mantenimiento'}</span>
              {ev.costo && <span className="text-sm font-medium text-green-700">${Number(ev.costo).toLocaleString()}</span>}
              {ev.proveedor && <span className="text-xs text-gray-400">· {ev.proveedor}</span>}
            </div>
            {ev.descripcion && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ev.descripcion}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">{formatFecha(ev.fecha)}</p>
          </div>
        </div>
      </div>
    );
  }

  // === INCIDENCIA ===
  if (ev.categoria === 'incidencia') {
    const tipoL = { choque:'Choque', robo:'Robo', vandalismo:'Vandalismo', falla_mecanica:'Falla mec.', ponchadura:'Ponchadura', inundacion:'Inundación', incendio:'Incendio', volcadura:'Volcadura', atropello:'Atropello' };
    const gravC = { leve:'text-green-600', moderado:'text-yellow-600', grave:'text-red-600', perdida_total:'text-red-800 font-bold' };
    return (
      <div className={`px-4 py-3 border-l-4 ${cat.border} hover:bg-gray-50/50 transition-all`}>
        <div className="flex items-center gap-2.5">
          <span className="text-base flex-shrink-0">⚠️</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">{tipoL[ev.tipo_incidencia] || ev.tipo_incidencia}</span>
              <span className={`text-xs capitalize ${gravC[ev.gravedad] || 'text-gray-500'}`}>{ev.gravedad}</span>
              {ev.conductor_nombre && <span className="text-xs text-gray-400">· {ev.conductor_nombre}</span>}
              {ev.costo_estimado_danos && <span className="text-xs font-semibold text-red-600">${Number(ev.costo_estimado_danos).toLocaleString()}</span>}
            </div>
            {ev.descripcion && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ev.descripcion}</p>}
            {ev.ubicacion && <p className="text-[11px] text-gray-400 mt-0.5">📍 {ev.ubicacion}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">{formatFecha(ev.fecha)}</p>
            {ev.folio && <p className="text-[10px] text-gray-300 font-mono">{ev.folio}</p>}
          </div>
        </div>
      </div>
    );
  }

  // === MOVIMIENTO (default) ===
  return (
    <div className={`px-4 py-2.5 border-l-4 ${cat.border} hover:bg-gray-50/50 transition-all`}>
      <div className="flex items-center gap-2.5">
        <span className="text-sm flex-shrink-0 opacity-50">{
          ev.tipo_movimiento === 'salida' ? '📤' :
          ev.tipo_movimiento === 'entrada' ? '📥' : '📋'
        }</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              ev.tipo_movimiento === 'salida' ? 'bg-amber-50 text-amber-600' :
              ev.tipo_movimiento === 'entrada' ? 'bg-green-50 text-green-600' :
              'bg-gray-100 text-gray-500'
            }`}>{ev.tipo_movimiento || 'Movimiento'}</span>
            {ev.usuario_nombre && <span className="text-xs text-gray-400">por {ev.usuario_nombre}</span>}
          </div>
          {ev.descripcion && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ev.descripcion}</p>}
        </div>
        <span className="text-[10px] text-gray-300 flex-shrink-0">{formatFechaHora(ev.fecha)}</span>
      </div>
    </div>
  );
}

function EditSection({ num, title, children }) {
  return (
    <div className="card">
      <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="bg-veracruz-100 text-veracruz-700 px-2 py-0.5 rounded text-sm">{num}</span>{title}
      </h2>
      {children}
    </div>
  );
}

function F({ l, n, v, h, t='text', r, p, mx, s }) {
  return (
    <div>
      <label className={`block ${s?'text-xs':'text-xs font-medium'} text-gray-600 mb-1`}>{l}</label>
      <input type={t} name={n} value={v[n]||''} onChange={h} className={`input-field ${s?'text-sm':'text-sm'}`}
        {...(r?{required:true}:{})} {...(p?{placeholder:p}:{})} {...(mx?{maxLength:mx}:{})}
        {...(t==='number'?{step:'0.01'}:{})} />
    </div>
  );
}

const secIconMap = {
  '1': '🔖', '2': '🚗', '3': '🏛️', '4': '👤', '5': '💰', '6': '📄',
  '7': '📦', '8': '📊', '9': '📍', '10': '🛡️', '11': '⛽', '12': '🔧', '13': '⚡', '14': '📸',
  '15': '🚗', '16': '📋'
};

function Sec({ t, children, defaultOpen = false, forceState = null }) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const isSubsection = /^\d+\.\d+/.test(t);
  const secNum = t.match(/^(\d+)/)?.[1] || '';
  const icon = secIconMap[secNum] || '📋';
  // forceState: 'all' = force open, 'none' = force closed, null = use local state
  const open = forceState === 'all' ? true : forceState === 'none' ? false : localOpen;
  const toggle = () => { setLocalOpen(!open); };
  
  return (
    <div className={`bg-white rounded-xl border overflow-hidden shadow-sm ${isSubsection ? 'ml-6 border-dashed' : ''}`}>
      <button
        onClick={toggle}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-gray-50 group ${
          open ? 'bg-gray-50/70 border-b' : ''
        }`}
      >
        {!isSubsection && <span className="text-lg flex-shrink-0">{icon}</span>}
        <h3 className={`font-bold flex-1 ${isSubsection ? 'text-xs text-gray-500' : 'text-sm text-gray-800'}`}>{t}</h3>
        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <table className="w-full text-sm"><tbody className="divide-y divide-gray-100">{children}</tbody></table>
      )}
    </div>
  );
}

function Row({ l, v, hi, vc='' }) {
  return (
    <tr className="flex flex-col sm:table-row">
      <td className="py-2 sm:py-3 px-4 text-gray-500 text-sm font-medium sm:w-56">{l}</td>
      <td className={`pb-3 sm:py-3 px-4 text-gray-900 ${hi?'font-bold text-lg':''} ${vc} break-words`}>{v||<span className="text-gray-300">-</span>}</td>
    </tr>
  );
}
