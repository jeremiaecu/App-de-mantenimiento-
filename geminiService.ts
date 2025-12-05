import { GoogleGenerativeAI } from "@google/generative-ai";

// TU CLAVE REAL
const API_KEY = "AIzaSyBFAAsKUIzpjNt-onxUWFP_cJB-rSZtqhE";

const genAI = new GoogleGenerativeAI(API_KEY);

// --- 1. FUNCIÓN DE EXTRACCIÓN (Para las OTs) ---
export async function extractWorkOrderData(file: File) {
  console.log("🚀 Iniciando extracción COMPLETA...");
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

    const base64Content = base64Data.split(',')[1];
    const mimeType = file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg';
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analiza este documento (OT). Extrae TODOS los datos posibles en JSON:
      1. "numero_ot": Código de la orden (P000..., C000...).
      2. "tipo_ot": PREVENTIVA o CORRECTIVA.
      3. "nombre_equipo": Nombre del equipo.
      4. "codigo_activo": Código de activo (Ej: SOL 095).
      5. "tecnico_asignado": Nombre en "PROV. DE SERVICIO" o "Técnico".
      
      Responde SOLO JSON:
      { "numero_ot": "", "tipo_ot": "", "nombre_equipo": "", "codigo_activo": "", "tecnico_asignado": "" }
    `;

    const result = await model.generateContent([
      prompt, { inlineData: { data: base64Content, mimeType: mimeType } }
    ]);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    return { numero_ot: "", tecnico_asignado: "", nombre_equipo: "", codigo_activo: "" };
  }
}

// --- 2. FUNCIÓN DE CHAT (LA QUE FALTABA) ---
export async function chatWithAI(message: string, history: any[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Convertimos el historial al formato de Gemini si es necesario
    // (Por simplicidad iniciamos chat nuevo cada vez si el historial es complejo, 
    // o pasamos el historial formateado correctamente)
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }))
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Chat Error:", error);
    return "Lo siento, tuve un problema al procesar tu mensaje.";
  }
}
