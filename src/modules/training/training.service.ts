import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Exercise } from "../exercise/schemas/exercise.schema";
import { Model } from "mongoose";
import { CharacterMuscle } from "../character/schema/characterMuscle.schema";
import { TrainingLog } from "./schema/trainin-log.schema";
import { ProgressionService } from "../progression/progression.service";
import { Muscle } from "../muscle/schema/muscle.schema";
import { MisionService } from "../mission/mision.service";
import { Character } from "../character/schema/character.schema";
import { CharacterExerciseStats } from "../character/schema/characterExerciseStats.schema";

@Injectable()
export class TrainingService {
  constructor(
    @InjectModel(Exercise.name)
    private exerciseModel: Model<Exercise>,

    @InjectModel(CharacterMuscle.name)
    private characterMuscleModel: Model<CharacterMuscle>,

    @InjectModel(Muscle.name)
    private muscleModel: Model<Muscle>,
    
    @InjectModel(Character.name)
    private characterModel: Model<Character>,

    @InjectModel(CharacterExerciseStats.name)
    private characterExerciseStatsModel: Model<CharacterExerciseStats>,

    @InjectModel(TrainingLog.name)
    private trainingLogModel: Model<TrainingLog>,
    
    private progressionService: ProgressionService,

    private misionService: MisionService,

  ) {}

   async registerTraining( 
        characterId: string,
        exerciseId: string,
        weight: number,//peso
        reps: number,
        difficulty: number
    ) {
        const exercise = await this.exerciseModel.findById(exerciseId);
        if (!exercise) throw new Error('Ejercicio no existe');
        const character = await this.characterModel.findById(characterId);
        if(!character) throw new Error('Personaje no existe');
        const characterExerciseStats = await this.characterExerciseStatsModel.findOne({"characterId":characterId});
        let  estimated1RMs=0;
        // si no tenemos 1 rm, lo calculamos, si ya contamos con 1 rm calculamos el que tenemos
        if (!characterExerciseStats){
            const trainingLogsCharacter = await this.trainingLogModel.find({"characterId":characterId, "exerciseId":exerciseId});
            if(trainingLogsCharacter){
                // si es el primer entrenamiento, calculamos con el peso actual y reps actual de la serie 
                estimated1RMs=this.estimate1RM(weight,reps)
            }else{
                estimated1RMs = Math.max(
                    ...trainingLogsCharacter.map(log =>
                        this.estimate1RM(log.weight, log.reps)
                    )
                )
            }
        }else{
            estimated1RMs=this.estimate1RM(characterExerciseStats.pesoMaximo,1)
        }
        const intensity = weight / estimated1RMs;
        let totalXp = 0;
        let totalFatigue = 0;
        const muscleResults = [];
        const muscleReturn=[];
        for (const musculos of exercise.muscles) {

            // buscar músculo directamente
            const muscle = await this.muscleModel.findOne({_id:musculos.muscleId})
            const characterMuscle = await this.characterMuscleModel
            .findOne({
                characterId,
                muscleId: muscle._id
            })
            .populate('muscleId');
            // comparamos el codigo id con el perfil debe existir el musculo 
            if (!muscle || !characterMuscle  ) continue;

            // 1️⃣ calcular progresión
            const progression =
            this.progressionService.calculateMuscleProgression({
                peso: weight,
                reps,
                difficulty,
                intensity,
                impacto: musculos.multiplier,
                nivelMusculo: characterMuscle.level,
                fatigaActual: characterMuscle.fatigue,
                pesoCorporal: character.peso
            });
            // 2️⃣ aplicar level up
            const levelResult =
            this.progressionService.checkLevelUp(
                characterMuscle.xp + progression.xp,
                characterMuscle.level,
            );
            console.log("levelResult", levelResult)

            characterMuscle.level = levelResult.level;
            characterMuscle.xp = levelResult.remainingXp;
            if(progression.fatiga >= 100){
                characterMuscle.fatigue = 100;
            }else if((characterMuscle.fatigue+progression.fatiga) >=100){
                characterMuscle.fatigue=100;
            }else{
                characterMuscle.fatigue += progression.fatiga;

            }
            if(levelResult.levelUp==true){
                characterMuscle.hipertrofia= 0;
            }else{
                characterMuscle.hipertrofia += progression.hipertrofia;
            }

            await characterMuscle.save();

            totalXp +=characterMuscle.xp ;
            totalFatigue += characterMuscle.fatigue;

            muscleResults.push({
                muscle: characterMuscle.muscleId,
                gainedXp: progression.xp,
                levelUp: levelResult.levelUp,
                newLevel: characterMuscle.level,
            });
            muscleReturn.push({
                name:characterMuscle.muscleId.name,
                level: characterMuscle.level,
                levelUp: levelResult.levelUp
            })
        }

        await this.trainingLogModel.create({
            characterId,
            exerciseId,
            weight,
            reps,
            totalXp,
            fatigueGenerated: totalFatigue,
        });
        await this.misionService.onTrainingCompleted({
            characterId,
            totalXp,
            muscleResults,
            fatigueGenerated: totalFatigue,
            weight,
        });
        return {data:{
            totalXp: Math.round(totalXp),
            totalFatigue: Number(totalFatigue.toFixed(2)),
            leveledUpMuscles: muscleReturn,
        }};
    }
    estimate1RM(peso: number, reps: number) {
        if (!peso || !reps || reps <= 0) return 0;
        return peso * (1 + reps / 30);
    
    }
    async descansar(characterId: string, restSeconds: number) {

        const muscles = await this.characterMuscleModel.find({ characterId });

        if (!muscles.length) {
            throw new Error('El personaje no tiene músculos');
        }
        let fatiga=0;
        for (const muscle of muscles) {
            const fatigaActual= muscle.fatigue;
            muscle.fatigue = this.recoverDuringRest(
                muscle.fatigue,
                restSeconds
            );
            
            fatiga=  muscle.fatigue -fatigaActual;
            await muscle.save();
        }
        return { message: 'Descanso aplicado' ,
            fatiga
        };
    }
    recoverDuringRest(
        fatigaActual: number,
        restSeconds: number
    ): number {
        if (fatigaActual <= 0) return 0;

        // 1. Curva base de recuperación (asintótica)
        // En 90s recupera ~63%, en 180s ~86%
        const recoveryPercent = 1 - Math.exp(-restSeconds / 90);

        // 2. Penalización por fatiga alta (CORREGIDO)
        // Usamos una proporción inversa para que nunca sea negativa
        // Si fatiga es 150, la eficiencia es 0.5 (50%). Si es 300, es 0.33 (33%)
        const fatigueEfficiency = 150 / (150 + fatigaActual);

        // 3. Aplicar eficiencia al porcentaje base
        const adjustedPercent = recoveryPercent * fatigueEfficiency;

        // 4. Cap de recuperación por sesión (máximo 70% de la fatiga actual)
        const cappedPercent = Math.min(adjustedPercent, 0.7);

        const recovered = fatigaActual * cappedPercent;
        
        // Redondeamos para evitar decimales infinitos en la DB
        return Math.max(0, Math.round((fatigaActual - recovered) * 100) / 100);
    }

}
