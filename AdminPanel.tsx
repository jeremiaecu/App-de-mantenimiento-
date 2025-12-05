import React, { useState, useEffect } from 'react';
import { createUser, fetchUsers, assignOT } from './sheetService';
import { User } from '../types';
import { extractWorkOrderData } from './geminiService';
import { UserPlus, Save, Loader2, CheckCircle, ClipboardList, Upload, FileText, Trash2, AlertCircle } from 'lucide-react';

interface AssignmentRow {
  id: string;
  file: File;
  numero_ot: string;
  tecnico_asignado: string; // The selected value
  status: 'pending' | 'success' | 'error';
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'users'>('assignments');
  const [usersList, setUsersList] = useState<User[]>([]);

  // --- USER CREATION STATE ---
  const [newUser, setNewUser] = useState({ usuario: '', password: '', nombre: '' });
  const [loadingUser, setLoadingUser] = useState(false);
  const [userMessage, setUserMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- BATCH ASSIGNMENT STATE ---
  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([]);
  const [processingFiles, setProcessingFiles] = useState(false); // For extraction phase
  const [sending, setSending] = useState(false); // For sending phase
  const [fileInputKey, setFileInputKey] = useState(0);

  // Load users for the dropdown
  useEffect(() => {
    const loadData = async () => {
      const users = await fetchUsers();
      setUsersList(users);
    };
    loadData();
  }, []);

  // --- HANDLERS: USER CREATION ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingUser(true);
    setUserMessage(null);

    try {
      await createUser({ ...newUser, rol: 'tecnico' });
      setUserMessage({ type: 'success', text: 'Usuario creado correctamente.' });
      setNewUser({ usuario: '', password: '', nombre: '' });
    } catch (error) {
      setUserMessage({ type: 'error', text: 'Error al conectar con la base de datos.' });
    } finally {
      setLoadingUser(false);
    }
  };

