import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

@Injectable()
export class GeminiService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Usamos el nombre de la variable que tienes en tu .env
    const key = this.configService.get<string>('GEMINI_API_KEY');
    if (!key) {
      console.error("❌ ERROR ARCA: NEXT_PUBLIC_GEMINI_API_KEY no encontrada.");
      return;
    }
    this.genAI = new GoogleGenerativeAI(key);

    this.model = this.genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
  }

  /**
   * Método genérico para procesar imágenes con Gemini
   */
  private async scanImage(imgSrc: string, prompt: string) {
    try {
      // Limpieza de Base64 (vital para evitar el Error 400)
      const base64Data = imgSrc.replace(/^data:image\/\w+;base64,/, "");

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Limpieza de Markdown y parseo
      const cleanJson = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("❌ Error en ScanImage:", error.message);
      throw error;
    }
  }

  async analyzeBiometrics(imgSrc: string) {
    // const prompt = `Analiza la composición corporal en la imagen. 
    // SI NO VES EL CUERPO COMPLETO, responde: {"error": "Por favor, encuadra tu cuerpo en la silueta neón"}. 
    // SI VES EL CUERPO, estima % grasa y % músculo. Responde solo JSON: {"bodyFat": 0, "muscleMass": 0}`;
    const prompt = `Analiza la composición corporal en la imagen. 
     estima % grasa, % músculo y peso estimado(kg). Responde solo JSON: {"bodyFat": 0, "muscleMass": 0,"estimatedWeight":0}`;
    return this.scanImage(imgSrc, prompt);
  }

    async analyzeEats(imgSrc: string) {
        const prompt = `CONTEXTO: Eres el Bio-Analista de IA del "Arca". Tu misión es identificar suministros biológicos para un superviviente en entrenamiento de alto rendimiento.

        INSTRUCCIONES DE ESCANEO:
        1. Analiza la imagen y detecta proporciones. Usa los cubiertos o el plato como referencia de escala para estimar el peso en gramos.
        2. Calcula los macros basándote en densidades nutricionales estándar.
        3. Sé crítico: si ves ultra-procesados, reduce la "calidad_suministro".

        SI NO HAY COMIDA: Responde únicamente {"error": "Escaneo fallido: Objetivo no identificado en el área de escaneo"}.

        SI HAY COMIDA, devuelve ESTRICTAMENTE este JSON:
        {
            "suministro": "Nombre técnico (Ej: Complejo de Proteína y Carbohidratos Almidonados)",
            "analisis_visual": {
                "ingredientes_detectados": [],
                "peso_total_estimado_g": 0,
                "densidad_calorica": "Baja/Media/Alta"
            },
            "bio_marcadores": {
                "calorias_totales": 0,
                "proteinas_g": 0,
                "carbs_g": 0,
                "grasas_g": 0,
                "fibra_g": 0,
                "azucares_g": 0,
                "sodio_estimado_mg": 0
            },
            "rpg_stats": {
                "buff_principal": "Nombre del Buff (Ej: Síntesis Proteica / Carga de Glucógeno)",
                "duracion_buff_minutos": 0,
                "calidad_suministro": "S/A/B/C/D/F",
                "integridad_digestiva": "Puntaje 1-10 (basado en fibra y procesamiento)"
            },
            "comentario_ia": "Breve mensaje sarcástico o motivador del Arca sobre esta comida."
        }
        Responde solo el objeto JSON puro, sin markdown, sin texto extra.`;

        return this.scanImage(imgSrc, prompt);
    }
    async createAvatar(imgSrc: string) {
        const prompt = `genera un avatar a partir de la imagen`;

        return this.scanImage(imgSrc, prompt);
    }
}