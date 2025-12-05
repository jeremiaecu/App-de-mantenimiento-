import React, { useState, useEffect } from 'react';
import { fetchPlanning } from './sheetService';
import { Search, Eye, EyeOff } from 'lucide-react';

export function PlanningTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchPlanning();
        // FILTRO DE LIMPIEZA: Ocultar filas vacías o N/A
        const cleanData = res.filter((row: any) => 
          row.numero_ot && row.numero_ot !== "N/A" && row.numero_ot.trim() !== ""
        );
        setData(cleanData);
      } catch (error) {
        console.error("Error loading planning:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = data.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    if (status === 'URGENTE') return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">URGENTE</span>;
    if (status === 'ENTREGADO') return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">ENTREGADO</span>;
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200">PENDIENTE</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>📊</span> Seguimiento de Planificación
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            type="text" placeholder="Buscar OT, Técnico..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm w-64 focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="py-4 px-4 text-xs font-bold text-gray-600 uppercase">OT</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-600 uppercase">Equipo</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-600 uppercase">Técnico</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-600 uppercase">Asignado</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-600 uppercase">Límite</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-600 uppercase text-center">Estado</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-600 uppercase text-center">Evidencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">Cargando datos...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay registros activos.</td></tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-gray-800">{row.numero_ot}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    <div className="font-bold text-gray-900">{row.nombre_equipo}</div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">{row.codigo_activo}</div>
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-700">{row.tecnico_asignado}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{row.fecha_asignacion}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{row.fecha_limite}</td>
                  <td className="py-4 px-4 text-center">{getStatusBadge(row.estado)}</td>
                  
                  <td className="py-4 px-4 text-center">
                    {row.evidencia_url && row.evidencia_url.startsWith('http') ? (
                      <a 
                        href={row.evidencia_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-bold text-xs border border-blue-200"
                      >
                        <Eye className="w-3 h-3" /> Ver Foto
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-medium border border-gray-200 cursor-not-allowed">
                        <EyeOff className="w-3 h-3" /> --
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
