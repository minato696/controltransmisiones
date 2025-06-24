import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Tv, Building, Plus, Trash2, Edit3, Save, X, 
  Clock, Wifi, WifiOff, RefreshCw, LogOut, User, Home
} from 'lucide-react';
import { 
  getProgramasTransformados, 
  getFilialesTransformadas,
  createPrograma,
  updatePrograma,
  deletePrograma,
  createFilial,
  updateFilial,
  deleteFilial,
  sincronizarDatos,
  TIMEZONE_PERU,
  obtenerFechaPeruana,
  formatearFechaParaBackend
} from '../services/api';

const AdminPanel = ({ estadoConexion, onSincronizar }) => {
  const navigate = useNavigate();
  
  // Estados principales
  const [programas, setProgramas] = useState([]);
  const [filiales, setFiliales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'programa' | 'filial'
  const [modalAction, setModalAction] = useState(null); // 'create' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  
  // Estados para formularios
  const [programaForm, setProgramaForm] = useState({
    nombre: '',
    isActivo: true,
    diasSemana: 'LUNES',
    horario: '05:00'
  });
  
  const [filialForm, setFilialForm] = useState({
    nombre: '',
    isActivo: true
  });

  // Información del usuario admin
  const adminUsername = localStorage.getItem('admin_username') || 'admin';
  const loginTime = localStorage.getItem('admin_login_time');

  useEffect(() => {
    // Verificar autenticación
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }

    inicializarDatos();
  }, [navigate]);

  const inicializarDatos = async () => {
    setLoading(true);
    try {
      await cargarDatos();
    } catch (error) {
      console.error('Error al inicializar panel admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    try {
      setSincronizando(true);
      
      const [programasData, filialesData] = await Promise.all([
        getProgramasTransformados(),
        getFilialesTransformadas()
      ]);
      
      setProgramas(programasData);
      setFiliales(filialesData);
      setUltimaActualizacion(new Date());
      
    } catch (error) {
      throw error;
    } finally {
      setSincronizando(false);
    }
  };

  const formatearFechaHoraCompleta = (fecha) => {
    return fecha.toLocaleString('es-PE', {
      timeZone: TIMEZONE_PERU,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const sincronizarManualmente = async () => {
    if (!estadoConexion?.connected) {
      alert('No hay conexión con el backend. Verifica tu conexión e intenta nuevamente.');
      return;
    }

    try {
      setSincronizando(true);
      
      await cargarDatos();
      
      if (onSincronizar) {
        await onSincronizar();
      }
      
      alert('✅ Datos sincronizados correctamente');
    } catch (error) {
      console.error('Error en sincronización manual:', error);
      alert('❌ Error al sincronizar datos: ' + error.message);
    } finally {
      setSincronizando(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_login_time');
      localStorage.removeItem('admin_username');
      navigate('/admin');
    }
  };

  // Funciones para manejar modales
  const abrirModal = (type, action, item = null) => {
    setModalType(type);
    setModalAction(action);
    setSelectedItem(item);
    
    if (type === 'programa') {
      if (action === 'edit' && item) {
        setProgramaForm({
          nombre: item.nombre,
          isActivo: item.isActivo,
          diasSemana: item.diasSemana || 'LUNES',
          horario: item.horario || '05:00'
        });
      } else {
        setProgramaForm({
          nombre: '',
          isActivo: true,
          diasSemana: 'LUNES',
          horario: '05:00'
        });
      }
    } else if (type === 'filial') {
      if (action === 'edit' && item) {
        setFilialForm({
          nombre: item.nombre,
          isActivo: item.isActivo
        });
      } else {
        setFilialForm({
          nombre: '',
          isActivo: true
        });
      }
    }
    
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setModalType(null);
    setModalAction(null);
    setSelectedItem(null);
  };

  const guardarPrograma = async () => {
    try {
      setAdminLoading(true);
      
      const programaData = {
        nombre: programaForm.nombre,
        isActivo: programaForm.isActivo,
        diasSemana: programaForm.diasSemana,
        horario: programaForm.horario
      };

      if (modalAction === 'create') {
        const resultado = await createPrograma(programaData);
        alert(`✅ Programa "${programaForm.nombre}" creado exitosamente`);
      } else {
        const resultado = await updatePrograma(selectedItem.id, programaData);
        alert(`✅ Programa "${programaForm.nombre}" actualizado exitosamente`);
      }
      
      cerrarModal();
      await cargarDatos();
      if (onSincronizar) await onSincronizar();
      
    } catch (error) {
      console.error('Error al guardar programa:', error);
      const errorMessage = error.response?.data?.message || error.message;
      alert('❌ Error: ' + errorMessage);
    } finally {
      setAdminLoading(false);
    }
  };

  const guardarFilial = async () => {
    try {
      setAdminLoading(true);
      
      const filialData = {
        nombre: filialForm.nombre.toUpperCase(),
        isActivo: filialForm.isActivo
      };

      if (modalAction === 'create') {
        const resultado = await createFilial(filialData);
        alert(`✅ Filial "${filialForm.nombre}" creada exitosamente`);
      } else {
        const resultado = await updateFilial(selectedItem.id, filialData);
        alert(`✅ Filial "${filialForm.nombre}" actualizada exitosamente`);
      }
      
      cerrarModal();
      await cargarDatos();
      if (onSincronizar) await onSincronizar();
      
    } catch (error) {
      console.error('Error al guardar filial:', error);
      alert('❌ Error al guardar filial: ' + error.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const eliminarPrograma = async (programa) => {
    if (window.confirm(`¿Estás seguro de eliminar el programa "${programa.nombre}"?`)) {
      try {
        setAdminLoading(true);
        await deletePrograma(programa.id);
        alert(`✅ Programa "${programa.nombre}" eliminado exitosamente`);
        await cargarDatos();
        if (onSincronizar) await onSincronizar();
      } catch (error) {
        console.error('Error al eliminar programa:', error);
        alert('❌ Error al eliminar programa: ' + error.message);
      } finally {
        setAdminLoading(false);
      }
    }
  };

  const eliminarFilial = async (filial) => {
    if (window.confirm(`¿Estás seguro de eliminar la filial "${filial.nombre}"?`)) {
      try {
        setAdminLoading(true);
        await deleteFilial(filial.id);
        alert(`✅ Filial "${filial.nombre}" eliminada exitosamente`);
        await cargarDatos();
        if (onSincronizar) await onSincronizar();
      } catch (error) {
        console.error('Error al eliminar filial:', error);
        alert('❌ Error al eliminar filial: ' + error.message);
      } finally {
        setAdminLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
          <p className="text-sm text-blue-600">Zona horaria: {TIMEZONE_PERU}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Panel de Administración
                </h1>
                
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  estadoConexion?.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {estadoConexion?.connected ? (
                    <Wifi className="w-3 h-3" />
                  ) : (
                    <WifiOff className="w-3 h-3" />
                  )}
                  {estadoConexion?.connected ? 'Backend Online' : 'Backend Offline'}
                </div>

                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  <Clock className="w-3 h-3" />
                  {TIMEZONE_PERU}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>{programas.length} programas</span>
                <span>{filiales.length} filiales</span>
                {ultimaActualizacion && (
                  <span>Actualizado: {formatearFechaHoraCompleta(ultimaActualizacion)}</span>
                )}
              </div>

              {/* Info del usuario */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">Conectado como: <strong>{adminUsername}</strong></span>
                </div>
                {loginTime && (
                  <span className="text-gray-500">
                    Sesión iniciada: {new Date(loginTime).toLocaleString('es-PE', {timeZone: TIMEZONE_PERU})}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Home className="w-4 h-4" />
                Volver al Sistema
              </button>

              <button
                onClick={sincronizarManualmente}
                disabled={sincronizando || !estadoConexion?.connected}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                  sincronizando
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : estadoConexion?.connected
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
                {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gestión de Programas */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Tv className="w-6 h-6 text-blue-600" />
                Programas ({programas.length})
              </h2>
              <button
                onClick={() => abrirModal('programa', 'create')}
                disabled={adminLoading || !estadoConexion?.connected}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Nuevo Programa
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {programas.map(programa => (
                <div key={programa.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{programa.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      🕐 {programa.horario} • 📅 {programa.diasSemana} • 
                      <span className={programa.isActivo ? 'text-green-600' : 'text-red-600'}>
                        {programa.isActivo ? ' ✅ Activo' : ' ❌ Inactivo'}
                      </span>
                    </p>
                    {programa.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Creado: {programa.createdAt}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirModal('programa', 'edit', programa)}
                      disabled={adminLoading || !estadoConexion?.connected}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      title="Editar programa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminarPrograma(programa)}
                      disabled={adminLoading || !estadoConexion?.connected}
                      className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Eliminar programa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gestión de Filiales */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Building className="w-6 h-6 text-green-600" />
                Filiales ({filiales.length})
              </h2>
              <button
                onClick={() => abrirModal('filial', 'create')}
                disabled={adminLoading || !estadoConexion?.connected}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Nueva Filial
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filiales.map(filial => (
                <div key={filial.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{filial.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      <span className={filial.isActivo ? 'text-green-600' : 'text-red-600'}>
                        {filial.isActivo ? '✅ Activa' : '❌ Inactiva'}
                      </span>
                    </p>
                    {filial.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Creado: {filial.createdAt}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirModal('filial', 'edit', filial)}
                      disabled={adminLoading || !estadoConexion?.connected}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      title="Editar filial"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminarFilial(filial)}
                      disabled={adminLoading || !estadoConexion?.connected}
                      className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Eliminar filial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Información del sistema */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">Estado del Sistema de Administración</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${estadoConexion?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-gray-700">
                    {estadoConexion?.connected ? 'Backend Online' : 'Backend Offline'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700">
                    {programas.length} Programas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-700">
                    {filiales.length} Filiales
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span className="text-gray-700">
                    {TIMEZONE_PERU}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal para crear/editar */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {modalAction === 'create' ? 'Crear' : 'Editar'} {modalType === 'programa' ? 'Programa' : 'Filial'}
                  </h3>
                  <button onClick={cerrarModal}>
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Clock className="w-4 h-4" />
                    <span>Zona horaria: {TIMEZONE_PERU}</span>
                  </div>
                </div>

                {modalType === 'programa' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Programa
                      </label>
                      <input
                        type="text"
                        value={programaForm.nombre}
                        onChange={(e) => setProgramaForm({...programaForm, nombre: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: EXITOSA NOTICIAS"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario
                      </label>
                      <input
                        type="time"
                        value={programaForm.horario}
                        onChange={(e) => setProgramaForm({...programaForm, horario: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Días de la Semana
                      </label>
                      <select
                        value={programaForm.diasSemana}
                        onChange={(e) => setProgramaForm({...programaForm, diasSemana: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="LUNES">Lunes</option>
                        <option value="MARTES">Martes</option>
                        <option value="MIERCOLES">Miércoles</option>
                        <option value="JUEVES">Jueves</option>
                        <option value="VIERNES">Viernes</option>
                        <option value="SABADO">Sábado</option>
                        <option value="DOMINGO">Domingo</option>
                        <option value="DIARIO">Diario</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="programaActivo"
                        checked={programaForm.isActivo}
                        onChange={(e) => setProgramaForm({...programaForm, isActivo: e.target.checked})}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="programaActivo" className="ml-2 text-sm text-gray-700">
                        Programa activo
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la Filial
                      </label>
                      <input
                        type="text"
                        value={filialForm.nombre}
                        onChange={(e) => setFilialForm({...filialForm, nombre: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Ej: LIMA, AREQUIPA, CUSCO"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="filialActiva"
                        checked={filialForm.isActivo}
                        onChange={(e) => setFilialForm({...filialForm, isActivo: e.target.checked})}
                        className="h-4 w-4 text-green-600 rounded"
                      />
                      <label htmlFor="filialActiva" className="ml-2 text-sm text-gray-700">
                        Filial activa
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={cerrarModal}
                    disabled={adminLoading}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={modalType === 'programa' ? guardarPrograma : guardarFilial}
                    disabled={adminLoading || (modalType === 'programa' ? !programaForm.nombre : !filialForm.nombre)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {adminLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    <Save className="w-4 h-4" />
                    {modalAction === 'create' ? 'Crear' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;