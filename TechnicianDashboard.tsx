import React, { useState, useEffect } from 'react';
import { fetchPlanning, User } from '../services/sheetService';
import { Calendar, ClipboardList, Camera, Search, Box, Tag, CheckCircle, Trash2 } from 'lucide-react';

interface Props {
  user: User;
  onExecute: (otNumber: string) => void;
}

export function TechnicianDashboard({ user, onExecute }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [hiddenTasks, setHiddenTasks] = useState<string[]>([]); // Para ocultar localmente

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const allTasks = await fetchPlanning();
    
    let filteredTasks = allTasks;

    // Si es técnico, filtrar por su nombre
    if (user.rol !== 'admin') {
      filteredTasks = allTasks.filter(t => 
        t.tecnico_asignado && 
        t.tecnico_asignado.toLowerCase().includes(user.nombre.toLowerCase().split(" ")[0])
      );
    }

    // Ordenar por prioridad
    filteredTasks.sort((a, b) => {
      const priority = { URGENTE: 0, PENDIENTE: 1, ENTREGADO: 2 };
      return (priority[a.estado as keyof typeof priority] || 99) - (priority[b.estado as keyof typeof priority] || 99);
    });

    setTasks(filteredTasks);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'URGENTE': return 'bg-red-100 text-red-700 border-red-200';
      case 'ENTREGADO': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Ocultar tarea visualmente (limpiar tablero)
  const hideTask = (otNumber: string) => {
    if (window.confirm("¿Quitar esta tarea completada de tu vista?")) {
      setHiddenTasks(prev => [...prev, otNumber]);
    }
  };

  const visibleTasks = tasks.filter(t => 
    !hiddenTasks.includes(t.numero_ot) &&
    JSON.stringify(t).toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando tus asignaciones...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" />
          {user.rol === 'admin' ? 'Monitor Global' : 'Mis Pendientes'}
        </h2>
        
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar OT o Equipo..." 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">¡Todo al día! No tienes tareas pendientes visibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleTasks.map((task, index) => (
            <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${task.estado === 'URGENTE' ? 'bg-red-500' : task.estado === 'ENTREGADO' ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
              
              {/* CABECERA: Estado y Fecha */}
              <div className="flex justify-between items-start mb-3 pl-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusColor(task.estado)}`}>
                  {task.estado || 'PENDIENTE'}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {task.fecha_limite}
                  </span>
                </div>
              </div>

              {/* CUERPO: Datos Técnicos */}
              <div className="pl-3 mb-4">
                <h3 className="text-xl font-black text-gray-800 tracking-tight mb-1">{task.numero_ot}</h3>
                
                {/* NUEVO: Equipo y Código */}
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 mt-2">
                  <div className="flex items-start gap-2 mb-1">
                    <Box className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span className="text-sm font-bold text-gray-700 leading-tight">
                      {task.nombre_equipo || "Equipo no especificado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                      {task.codigo_activo || "S/C"}
                    </span>
                  </div>
                </div>
                
                {user.rol === 'admin' && (
                  <p className="text-xs text-gray-400 mt-2 text-right">Asignado a: {task.tecnico_asignado}</p>
                )}
              </div>

              {/* PIE: Botones de Acción */}
              <div className="pl-3 pt-2 border-t border-gray-50 flex gap-2">
                {task.estado !== 'ENTREGADO' ? (
                  <button 
                    onClick={() => onExecute(task.numero_ot)}
                    className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    SUBIR FOTO
                  </button>
                ) : (
                  // Botón de Limpieza (Solo si está entregado)
                  <button 
                    onClick={() => hideTask(task.numero_ot)}
                    className="w-full bg-gray-100 text-gray-500 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-200 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ocultar de la lista
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}