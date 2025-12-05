import React, { useState, useEffect } from 'react';
import { fetchPlanning, User } from './sheetService';
import { Calendar, ClipboardList, Camera, Search, Box, Tag, Archive, CheckCircle, X } from 'lucide-react';

interface Props {
  user: User;
  onExecute: (otNumber: string) => void;
}

export function TechnicianDashboard({ user, onExecute }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  // Estado para saber qué tarjeta se está intentando borrar (Paso intermedio)
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Cargar lista negra
  const [hiddenTasks, setHiddenTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hiddenTasks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const allTasks = await fetchPlanning();
      
      let filteredTasks = allTasks;

      if (user.rol !== 'admin') {
        const myName = user.nombre.toLowerCase().trim();
        filteredTasks = allTasks.filter(t => 
          t.tecnico_asignado && 
          (t.tecnico_asignado.toLowerCase().includes(myName) || myName.includes(t.tecnico_asignado.toLowerCase()))
        );
      }

      // FILTRO DE OCULTOS
      const visibleTasks = filteredTasks.filter(t => !hiddenTasks.includes(t.numero_ot));

      visibleTasks.sort((a, b) => {
        const priority = { URGENTE: 0, PENDIENTE: 1, ENTREGADO: 2 };
        return (priority[a.estado as keyof typeof priority] || 99) - (priority[b.estado as keyof typeof priority] || 99);
      });

      setTasks(visibleTasks);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- PASO 1: PEDIR CONFIRMACIÓN ---
  const requestArchive = (e: React.MouseEvent, otNumber: string) => {
    e.stopPropagation();
    setConfirmingId(otNumber); // Activa el modo confirmación para ESTA tarjeta
  };

  // --- PASO 2: EJECUTAR ARCHIVADO ---
  const confirmArchive = (e: React.MouseEvent, otNumber: string) => {
    e.stopPropagation();
    
    // Guardar en memoria
    const newHidden = [...hiddenTasks, otNumber];
    localStorage.setItem('hiddenTasks', JSON.stringify(newHidden));
    setHiddenTasks(newHidden);
    
    // Borrar visualmente
    setTasks(currentTasks => currentTasks.filter(t => t.numero_ot !== otNumber));
    setConfirmingId(null);
  };

  // --- CANCELAR ---
  const cancelArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'URGENTE': return 'bg-red-100 text-red-700 border-red-200';
      case 'ENTREGADO': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const displayTasks = tasks.filter(t => 
    JSON.stringify(t).toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" /> Mis Pendientes
        </h2>
        
        <button 
          onClick={() => {
            // Aquí usamos confirm nativo porque es una acción de debug, 
            // pero si falla no es crítico.
            localStorage.removeItem('hiddenTasks');
            setHiddenTasks([]);
            loadTasks();
          }}
          className="text-xs text-gray-400 hover:text-blue-600 underline cursor-pointer"
        >
          Restaurar ocultas
        </button>
      </div>

      {displayTasks.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tienes tareas pendientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTasks.map((task, index) => (
            <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${task.estado === 'URGENTE' ? 'bg-red-500' : task.estado === 'ENTREGADO' ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
              
              <div className="flex justify-between items-start mb-3 pl-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusColor(task.estado)}`}>
                  {task.estado || 'PENDIENTE'}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {task.fecha_limite}
                </span>
              </div>

              <div className="pl-3 mb-4">
                <h3 className="text-xl font-black text-gray-800 tracking-tight mb-2">{task.numero_ot}</h3>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
                  <div className="flex items-start gap-2">
                    <Box className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span className="text-sm font-bold text-gray-700">{task.nombre_equipo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-mono text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">{task.codigo_activo}</span>
                  </div>
                </div>
              </div>

              <div className="pl-3 pt-2 border-t border-gray-50 flex gap-2 h-12 items-center">
                {task.estado !== 'ENTREGADO' ? (
                  <button 
                    onClick={() => onExecute(task.numero_ot)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm h-full"
                  >
                    <Camera className="w-4 h-4" /> SUBIR FOTO
                  </button>
                ) : (
                  // --- LÓGICA DE BOTÓN DE DOS PASOS (SIN POPUP) ---
                  confirmingId === task.numero_ot ? (
                    <div className="flex gap-2 w-full h-full animate-in fade-in zoom-in duration-200">
                      <button 
                        onClick={(e) => confirmArchive(e, task.numero_ot)}
                        className="flex-1 bg-red-500 text-white rounded-lg font-bold text-xs hover:bg-red-600 flex items-center justify-center"
                      >
                        ¿CONFIRMAR?
                      </button>
                      <button 
                        onClick={cancelArchive}
                        className="w-10 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => requestArchive(e, task.numero_ot)}
                      className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg font-bold text-sm hover:bg-purple-200 transition-colors flex items-center justify-center gap-2 border border-purple-200 h-full"
                    >
                      <Archive className="w-4 h-4" /> 🗂️ ARCHIVAR
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
