import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';

const LOGO_URL = "https://drive.google.com/thumbnail?id=19PpwOg2nCSQs_oMUfLS4vMqWgvZJEWC9&sz=w1000";

interface LoginProps {
  onLogin: (e: React.FormEvent, u: string, p: string) => void;
  error?: string;
}

export function Login({ onLogin, error }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(e, username, password);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          
          <img 
            src={LOGO_URL} 
            alt="ACROMAX" 
            className="h-32 w-auto mx-auto mb-4 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              document.getElementById('fallback-logo')!.style.display = 'block';
            }}
          />
          <div id="fallback-logo" className="hidden mb-4">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
              ACRO<span className="text-red-600">MAX</span>
            </h1>
          </div>
          
          {/* CAMBIO DE TEXTO AQUI */}
          <h2 className="text-2xl font-bold text-gray-800 mt-2">Gestión de OTs</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
              placeholder="Usuario"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
              placeholder="Contraseña"
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
          >
            INGRESAR
          </button>
        </form>
      </div>
    </div>
  );
}