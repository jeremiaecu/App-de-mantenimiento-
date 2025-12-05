import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractWorkOrderData(file: File) {
  console.log("🚀 Iniciando extracción INTELIGENTE de datos...");
  
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

    const base64Content = base64Data.split(',')[1];
    const mimeType = file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg';

    const prompt = `
      Actúa como un experto en mantenimiento industrial. Extrae los datos de esta Orden de Trabajo (OT) de la imagen.
      
      INSTRUCCIONES ESPECÍFICAS:
      1. "numero_ot": Busca "O/T N°:", "Orden:" o el código principal (Ej: P00057775).
      2. "tipo_ot": Busca "PREVENTIVA" o "CORRECTIVA".
      3. "nombre_equipo": Busca "Equipo :". Extrae el nombre.
      4. "codigo_activo": Busca "Cód.Activo:", "Activo Fijo:". Prefiere códigos cortos alfanuméricos (Ej: "SOL 095").
      5. "tecnico_asignado": Busca "PROV. DE SERVICIO:", "Técnico:" o "Responsable:". Devuelve SOLO el nombre.
      6. Extrae "area", "grupo", "subgrupo" si aparecen.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Content } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            numero_ot: { type: Type.STRING },
            tipo_ot: { type: Type.STRING },
            nombre_equipo: { type: Type.STRING },
            area: { type: Type.STRING },
            grupo: { type: Type.STRING },
            subgrupo: { type: Type.STRING },
            codigo_activo: { type: Type.STRING },
            tecnico_asignado: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text || "{}";
    console.log("✅ Datos extraídos:", text);
    return JSON.parse(text);

  } catch (error: any) {
    console.error("Gemini Error", error);
    return { 
      numero_ot: "", tipo_ot: "REALIZADO", nombre_equipo: "", 
      area: "", grupo: "", subgrupo: "", codigo_activo: "", tecnico_asignado: "" 
    };
  }
}

export async function chatWithAI(message: string, history: any[]) {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: history,
      config: {
        systemInstruction: "Eres un asistente experto en mantenimiento industrial. Ayudas a técnicos a resolver problemas, interpretar manuales y redactar informes técnicos. Sé claro y conciso.",
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text || "Lo siento, no pude generar una respuesta.";
  } catch (error) {
    console.error("❌ Error en Chat Gemini:", error);
    throw error;
  }
}