import React, { useState, useEffect } from 'react';
import { extractWorkOrderData } from '../services/geminiService';
import { assignOT } from '../services/sheetService';
import { User } from '../types';
import { CheckCircle, Upload, Trash2, Loader2, FileText } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
}

export function AdminAssignmentPanel({ users }: AdminPanelProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const processFiles = async (newFiles: File[]) => {
    setLoading(true);
    const newAssignments = [];
    try {
      for (const file of newFiles) {
        try {
          const extracted = await extractWorkOrderData(file);
          const rawName = extracted.tecnico_asignado || "";
          
          newAssignments.push({
            id: Math.random().toString(),
            fileName: file.name,
            numero_ot: extracted.numero_ot || "",
            tecnico_asignado: rawName ? toTitleCase(rawName) : "",
            // NUEVOS CAMPOS EXTRAÍDOS
            nombre_equipo: extracted.nombre_equipo || "",
            codigo_activo: extracted.codigo_activo || ""
          });
        } catch (e) {
          console.error(e);
        }
      }
      setAssignments(prev => [...prev, ...newAssignments]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (assignments.length === 0) return;
    
    let count = 0;
    for (const item of assignments) {
      if (item.numero_ot) {
        await assignOT({
          fecha_asignacion: new Date().toLocaleDateString('es-ES'),
          numero_ot: item.numero_ot,
          tecnico_asignado: item.tecnico_asignado,
          nombre_equipo: item.nombre_equipo,
          codigo_activo: item.codigo_activo,
          fecha_limite: new Date().toLocaleDateString('es-ES') // Default placeholder
        });
        count++;
      }
    }
    
    if (count > 0) {
      setAssignments([]); 
      setSuccessMsg(`✅ ¡ÉXITO! ${count} Órdenes Asignadas.`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" /> Asignación Detallada
        </h2>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded shadow-sm flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <span className="text-xl font-bold">{successMsg}</span>
        </div>
      )}
      
      <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl p-8 text-center mb-6 hover:bg-blue-50 transition-colors">
        <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))} className="hidden" id="admin-upload" disabled={loading} />
        <label htmlFor="admin-upload" className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">
          {loading ? <Loader2 className="animate-spin" /> : <Upload className="w-5 h-5" />}
          {loading ? "Analizando..." : "Cargar Archivos"}
        </label>
      </div>

      {assignments.length > 0 && (
        <div className="border rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-left bg-white min-w-[800px]">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="py-3 px-2 text-xs font-bold text-gray-600">OT</th>
                <th className="py-3 px-2 text-xs font-bold text-gray-600">Equipo</th>
                <th className="py-3 px-2 text-xs font-bold text-gray-600">Cód. Activo</th>
                <th className="py-3 px-2 text-xs font-bold text-gray-600">Técnico</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((row, i) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="p-2"><input type="text" value={row.numero_ot} onChange={(e)=>{const n=[...assignments];n[i].numero_ot=e.target.value;setAssignments(n)}} className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 w-full text-sm"/></td>
                  <td className="p-2"><input type="text" value={row.nombre_equipo} onChange={(e)=>{const n=[...assignments];n[i].nombre_equipo=e.target.value;setAssignments(n)}} className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 w-full text-sm"/></td>
                  <td className="p-2"><input type="text" value={row.codigo_activo} onChange={(e)=>{const n=[...assignments];n[i].codigo_activo=e.target.value;setAssignments(n)}} className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 w-full text-sm"/></td>
                  <td className="p-2"><input type="text" value={row.tecnico_asignado} onChange={(e)=>{const n=[...assignments];n[i].tecnico_asignado=e.target.value;setAssignments(n)}} className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 w-full text-sm font-bold"/></td>
                  <td className="p-2 text-center"><button onClick={()=>setAssignments(assignments.filter(a=>a.id!==row.id))} className="text-red-500"><Trash2 className="w-4 h-4"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 flex justify-end">
            <button onClick={handleConfirm} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> 🚀 ASIGNAR ÓRDENES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}