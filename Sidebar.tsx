import React from 'react';
import { LogOut } from 'lucide-react';

const LOGO_URL = "https://drive.google.com/thumbnail?id=19PpwOg2nCSQs_oMUfLS4vMqWgvZJEWC9&sz=w1000";

interface SidebarProps {
  onLogout: () => void;
  user: { usuario: string; nombre: string; rol: string } | null;
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function Sidebar({ onLogout, user }: SidebarProps) {
  return (
    <div className="w-64 bg-black h-screen flex flex-col shadow-2xl border-r border-gray-800">
      
      {/* 1. ZONA DEL LOGO (Fondo Blanco Completo) */}
      <div className="h-32 bg-white flex items-center justify-center border-b-4 border-red-600">
        <img 
          src={LOGO_URL} 
          alt="ACROMAX" 
          className="h-24 w-auto object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            document.getElementById('fallback-sb')!.style.display = 'block';
          }}
        />
        <div id="fallback-sb" className="hidden text-center">
          <h1 className="text-3xl font-black tracking-tighter text-black">
            ACRO<span className="text-red-600">MAX</span>
          </h1>
        </div>
      </div>

      {/* 2. ESPACIO VACÍO (Negro) */}
      <div className="flex-1 bg-black">
        {/* Espacio reservado para el diseño negro */}
      </div>

      {/* 3. PERFIL Y CERRAR SESIÓN (Negro/Gris Oscuro) */}
      <div className="p-4 border-t border-gray-900 bg-gray-950 text-white">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold shadow-lg border border-red-900/50">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-sm text-gray-200 truncate">{user?.nombre}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{user?.rol}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-red-600 transition-all text-sm group font-medium"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}