
import { Injectable } from '@nestjs/common';
import { MuscleProgressionResult, ProgressionInput } from './interface/progression.interface';
@Injectable()
export class ProgressionService {
    calculateBaseXP(
        peso: number,
        reps: number, 
        difficulty:number, 
        intensity:number,
        impacto:number,
        nivelMusculo: number,
        fatigaActual:number,
        pesoCorporal:number ): number {
        const difficultyFactor = 0.6 + (difficulty / 10) * 0.8
        const levelFactor = 1 / (1 + nivelMusculo * 0.08)
        const intensityFactor = 0.5 + (intensity/10)
        
        const fatigueFactor = this.calculateFatiguePenalty(fatigaActual);
        const relativeLoad = peso / pesoCorporal
        // opcional: suavizarlo para que no explote el XP
        const bodyFactor = 0.7 + relativeLoad * 0.6
        return peso *
            reps *
            impacto *
            difficultyFactor *
            intensityFactor *
            levelFactor *
            fatigueFactor *
            bodyFactor
    }

    calculateFatigue(
        reps: number,
        intensity: number,
        impacto: number,
        fatigaActual: number,
        difficulty: number
    ): number {
        // frenamos el calculo si ya es mayor a 100
        if (fatigaActual >= 100) return 100;

        const effort = reps * intensity;
        const difficultyFactor = 0.6 + (difficulty / 10) * 0.8;
        
        // Mientras más cerca de 100, más difícil es generar fatiga nueva (diminishing returns)
        // o simplemente ponemos un límite estricto.
        const fatigueGain = effort * impacto * difficultyFactor;
        
        // Bonus por acumulación: entrenar cansado genera más fatiga
        const accumulation = 1 + (fatigaActual / 100) * 0.5;
        
        const total = fatigaActual + (fatigueGain * accumulation);

        // CAP ESTRICTO: No puede pasar de 100
        return Math.min(total, 100);
    }
    calculateFatiguePenalty(fatigaActual: number): number {
        if (fatigaActual >= 100) return 0;
        return Math.max(0.2, 1 - fatigaActual / 100);
    }
    calculateHypertrophy(
        xp: number,
        fatigaActual: number,
    ): number {

    // Sobreentrenamiento: no crece músculo
    if (fatigaActual >= 90) return 0;

    
    // Base MUY conservadora
    const baseHypertrophy = xp * 0.008; // 0.5% – 1%

    // Penalización suave
    const fatiguePenalty = Math.max(
        0.3,
        1 - fatigaActual / 120
    );
    // si entrena bien recibe beneficio extra
    if (fatigaActual >= 20 && fatigaActual <= 60) {
        return baseHypertrophy * fatiguePenalty * 1.1;
    }
    return baseHypertrophy * fatiguePenalty;
    }

    calculateMuscleProgression(input: ProgressionInput): MuscleProgressionResult {
        // 1. Calculamos el XP base
        const baseXP = this.calculateBaseXP(
            input.peso, input.reps, input.difficulty, input.intensity,
            input.impacto, input.nivelMusculo, input.fatigaActual, input.pesoCorporal
        );

        // 2. Simplificamos la penalización final. 
        // calculateBaseXP ya incluye fatigueFactor, no lo multipliques de nuevo por xpPenaltyFactor.
        let xpFinal = baseXP; 

        // Solo aplicamos el "muro" de agotamiento extremo si realmente queremos frenar al jugador
        if (input.fatigaActual > 90) {
            xpFinal *= 0.5; // Menos agresivo que 0.4
        }

        // 3. Calculamos la nueva fatiga
        const nuevaFatiga = this.calculateFatigue(
            input.reps, input.intensity, input.impacto, input.fatigaActual, input.difficulty
        );
        // 4. Hipertrofia
        const hipertrofia = this.calculateHypertrophy(xpFinal, input.fatigaActual);

        return {
            xp: Math.round(xpFinal),
            fatiga: Number(nuevaFatiga.toFixed(2)),
            hipertrofia: Number(hipertrofia.toFixed(2)),
        };
    }
    xpForNextLevel(level: number): number {
        return Math.floor(100 * Math.pow(level, 1.5));
    }

    checkLevelUp(currentXp: number, level: number) {
        let xp = currentXp;
        let newLevel = level;
        let safetyBreak = 0; // Seguro contra cuelgues

        let required = this.xpForNextLevel(newLevel);

        while (xp >= required && safetyBreak < 100) {
            safetyBreak++;
            xp -= required;
            newLevel++;
            required = this.xpForNextLevel(newLevel);
        }

        if (safetyBreak >= 100) {
            console.error("DETECCIÓN: El bucle de nivel se bloqueó. Revisa xpForNextLevel.");
        }

        return { level: newLevel, remainingXp: xp, levelUp: newLevel !== level };
    }
}
