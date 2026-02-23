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
    const prompt = `Actúa como un Bio-Analista del Arca. 
    Analiza la imagen de la comida y extrae un informe exhaustivo.
    Si no hay comida, responde: {"error": "Escaneo fallido: Objetivo no identificado"}.

    Si hay comida, devuelve ESTRICTAMENTE un JSON con esta estructura:
    {
        "suministro": "Nombre técnico del plato",
        "analisis_visual": {
        "ingredientes": ["lista", "detallada"],
        "peso_estimado_g": 0,
        "metodo_coccion": "frito, vapor, etc."
        },
        "bio_marcadores": {
        "calorias_totales": 0,
        "proteinas_g": 0,
        "carbs_g": 0,
        "grasas_g": 0,
        "fibra_g": 0,
        "azucares_g": 0
        },
        "micronutrientes_clave": ["vitaminas", "minerales detectables"],
        "alertas": {
        "alergenos_probables": [],
        "indice_glucemico": "Bajo/Medio/Alto",
        "procesamiento": "Ultra-procesado/Natural/Minimamente procesado"
        },
        "rpg_stats": {
        "buff_principal": "Energía/Recuperación/Fuerza",
        "puntos_de_vida_recuperados": 0,
        "calidad_suministro": "A/B/C/D"
        }
    }
    Responde solo el objeto JSON puro.`;

    return this.scanImage(imgSrc, prompt);
    }
    async createAvatar(imgSrc: string) {
    const prompt = `genera un avatar a partir de la imagen`;

    return this.scanImage(imgSrc, prompt);
    }
}