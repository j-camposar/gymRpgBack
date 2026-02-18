export interface ProgressionInput {
  peso: number;
  difficulty:number;
  reps: number;
  impacto: number; // 0–1 por músculo
  fatigaActual: number;
  intensity: number;
  nivelMusculo:number;
  pesoCorporal:number;
}

export interface MuscleProgressionResult {
  xp: number;
  fatiga: number;
  hipertrofia: number;
}