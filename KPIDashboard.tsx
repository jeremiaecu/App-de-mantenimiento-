import React, { useState, useEffect } from 'react';
import { fetchHistory, fetchPlanning } from '../services/sheetService';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Filter, ArrowDown, ArrowUp } from 'lucide-react';

export function KPIDashboard() {
  const [loading, setLoading] = useState(true);
  const [rawPlanning, setRawPlanning] = useState<any[]>([]);
  const [rawHistory, setRawHistory] = useState<any[]>([]);
  
  const [dateFilter, setDateFilter] = useState('this_month');
  const [detailTab, setDetailTab] = useState<'late' | 'early'>('late'); // Pestaña activa

  const [stats, setStats] = useState({
    totalOTs: 0,
    complianceRate: 0,
    pendingCount: 0,
    urgentCount: 0,
    prevVsCorr: [] as any[],
    statusData: [] as any[],
    topEquipments: [] as any[],
    techPerformance: [] as any[],
    // LISTAS DETALLADAS
    lateList: [] as any[],
    earlyList: [] as any[]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (rawPlanning.length > 0) calculateKPIs();
  }, [dateFilter, rawPlanning, rawHistory]);

  const loadData = async () => {
    setLoading(true);
    const history = await fetchHistory();
    const planning = await fetchPlanning();
    setRawHistory(history);
    setRawPlanning(planning);
    setLoading(false);
  };

  const filterByDate = (items: any[], dateField: string) => {
    if (dateFilter === 'all') return items;
    const now = new Date();
    return items.filter(item => {
      if (!item[dateField]) return false;
      const parts = item[dateField].split(/[-/]/);
      const itemDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));

      if (dateFilter === 'this_week') {
        const first = new Date(now.setDate(now.getDate() - now.getDay()));
        return itemDate >= first;
      }
      if (dateFilter === 'this_month') {
        return itemDate.getMonth() === new Date().getMonth() && itemDate.getFullYear() === new Date().getFullYear();
      }
      if (dateFilter === 'last_month') {
        const last = new Date();
        last.setMonth(last.getMonth() - 1);
        return itemDate.getMonth() === last.getMonth() && itemDate.getFullYear() === last.getFullYear();
      }
      if (dateFilter === 'this_year') {
        return itemDate.getFullYear() === new Date().getFullYear();
      }
      return true;
    });
  };

  const calculateKPIs = () => {
    const filteredPlanning = filterByDate(rawPlanning, 'fecha_asignacion');
    const filteredHistory = filterByDate(rawHistory, 'fecha_procesada');

    // KPI BASICOS
    const totalPlanned = filteredPlanning.length;
    const delivered = filteredPlanning.filter((p: any) => p.estado === 'ENTREGADO').length;
    const pending = filteredPlanning.filter((p: any) => p.estado === 'PENDIENTE').length;
    const urgent = filteredPlanning.filter((p: any) => p.estado === 'URGENTE').length;
    const complianceRate = totalPlanned > 0 ? Math.round((delivered / totalPlanned) * 100) : 0;

    // PREV vs CORR
    const correctivas = filteredHistory.filter(o => o.tipo_ot?.toUpperCase().includes('CORRECTIVA')).length;
    const preventivas = filteredHistory.filter(o => o.tipo_ot?.toUpperCase().includes('PREVENTIVA')).length;

    // TOP EQUIPOS
    const equipmentMap: Record<string, number> = {};
    filteredHistory.filter(o => o.tipo_ot?.toUpperCase().includes('CORRECTIVA')).forEach(o => {
      const name = o.nombre_equipo || "S/N";
      equipmentMap[name] = (equipmentMap[name] || 0) + 1;
    });
    const topEquipments = Object.entries(equipmentMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- ANÁLISIS DE TIEMPOS (AGILIDAD VS RETRASO) ---
    const techStats: Record<string, { onTime: number, late: number }> = {};
    const lateOTs: any[] = [];
    const earlyOTs: any[] = [];

    filteredPlanning.forEach((p: any) => {
      if (p.estado === 'ENTREGADO' && p.fecha_ejecucion && p.fecha_limite) {
        const techName = p.tecnico_asignado || "Desconocido";
        if (!techStats[techName]) techStats[techName] = { onTime: 0, late: 0 };

        const execParts = p.fecha_ejecucion.split(/[-/]/);
        const limitParts = p.fecha_limite.split(/[-/]/);
        const execDate = new Date(Number(execParts[2]), Number(execParts[1]) - 1, Number(execParts[0]));
        const limitDate = new Date(Number(limitParts[2]), Number(limitParts[1]) - 1, Number(limitParts[0]));

        // Calcular diferencia en días
        const diffTime = Math.abs(execDate.getTime() - limitDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (execDate <= limitDate) {
          techStats[techName].onTime += 1;
          earlyOTs.push({ ...p, days: diffDays }); // Guardar en lista ágil
        } else {
          techStats[techName].late += 1;
          lateOTs.push({ ...p, days: diffDays }); // Guardar en lista atrasada
        }
      }
    });

    const techPerformance = Object.entries(techStats).map(([name, data]) => ({
      name, ...data, total: data.onTime + data.late
    })).sort((a, b) => b.total - a.total);

    setStats({
      totalOTs: delivered,
      complianceRate,
      pendingCount: pending,
      urgentCount: urgent,
      prevVsCorr: [
        { name: 'Preventiva', value: preventivas, color: '#10B981' },
        { name: 'Correctiva', value: correctivas, color: '#EF4444' },
      ],
      statusData: [
        { name: 'Entregado', value: delivered, color: '#10B981' },
        { name: 'Pendiente', value: pending, color: '#F59E0B' },
        { name: 'Urgente', value: urgent, color: '#EF4444' }
      ],
      topEquipments,
      techPerformance,
      lateList: lateOTs,
      earlyList: earlyOTs
    });
  };

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Analizando datos...</div>;

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="text-red-600" /> Tablero de Control
        </h2>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-300 shadow-sm">
          <Filter className="w-4 h-4 text-gray-500 ml-2" />
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="p-2 text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer">
            <option value="this_week">Esta Semana</option>
            <option value="this_month">Este Mes</option>
            <option value="last_month">Mes Pasado</option>
            <option value="this_year">Este Año</option>
            <option value="all">Todo el Historial</option>
          </select>
        </div>
      </div>

      {/* TARJETAS RESUMEN (Igual que antes) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* ... (Mantener tarjetas existentes) ... */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Cumplimiento</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.complianceRate}%</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Entregadas</p>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalOTs}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Pendientes</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-8 h-8 text-yellow-500" />
            <span className="text-3xl font-bold text-gray-900">{stats.pendingCount}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-50 border-l-4 border-l-red-500">
          <p className="text-sm text-red-600 font-bold">Urgentes</p>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <span className="text-3xl font-bold text-red-700">{stats.urgentCount}</span>
          </div>
        </div>
      </div>

      {/* GRÁFICAS (Igual que antes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Estrategia (Prev vs Corr)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.prevVsCorr} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {stats.prevVsCorr.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Eficiencia Técnica</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.techPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={90} style={{fontSize:'11px'}} />
              <Tooltip />
              <Legend />
              <Bar dataKey="onTime" name="A Tiempo" stackId="a" fill="#10B981" />
              <Bar dataKey="late" name="Atrasado" stackId="a" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- NUEVA SECCIÓN: DETALLE DE DESVIACIONES --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setDetailTab('late')}
            className={`flex-1 py-4 text-center font-bold text-sm flex items-center justify-center gap-2 ${detailTab === 'late' ? 'bg-red-50 text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            OTs Atrasadas ({stats.lateList.length})
          </button>
          <button 
            onClick={() => setDetailTab('early')}
            className={`flex-1 py-4 text-center font-bold text-sm flex items-center justify-center gap-2 ${detailTab === 'early' ? 'bg-green-50 text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CheckCircle className="w-4 h-4" />
            OTs Ágiles / A Tiempo ({stats.earlyList.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-6">OT</th>
                <th className="py-3 px-6">Técnico</th>
                <th className="py-3 px-6">Equipo</th>
                <th className="py-3 px-6">Límite</th>
                <th className="py-3 px-6">Ejecución</th>
                <th className="py-3 px-6">Desviación</th>
              </tr>
            </thead>
 <tbody className="divide-y divide-gray-100 text-sm">
              {(detailTab === 'late' ? stats.lateList : stats.earlyList).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  
                  {/* CAMBIO 1: Agregado text-gray-900 para que el número de OT sea NEGRO */}
                  <td className="py-3 px-6 font-mono font-bold text-gray-900">
                    {row.numero_ot}
                  </td>

                  {/* CAMBIO 2: Agregado text-gray-900 para que el Técnico sea NEGRO */}
                  <td className="py-3 px-6 font-medium text-gray-900">
                    {row.tecnico_asignado}
                  </td>
                  
                  <td className="py-3 px-6 text-gray-600">{row.nombre_equipo || "N/A"}</td>
                  <td className="py-3 px-6 text-gray-500">{row.fecha_limite}</td>
                  <td className="py-3 px-6 text-gray-900 font-medium">{row.fecha_ejecucion}</td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${detailTab === 'late' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {detailTab === 'late' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      {row.days} días {detailTab === 'late' ? 'tarde' : 'antes'}
                    </span>
                  </td>
                </tr>
              ))}
              {(detailTab === 'late' ? stats.lateList : stats.earlyList).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                    No hay registros en esta categoría para el periodo seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}