import React from 'react';
import { OTData } from '../services/sheetService';
import { Eye, EyeOff, FileText, Calendar, User, Box, Tag, Layers } from 'lucide-react';

interface WorkOrderTableProps {
  data: OTData[];
  onRefresh?: () => void;
  loading?: boolean;
}

export function WorkOrderTable({ data, loading }: WorkOrderTableProps) {
  
  if (loading) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Cargando bitácora...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center flex flex-col items-center">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">No hay registros</h3>
        <p className="text-gray-500 text-sm mt-1">La bitácora está vacía o no coincide con tu búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Fecha
              </th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">OT</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Equipo</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Activo</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Técnico</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Área</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Evidencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors group">
                
                {/* 1. FECHA */}
                <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                  {row.fecha_procesada || "N/A"}
                </td>

                {/* 2. TIPO */}
                <td className="py-4 px-6">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                    row.tipo_ot?.toUpperCase().includes('CORRECTIVA') 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {row.tipo_ot || "GENERAL"}
                  </span>
                </td>

                {/* 3. OT */}
                <td className="py-4 px-6">
                  <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {row.numero_ot}
                  </span>
                </td>

                {/* 4. EQUIPO */}
                <td className="py-4 px-6 text-sm text-gray-700 max-w-[200px] truncate" title={row.nombre_equipo}>
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-gray-400" />
                    {row.nombre_equipo || "--"}
                  </div>
                </td>

                {/* 5. ACTIVO (CÓDIGO) */}
                <td className="py-4 px-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3 text-gray-400" />
                    {row.codigo_activo || "--"}
                  </div>
                </td>

                {/* 6. TÉCNICO */}
                <td className="py-4 px-6 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {row.tecnico_responsable}
                  </div>
                </td>

                {/* 7. ÁREA */}
                <td className="py-4 px-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" />
                    {row.area || "--"}
                  </div>
                </td>

                {/* 8. EVIDENCIA (LINK) - SIN COLUMNA DE REGISTRO DESPUÉS */}
                <td className="py-4 px-6 text-center">
                  {row.evidencia_url && row.evidencia_url.startsWith('http') ? (
                    <a 
                      href={row.evidencia_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-bold text-xs border border-blue-200 shadow-sm"
                    >
                      <Eye className="w-3 h-3" /> Ver
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-300 rounded-lg text-xs font-medium border border-gray-100 cursor-not-allowed">
                      <EyeOff className="w-3 h-3" /> --
                    </span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}