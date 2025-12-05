import { GoogleGenerativeAI } from "@google/generative-ai";

// TU CLAVE REAL (Puesta directamente para evitar errores de servidor)
const API_KEY = "AIzaSyBFAAsKUIzpjNt-onxUWFP_cJB-rSZtqhE";

const genAI = new GoogleGenerativeAI(API_KEY);

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
    
    // Usamos el modelo flash que es rápido
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
