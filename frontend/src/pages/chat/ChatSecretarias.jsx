import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CheckIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon as ChatSolid } from '@heroicons/react/24/solid';

export default function ChatSecretarias() {
  const { user } = useAuthStore();

  // Estado principal
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMsg, setNuevoMsg] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargandoMsgsInicial, setCargandoMsgsInicial] = useState(false);
  const [busquedaConv, setBusquedaConv] = useState('');

  // Modal nueva conversación
  const [modalNueva, setModalNueva] = useState(false);
  const [secretariasDisp, setSecretariasDisp] = useState([]);
  const [busquedaSec, setBusquedaSec] = useState('');

  // Vista móvil
  const [vistaMovil, setVistaMovil] = useState('lista');

  // Refs
  const msgEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollConvRef = useRef(null);
  const pollMsgRef = useRef(null);
  const convActivaRef = useRef(null);
  const mensajesCountRef = useRef(0);
  const scrollContainerRef = useRef(null);
  const isUserScrolledUp = useRef(false);

  // Mantener ref sincronizada con state
  useEffect(() => { convActivaRef.current = conversacionActiva; }, [conversacionActiva]);

  // ═══════════════════════════════════════
  // SMART POLLING - sin flashes ni recargas
  // ═══════════════════════════════════════

  // Cargar conversaciones (silencioso en polls)
  const cargarConversaciones = useCallback(async (inicial = false) => {
    try {
      const { data } = await api.get('/chat/conversaciones');
      setConversaciones(data);
    } catch (err) {
      if (inicial) console.error('Error cargando conversaciones:', err);
    } finally {
      if (inicial) setCargandoInicial(false);
    }
  }, []);

  // Cargar mensajes (silencioso — solo muestra spinner en la primera carga)
  const cargarMensajes = useCallback(async (convId, inicial = false) => {
    if (!convId) return;
    if (inicial) setCargandoMsgsInicial(true);
    try {
      const { data } = await api.get(`/chat/mensajes/${convId}`);
      // Solo actualizar si hay cambios (evita re-render innecesario)
      if (data.length !== mensajesCountRef.current || inicial) {
        setMensajes(data);
        mensajesCountRef.current = data.length;
        // Auto-scroll solo si el usuario NO scrolleó hacia arriba
        if (!isUserScrolledUp.current) {
          setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: inicial ? 'auto' : 'smooth' }), 50);
        }
      }
    } catch (err) {
      if (inicial) console.error('Error cargando mensajes:', err);
    } finally {
      if (inicial) setCargandoMsgsInicial(false);
    }
  }, []);

  // Detectar si el usuario scrolleó hacia arriba
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isUserScrolledUp.current = !atBottom;
  }, []);

  // ═══ Polling de conversaciones: cada 3s ═══
  useEffect(() => {
    cargarConversaciones(true);
    pollConvRef.current = setInterval(() => cargarConversaciones(false), 3000);
    return () => clearInterval(pollConvRef.current);
  }, [cargarConversaciones]);

  // ═══ Polling de mensajes: cada 2s cuando hay conversación activa ═══
  useEffect(() => {
    clearInterval(pollMsgRef.current);
    if (!conversacionActiva) return;

    cargarMensajes(conversacionActiva, true);

    pollMsgRef.current = setInterval(() => {
      cargarMensajes(convActivaRef.current, false);
    }, 2000);

    return () => clearInterval(pollMsgRef.current);
  }, [conversacionActiva, cargarMensajes]);

  // Focus en input al abrir conversación
  useEffect(() => {
    if (conversacionActiva && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [conversacionActiva]);

  // ═══════════════════════════════════════
  // Abrir conversación
  // ═══════════════════════════════════════
  const abrirConversacion = (convId) => {
    if (convId === conversacionActiva) return;
    setMensajes([]);
    mensajesCountRef.current = 0;
    isUserScrolledUp.current = false;
    setConversacionActiva(convId);
    setVistaMovil('chat');
  };

  // ═══════════════════════════════════════
  // Enviar mensaje (optimistic update)
  // ═══════════════════════════════════════
  const enviarMensaje = async (e) => {
    e?.preventDefault();
    if (!nuevoMsg.trim() || !conversacionActiva || enviando) return;

    const contenido = nuevoMsg.trim();
    setNuevoMsg('');
    setEnviando(true);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Optimistic: agregar mensaje inmediatamente con indicador de envío
    const msgOptimista = {
      id: `temp-${Date.now()}`,
      conversacion_id: conversacionActiva,
      emisor_id: user?.id,
      emisor_nombre: user?.nombreCompleto || user?.nombre,
      secretaria_id: user?.secretaria_id,
      secretaria_siglas: user?.secretaria_siglas,
      contenido,
      leido: 0,
      created_at: new Date().toISOString(),
      _enviando: true
    };
    setMensajes(prev => [...prev, msgOptimista]);
    mensajesCountRef.current += 1;
    isUserScrolledUp.current = false;
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      await api.post('/chat/mensajes', {
        conversacion_id: conversacionActiva,
        contenido
      });
      // Refrescar para obtener el mensaje real del servidor
      await cargarMensajes(conversacionActiva, false);
      cargarConversaciones(false);
      inputRef.current?.focus();
    } catch (err) {
      toast.error('Error al enviar mensaje');
      setMensajes(prev => prev.filter(m => m.id !== msgOptimista.id));
      setNuevoMsg(contenido);
    } finally {
      setEnviando(false);
    }
  };

  // ═══════════════════════════════════════
  // Nueva conversación
  // ═══════════════════════════════════════
  const abrirModalNueva = async () => {
    setModalNueva(true);
    try {
      const { data } = await api.get('/chat/secretarias');
      setSecretariasDisp(data);
    } catch (err) {
      toast.error('Error cargando secretarías');
    }
  };

  const iniciarConversacion = async (secDestinoId) => {
    try {
      const { data } = await api.post('/chat/conversaciones', {
        secretaria_destino_id: secDestinoId
      });
      setModalNueva(false);
      setBusquedaSec('');
      await cargarConversaciones(false);
      abrirConversacion(data.id);
    } catch (err) {
      toast.error('Error al crear conversación');
    }
  };

  // ═══════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════
  const formatearHora = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) {
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  const formatearHoraMsg = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const getIniciales = (siglas) => (siglas || '??').substring(0, 3);

  const coloresFijos = {
    'DIF': 'bg-pink-500', 'SSP': 'bg-slate-700', 'GOB': 'bg-veracruz-600', 'SEFIPLAN': 'bg-emerald-600',
    'SALUD': 'bg-red-500', 'SEV': 'bg-blue-600', 'SEDECOP': 'bg-amber-600', 'SEDESOL': 'bg-purple-500',
    'SIOP': 'bg-orange-600', 'SEDEMA': 'bg-green-600', 'SEDARPA': 'bg-lime-700', 'PC': 'bg-red-700',
    'SECTUR': 'bg-cyan-600', 'SETRAV': 'bg-indigo-600', 'SEGOB': 'bg-gray-700', 'SECOP': 'bg-teal-600',
    'SECOM': 'bg-sky-600', 'IVEC': 'bg-violet-600', 'CAEV': 'bg-blue-800',
  };
  const coloresDefault = ['bg-veracruz-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500'];
  const getColor = (siglas, id) => coloresFijos[siglas] || coloresDefault[(id || 0) % coloresDefault.length];

  const convActual = conversaciones.find(c => c.id === conversacionActiva);
  const totalNoLeidos = conversaciones.reduce((sum, c) => sum + (c.no_leidos || 0), 0);

  const convsFiltradas = conversaciones.filter(c => {
    if (!busquedaConv) return true;
    const q = busquedaConv.toLowerCase();
    return (c.nombre_display || '').toLowerCase().includes(q) || (c.siglas_display || '').toLowerCase().includes(q);
  });

  const secsFiltradas = secretariasDisp.filter(s =>
    !busquedaSec || s.nombre.toLowerCase().includes(busquedaSec.toLowerCase()) || s.siglas.toLowerCase().includes(busquedaSec.toLowerCase())
  );

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  return (
    <div className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] flex flex-col -m-4 lg:-m-8">
      {/* Header */}
      <div className="bg-white border-b px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-veracruz-100 p-2 rounded-xl">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-veracruz-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Chat entre Secretarías
              {totalNoLeidos > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5 animate-pulse">
                  {totalNoLeidos}
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500">
              Comunicación interna • {user?.secretaria_siglas || user?.rol}
              <span className="inline-block ml-2 h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" title="Conectado"></span>
            </p>
          </div>
        </div>
        <button
          onClick={abrirModalNueva}
          className="bg-veracruz-600 text-white p-2.5 rounded-xl hover:bg-veracruz-700 transition-colors shadow-sm"
          title="Nueva conversación"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Cuerpo principal */}
      <div className="flex flex-1 overflow-hidden bg-gray-50">

        {/* ═══ Panel izquierdo: Lista de conversaciones ═══ */}
        <div className={`w-full sm:w-80 lg:w-96 bg-white border-r flex flex-col flex-shrink-0 ${
          vistaMovil === 'chat' ? 'hidden sm:flex' : 'flex'
        }`}>
          {/* Buscador */}
          <div className="p-3 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversación..."
                value={busquedaConv}
                onChange={e => setBusquedaConv(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm border-0 focus:ring-2 focus:ring-veracruz-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {cargandoInicial ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-veracruz-500"></div>
              </div>
            ) : convsFiltradas.length === 0 && !busquedaConv ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Sin conversaciones</h3>
                <p className="text-xs text-gray-400 mb-4">Inicia una nueva conversación con otra secretaría</p>
                <button
                  onClick={abrirModalNueva}
                  className="px-4 py-2 bg-veracruz-600 text-white rounded-lg text-sm font-medium hover:bg-veracruz-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 inline mr-1 -mt-0.5" />
                  Nueva conversación
                </button>
              </div>
            ) : convsFiltradas.length === 0 && busquedaConv ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                No se encontraron conversaciones
              </div>
            ) : (
              convsFiltradas.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => abrirConversacion(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${
                    conversacionActiva === conv.id ? 'bg-veracruz-50/70 border-l-[3px] border-l-veracruz-500' : 'border-l-[3px] border-l-transparent'
                  }`}
                >
                  <div className={`${getColor(conv.siglas_display, conv.id)} h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0 shadow-sm`}>
                    {getIniciales(conv.siglas_display)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${conv.no_leidos > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                        {conv.nombre_display}
                      </p>
                      <span className={`text-[10px] flex-shrink-0 ml-2 ${conv.no_leidos > 0 ? 'text-veracruz-600 font-semibold' : 'text-gray-400'}`}>
                        {formatearHora(conv.ultimo_mensaje_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate ${conv.no_leidos > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {conv.ultimo_mensaje
                          ? `${conv.ultimo_siglas ? conv.ultimo_siglas + ': ' : ''}${conv.ultimo_mensaje}`
                          : 'Sin mensajes aún'
                        }
                      </p>
                      {conv.no_leidos > 0 && (
                        <span className="bg-veracruz-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5 flex-shrink-0 ml-2">
                          {conv.no_leidos}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ═══ Panel derecho: Chat activo ═══ */}
        <div className={`flex-1 flex flex-col ${
          vistaMovil === 'lista' ? 'hidden sm:flex' : 'flex'
        }`}>
          {!conversacionActiva ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white text-center px-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border mb-6">
                <ChatSolid className="h-20 w-20 text-veracruz-100 mx-auto" />
              </div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">Chat entre Secretarías</h2>
              <p className="text-sm text-gray-400 max-w-sm mb-6">
                Selecciona una conversación o inicia una nueva para comunicarte con otra secretaría del gobierno.
              </p>
              <button
                onClick={abrirModalNueva}
                className="px-5 py-2.5 bg-veracruz-600 text-white rounded-xl text-sm font-semibold hover:bg-veracruz-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Iniciar conversación
              </button>
            </div>
          ) : (
            <>
              {/* Header del chat */}
              <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
                <button
                  onClick={() => { setVistaMovil('lista'); setConversacionActiva(null); }}
                  className="sm:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>

                <div className={`${getColor(convActual?.siglas_display, conversacionActiva)} h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0 shadow-sm`}>
                  {getIniciales(convActual?.siglas_display)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{convActual?.nombre_display}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                    <p className="text-[10px] text-gray-400">{convActual?.siglas_display} • En línea</p>
                  </div>
                </div>

                <button
                  onClick={() => cargarMensajes(conversacionActiva, false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                  title="Actualizar mensajes"
                >
                  <ArrowPathIcon className="h-4 w-4 text-gray-400 group-hover:text-veracruz-600 group-hover:rotate-180 transition-all duration-300" />
                </button>
              </div>

              {/* Mensajes */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
                style={{ backgroundColor: '#efeae2', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d5cec6\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
              >
                {cargandoMsgsInicial ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="bg-white/80 backdrop-blur rounded-xl px-6 py-4 shadow-sm flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-veracruz-500"></div>
                      <span className="text-sm text-gray-500">Cargando mensajes...</span>
                    </div>
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="bg-white/90 backdrop-blur rounded-2xl px-8 py-6 text-center shadow-sm border">
                      <FaceSmileIcon className="h-10 w-10 text-veracruz-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-700">¡Conversación nueva!</p>
                      <p className="text-xs text-gray-400 mt-1">Envía el primer mensaje a {convActual?.siglas_display}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {mensajes.map((msg, idx) => {
                      const esMio = msg.emisor_id === user?.id;
                      const prevMsg = idx > 0 ? mensajes[idx - 1] : null;
                      const mismoEmisor = prevMsg && prevMsg.emisor_id === msg.emisor_id;
                      const showDate = idx === 0 || (() => {
                        const prev = new Date(mensajes[idx - 1]?.created_at);
                        const curr = new Date(msg.created_at);
                        return prev.toDateString() !== curr.toDateString();
                      })();

                      return (
                        <div key={msg.id || idx}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="bg-white/95 text-[11px] text-gray-600 px-4 py-1.5 rounded-lg shadow-sm font-medium">
                                {new Date(msg.created_at).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </span>
                            </div>
                          )}

                          <div className={`flex ${esMio ? 'justify-end' : 'justify-start'} ${!mismoEmisor ? 'mt-3' : 'mt-0.5'}`}>
                            <div
                              className={`relative max-w-[80%] sm:max-w-[65%] rounded-xl px-3 py-2 shadow-sm ${
                                esMio
                                  ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none'
                                  : 'bg-white text-gray-800 rounded-tl-none'
                              } ${msg._enviando ? 'opacity-70' : ''}`}
                            >
                              {!esMio && !mismoEmisor && (
                                <p className="text-[11px] font-bold text-veracruz-700 mb-0.5">
                                  {msg.secretaria_siglas ? `${msg.secretaria_siglas} • ` : ''}{msg.emisor_nombre || msg.emisor_nombre_completo}
                                </p>
                              )}

                              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">{msg.contenido}</p>

                              <div className="flex items-center justify-end gap-1 -mb-0.5 mt-0.5">
                                <span className="text-[10px] text-gray-500/70">{formatearHoraMsg(msg.created_at)}</span>
                                {esMio && (
                                  msg._enviando
                                    ? <div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    : msg.leido
                                      ? <CheckCircleIcon className="h-3.5 w-3.5 text-blue-500" />
                                      : <CheckIcon className="h-3.5 w-3.5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={msgEndRef} />
                  </>
                )}
              </div>

              {/* Input de mensaje */}
              <form onSubmit={enviarMensaje} className="bg-[#f0f0f0] border-t px-3 py-2.5 flex items-end gap-2 flex-shrink-0">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={nuevoMsg}
                    onChange={e => {
                      setNuevoMsg(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        enviarMensaje();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    className="w-full px-4 py-2.5 bg-white rounded-2xl text-sm border border-gray-200 focus:ring-1 focus:ring-veracruz-500 focus:border-veracruz-500 resize-none transition-all"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!nuevoMsg.trim() || enviando}
                  className="bg-veracruz-600 text-white p-2.5 rounded-full hover:bg-veracruz-700 transition-all disabled:opacity-30 flex-shrink-0 shadow-sm active:scale-95"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ═══ Modal: Nueva conversación ═══ */}
      {modalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setModalNueva(false); setBusquedaSec(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-veracruz-100 p-2 rounded-xl">
                  <UserGroupIcon className="h-5 w-5 text-veracruz-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Nueva conversación</h3>
                  <p className="text-xs text-gray-400">Selecciona una secretaría</p>
                </div>
              </div>
              <button onClick={() => { setModalNueva(false); setBusquedaSec(''); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="px-5 py-3 border-b">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar secretaría..."
                  value={busquedaSec}
                  onChange={e => setBusquedaSec(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm border-0 focus:ring-2 focus:ring-veracruz-500 focus:bg-white transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {secsFiltradas.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <BuildingOfficeIcon className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                  No se encontraron secretarías
                </div>
              ) : (
                secsFiltradas.map(sec => {
                  const yaExiste = conversaciones.find(c => c.participantes?.some(p => p.secretaria_id === sec.id));
                  return (
                    <button
                      key={sec.id}
                      onClick={() => iniciarConversacion(sec.id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className={`${getColor(sec.siglas, sec.id)} h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0 shadow-sm`}>
                        {getIniciales(sec.siglas)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{sec.nombre}</p>
                        <p className="text-xs text-gray-400">{sec.siglas}</p>
                      </div>
                      {yaExiste ? (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Abrir</span>
                      ) : (
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-300 group-hover:text-veracruz-500 transition-colors flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
