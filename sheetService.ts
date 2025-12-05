// services/sheetService.ts

// TU URL DE GOOGLE SCRIPT (Asegúrate de que sea la correcta)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUSM1URyKsAtQSGvVhKU2FdVSDuy4H-eNeSIKb2MBW1hV7GKDYy5EPB6PWiUz1eB5sdw/exec";

export interface User {
  usuario: string;
  password?: string;
  nombre: string;
  rol: string;
}

export interface OTData {
  id?: string;
  fecha_procesada: string;
  tipo_ot: string;
  numero_ot: string;
  nombre_equipo: string;
  area: string;
  grupo: string;
  subgrupo: string;
  codigo_activo: string;
  tecnico_responsable: string;
  usuario_registro: string;
  evidencia_url?: string;
}

// --- 1. OBTENER USUARIOS ---
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?type=users`);
    const data = await response.json();
    return data.map((u: any) => ({
      usuario: String(u.usuario).trim(),
      password: String(u.password).trim(),
      nombre: String(u.nombre).trim(),
      rol: String(u.rol).trim().toLowerCase()
    }));
  } catch (error) {
    console.error("Error users:", error);
    return [];
  }
};

// --- 2. OBTENER HISTORIAL (BITÁCORA) ---
export const fetchHistory = async (): Promise<OTData[]> => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL); // Sin parámetros = Bitácora
    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      id: item.numero_ot + Math.random().toString()
    }));
  } catch (error) {
    console.error("Error history:", error);
    return [];
  }
};

// --- 3. OBTENER PLANIFICACIÓN (AQUÍ ESTABA EL ERROR) ---
export const fetchPlanning = async () => {
  try {
    // CORRECCIÓN: Agregamos el parámetro ?type=planning
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?type=planning`);
    const data = await response.json();
    
    console.log("PLANNING DATA REAL:", data); // Para verificar en consola
    return data;
  } catch (error) {
    console.error("Error planning:", error);
    return [];
  }
};

// --- 4. GUARDAR OT (TÉCNICO) ---
export const syncWithGoogleSheet = async (data: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return true;
  } catch (error) {
    return false;
  }
};

// --- 5. ASIGNAR OT (ADMIN) ---
export const assignOT = async (data: any) => {
  try {
    const payload = {
      action: 'assign_ot',
      fecha_asignacion: data.fecha_asignacion,
      numero_ot: data.numero_ot,
      tecnico_asignado: data.tecnico_asignado,
      nombre_equipo: data.nombre_equipo,
      codigo_activo: data.codigo_activo
    };
    
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    return false;
  }
};

// --- 6. CREAR USUARIO (ADMIN) ---
export const createUser = async (data: any) => {
  try {
    const payload = {
      action: 'create_user',
      ...data
    };
    
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};