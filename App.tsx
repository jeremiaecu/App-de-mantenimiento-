import React, { useState, useEffect } from 'react';
// CORRECCIÓN: Quitamos "/components/" y "/services/" porque todo está junto
import { Sidebar } from './Sidebar';
import { WorkOrderTable } from './WorkOrderTable';
import { AdminAssignmentPanel } from './AdminAssignmentPanel';
import { TechnicianDashboard } from './TechnicianDashboard';
import { PlanningTable } from './PlanningTable'; 
import { KPIDashboard } from './KPIDashboard';
import { Login } from './Login';
import { fetchUsers, fetchHistory, fetchPlanning, syncWithGoogleSheet, User, OTData } from './sheetService';
import { extractWorkOrderData } from './geminiService';
import { Search, RefreshCw, Menu, Camera, Loader2, BarChart3, ClipboardList, PenTool, PieChart } from 'lucide-react';
import ChatAssistant from './ChatAssistant';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [ots, setOts] = useState<OTData[]>([]);
  const [planning, setPlanning] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [currentView, setCurrentView] = useState<'history' | 'assign' | 'planning' | 'tracking' | 'dashboard'>('history');
  
  const [otSearch, setOtSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginError, setLoginError] = useState('');

  // --- LÓGICA DE PERMISOS (Aquí está la clave) ---
  const isAdmin = (u: User | null) => {
    if (!u || !u.rol) return false;
    const r = u.rol.toLowerCase().trim();
    // Detecta: "Supervisor...", "Analista...", o "admin"
    return r.includes('supervisor') || r.includes('analista') || r === 'admin';
  };

  useEffect(() => {
    loadUsers();
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) {
      if (currentView === 'history') loadHistory();
      if (currentView === 'planning' || currentView === 'tracking') loadPlanning();
    }
  }, [user, currentView]);

  const loadUsers = async () => {
    const data = await fetchUsers();
    setUsers(data);
  };

  const loadHistory = async () => {
    setLoading(true);
    const data = await fetchHistory();
    setOts(data);
    setLoading(false);
  };

  const loadPlanning = async () => {
    setLoading(true);
    const data = await fetchPlanning();
    setPlanning(data);
    setLoading(false);
  };

  const handleProcessImages = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    
    let count = 0;
    try {
      for (const file of files) {
        const extracted = await extractWorkOrderData(file);
        
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const payload = {
          numero_ot: extracted.numero_ot || otSearch || "S/N",
          tipo_ot: extracted.tipo_ot || "REALIZADO",
          nombre_equipo: extracted.nombre_equipo || "",
          area: extracted.area || "",
          grupo: extracted.grupo || "",
          subgrupo: extracted.subgrupo || "",
          codigo_activo: extracted.codigo_activo || "",
          tecnico_responsable: extracted.tecnico_asignado || user?.nombre || "Técnico",
          fecha_procesada: new Date().toLocaleDateString('es-ES') + ' ' + new Date().toLocaleTimeString('es-ES'),
          usuario_registro: user?.usuario,
          imagen_base64: base64,
          imagen_tipo: file.type
        };

        await syncWithGoogleSheet(payload);
        count++;
      }
      
      if (count > 0) {
        alert(`✅ Éxito: ${count} OTs subidas.`);
        loadHistory();
        setOtSearch('');
      }
    } catch (error) {
      alert("❌ Error al subir imágenes.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogin = (e: React.FormEvent, u: string, p: string) => {
    const foundUser = users.find(dbUser => 
      dbUser.usuario.toLowerCase().trim() === u.toLowerCase().trim() && 
      String(dbUser.password).trim() === p.trim()
    );

    if (foundUser) {
      setUser(foundUser);
      sessionStorage.setItem('user', JSON.stringify(foundUser));
      setLoginError('');
      
      // Si es Jefe (Supervisor/Analista), va directo al Dashboard de KPIs
      if (isAdmin(foundUser)) {
        setCurrentView('dashboard'); 
      } else {
        setCurrentView('planning');
      }
    } else {
      setLoginError('Credenciales incorrectas');
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    setCurrentView('history');
    setLoginError('');
  };

  const filteredData = ots.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(otSearch.toLowerCase())
    )
  );

  if (!user) return <Login onLogin={handleLogin} error={loginError} />;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div className={`fixed md:static z-50 h-full transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
         <Sidebar 
            user={user} 
            onLogout={handleLogout} 
            currentView={currentView}
            onNavigate={(view) => {
              setCurrentView(view as any);
              setIsMobileMenuOpen(false);
            }}
         />
      </div>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
               <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 hidden md:block">
              {isAdmin(user) ? 'Supervisión Mantenimiento' : 'Panel Técnico'}
            </h1>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto w-full md:w-auto">
            
            {/* BOTONES VISIBLES SOLO PARA JEFES (Supervisor/Analista) */}
            {isAdmin(user) && (
              <>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-2 ${currentView === 'dashboard' ? 'bg-white shadow-sm text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <PieChart className="w-4 h-4" /> KPIs
                </button>
                <button
                  onClick={() => setCurrentView('assign')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-2 ${currentView === 'assign' ? 'bg-white shadow-sm text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <PenTool className="w-4 h-4" /> Asignar
                </button>
                <button
                  onClick={() => setCurrentView('tracking')}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-2 ${currentView === 'tracking' ? 'bg-white shadow-sm text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <BarChart3 className="w-4 h-4" /> Planeación
                </button>
              </>
            )}

            {/* BOTÓN SOLO PARA TÉCNICOS */}
            {!isAdmin(user) && (
              <button
                onClick={() => setCurrentView('planning')}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-2 ${currentView === 'planning' ? 'bg-white shadow-sm text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <ClipboardList className="w-4 h-4" /> Mis Pendientes
              </button>
            )}

            {/* BOTÓN PARA TODOS */}
            <button
              onClick={() => setCurrentView('history')}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-2 ${currentView === 'history' ? 'bg-white shadow-sm text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Bitácora Histórica
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          
          {/* RENDERIZADO DE LAS VISTAS */}
          
          {currentView === 'dashboard' && isAdmin(user) && (
            <KPIDashboard />
          )}

          {currentView === 'assign' && isAdmin(user) && (
            <AdminAssignmentPanel users={users} />
          )}

          {currentView === 'tracking' && isAdmin(user) && (
            <PlanningTable />
          )}

          {currentView === 'planning' && !isAdmin(user) && (
            <TechnicianDashboard 
              user={user} 
              onExecute={(otNumber) => {
                setOtSearch(otNumber); 
                setCurrentView('history'); 
              }} 
            />
          )}

          {currentView === 'history' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={otSearch}
                    onChange={(e) => setOtSearch(e.target.value)}
                    placeholder="Buscar OT, Equipo, Técnico..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="file" multiple accept="image/*"
                      onChange={(e) => e.target.files && handleProcessImages(Array.from(e.target.files))}
                      className="hidden" id="tech-upload" disabled={uploading}
                    />
                    <label htmlFor="tech-upload" className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold shadow-md transition-transform active:scale-95 cursor-pointer ${uploading ? 'bg-gray-400 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                      {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Camera className="w-5 h-5" />}
                      <span>{uploading ? "Procesando..." : "Subir OT"}</span>
                    </label>
                  </div>
                  <button onClick={loadHistory} disabled={loading} className="flex items-center gap-2 text-gray-600 font-medium hover:bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Actualizar</span>
                  </button>
                </div>
              </div>
              <WorkOrderTable data={filteredData} />
            </div>
          )}

        </div>
      </main>
      <ChatAssistant />
    </div>
  );
}

export default App;