  // --- HANDLERS: ASSIGNMENT LOGIC ---
  const processFiles = async (files: File[]) => {
    setProcessingFiles(true);
    const newRows: AssignmentRow[] = [];

    for (const file of files) {
      try {
        // 1. Extract Data
        // The service now returns tecnico_responsable AND tecnico_asignado (as alias)
        const extracted = await extractWorkOrderData(file);
        
        // 2. Auto-match Technician
        // Find a user in the list that closely matches the extracted name
        let matchedUser = '';
        const extractedName = extracted.tecnico_asignado || extracted.tecnico_responsable || '';
        
        if (extractedName) {
           const found = usersList.find(u => 
             u.nombre.toLowerCase().includes(extractedName.toLowerCase()) ||
             extractedName.toLowerCase().includes(u.nombre.toLowerCase())
           );
           if (found) matchedUser = found.nombre; // We store the Name
        }

        newRows.push({
          id: Math.random().toString(),
          file: file,
          numero_ot: extracted.numero_ot || "",
          tecnico_asignado: matchedUser, // Auto-selected if found, else empty
          status: 'pending'
        });

      } catch (error) {
        newRows.push({
          id: Math.random().toString(),
          file: file,
          numero_ot: "ERROR",
          tecnico_asignado: "",
          status: 'error'
        });
      }
    }
    
    setAssignmentRows(prev => [...prev, ...newRows]);
    setProcessingFiles(false);
    setFileInputKey(prev => prev + 1);
  };

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeRow = (id: string) => {
    setAssignmentRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: 'numero_ot' | 'tecnico_asignado', value: string) => {
    setAssignmentRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleConfirmAssignment = async () => {
    if (assignmentRows.length === 0) return;
    setSending(true);

    const updatedRows = [...assignmentRows];

    for (let i = 0; i < updatedRows.length; i++) {
      const row = updatedRows[i];
      if (row.status === 'success' || !row.numero_ot || !row.tecnico_asignado) continue;

      try {
        const success = await assignOT({
          fecha_asignacion: new Date().toLocaleDateString('es-ES'),
          numero_ot: row.numero_ot,
          tecnico_asignado: row.tecnico_asignado
        });

        updatedRows[i] = { ...row, status: success ? 'success' : 'error' };
        setAssignmentRows([...updatedRows]); // Force re-render per item
      } catch (e) {
        updatedRows[i] = { ...row, status: 'error' };
        setAssignmentRows([...updatedRows]);
      }
    }
    
    setSending(false);
    if (updatedRows.every(r => r.status === 'success')) {
        alert("¡Todas las asignaciones fueron enviadas correctamente!");
        setAssignmentRows([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-6">
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'assignments' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Asignación Masiva
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'users' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Gestión de Usuarios
        </button>
      </div>

      {/* --- TAB: ASSIGNMENTS --- */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Asignación de OTs</h2>
              <p className="text-sm text-gray-500 mt-1">Sube documentos para extraer datos y asignar técnicos automáticamente.</p>
            </div>
            
            <div className="relative">
              <input 
                key={fileInputKey}
                type="file" 
                multiple 
                accept="application/pdf,image/*" 
                onChange={handleBatchUpload} 
                className="hidden" 
                id="batch-upload"
                disabled={processingFiles || sending}
              />
              <label 
                htmlFor="batch-upload"
                className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium cursor-pointer shadow-md transition-all ${processingFiles ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {processingFiles ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {processingFiles ? 'Analizando...' : 'Cargar Archivos'}
              </label>
            </div>
          </div>

          {/* TABLE PREVIEW */}
          {assignmentRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <ClipboardList className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No hay archivos seleccionados</p>
              <p className="text-xs text-gray-400">Sube PDFs o Imágenes para comenzar</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-[20%]">Archivo</th>
                    <th className="px-4 py-3 w-[25%]">Número OT</th>
                    <th className="px-4 py-3 w-[30%]">Técnico Asignado</th>
                    <th className="px-4 py-3 w-[15%]">Estado</th>
                    <th className="px-4 py-3 w-[10%] text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {assignmentRows.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]" title={row.file.name}>
                        <div className="flex items-center gap-2">
                           <FileText className="w-4 h-4 text-gray-400" />
                           {row.file.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          value={row.numero_ot}
                          onChange={(e) => updateRow(row.id, 'numero_ot', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="P00..."
                        />
                      </td>
                      <td className="px-4 py-3">
                         <select
                           value={row.tecnico_asignado}
                           onChange={(e) => updateRow(row.id, 'tecnico_asignado', e.target.value)}
                           className={`w-full px-2 py-1.5 border rounded text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${!row.tecnico_asignado ? 'border-orange-300 bg-orange-50' : 'border-gray-300 bg-white'}`}
                         >
                           <option value="">-- Seleccionar --</option>
                           {usersList.map((u, i) => (
                             <option key={i} value={u.nombre}>{u.nombre}</option>
                           ))}
                         </select>
                      </td>
                      <td className="px-4 py-3">
                        {row.status === 'pending' && <span className="text-gray-400 text-xs italic">Pendiente</span>}
                        {row.status === 'success' && <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Enviado</span>}
                        {row.status === 'error' && <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Error</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => removeRow(row.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleConfirmAssignment}
                  disabled={sending || assignmentRows.every(r => r.status === 'success')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                   CONFIRMAR ASIGNACIÓN (ADMIN)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: USERS --- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h2>
              <p className="text-sm text-gray-500">Crear nuevas credenciales para técnicos</p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="max-w-2xl mx-auto space-y-6">
            {userMessage && (
              <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${userMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {userMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : null}
                {userMessage.text}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Nombre Completo</label>
                <input
                  type="text"
                  value={newUser.nombre}
                  onChange={e => setNewUser({ ...newUser, nombre: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Ej: Pedro Pérez"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Usuario</label>
                  <input
                    type="text"
                    value={newUser.usuario}
                    onChange={e => setNewUser({ ...newUser, usuario: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Ej: pperez"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Contraseña</label>
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Contraseña temporal"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loadingUser}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-purple-600/20"
              >
                {loadingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
