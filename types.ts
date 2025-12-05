export interface OTData {
  id?: string;
  fecha_procesada: string; // Raw string from sheet
  tipo_ot: string;
  numero_ot: string;
  nombre_equipo: string;
  area: string;
  grupo: string;
  subgrupo: string;
  codigo_activo: string;
  tecnico_responsable: string;
  usuario_registro: string;
  // Assignment and Planning fields
  tecnico_asignado?: string;
  estado?: string;
  fecha_asignacion?: string;
  fecha_limite?: string;
}

// WorkOrder is essentially OTData for the frontend
export type WorkOrder = OTData;

export interface AssignmentPayload {
  numero_ot: string;
  tecnico_asignado: string;
  fecha_limite: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type UserRole = 'admin' | 'tecnico';

export interface User {
  usuario: string;
  password?: string;
  nombre: string;
  rol: string;
}