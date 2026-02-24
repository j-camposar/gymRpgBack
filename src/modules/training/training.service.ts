import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Exercise } from "../exercise/schemas/exercise.schema";
import { Model, Types } from "mongoose";
import { CharacterMuscle } from "../character/schema/characterMuscle.schema";
import { TrainingLog } from "./schema/training-log.schema";
import { ProgressionService } from "../progression/progression.service";
import { Muscle } from "../muscle/schema/muscle.schema";
import { MisionService } from "../mission/mision.service";
import { Character } from "../character/schema/character.schema";
import { CharacterExerciseStats } from "../character/schema/characterExerciseStats.schema";
import { Training } from "./schema/training.schema";
import { TrainingDescanso } from "./schema/training-descanso";

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

    @InjectModel(TrainingDescanso.name)
    private trainingDescansoModel: Model<TrainingDescanso>,

    @InjectModel(Training.name)
    private trainingModel: Model<Training>,
    
    private progressionService: ProgressionService,

    private misionService: MisionService,

  ) {}

   async registerTraining( 
        characterId: string,
        exerciseId: string,
        weight: number,//peso
        reps: number,
        difficulty: number,
        sessionId:string
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
        let totalHipertrofia=0;
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
            totalHipertrofia += characterMuscle.hipertrofia;
           
            muscleResults.push({
                muscle: characterMuscle.muscleId,
                gainedXp: progression.xp,
                levelUp: levelResult.levelUp,
                newLevel: characterMuscle.level,
                fatiga: characterMuscle.fatigue
            });
            muscleReturn.push({
                name:characterMuscle.muscleId.name,
                level: characterMuscle.level,
                levelUp: levelResult.levelUp
            })
        }
        character.xp= totalXp/11;
        character.fatiga+=totalFatigue/11;
        const levelResultCharacter =
            this.progressionService.checkLevelUp(
                totalXp + character.xp,
                character.level,
        );
        character.level= levelResultCharacter.level;
        await character.save();
        const volume= weight * reps;
        const calories = this.calculateCalories(weight, reps, intensity, character.peso,character.fatiga ,difficulty);
        await this.trainingLogModel.create({
            characterId,
            exerciseId,
            weight,
            reps,
            totalXp,
            difficulty,
            fatigueGenerated: totalFatigue,
            trainingId: sessionId,
            caloriesBurned:calories
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
            totalVolume: volume,
            calories: calories
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

        let totalRecuperado = 0;

        for (const muscle of muscles) {
            const fatigaAntes = muscle.fatigue;
            
            muscle.fatigue = this.recoverDuringRest(
                muscle.fatigue,
                restSeconds
            );
            
            // Calculamos cuánto bajó la fatiga en este músculo (valor positivo)
            totalRecuperado += (fatigaAntes - muscle.fatigue);
            await muscle.save();
        }

        // Actualizamos el personaje restando el total recuperado
        const character = await this.characterModel.findById(characterId);
        if (character) {
            // Opción A: Si quieres que el personaje refleje el promedio real de los músculos:
            // Primero obtenemos la suma total de fatiga de TODOS los músculos después del descanso
            const allMuscles = await this.characterMuscleModel.find({ characterId });
            const sumaFatigaTotal = allMuscles.reduce((acc, m) => acc + m.fatigue, 0);
            
            // El personaje muestra el promedio (suponiendo 11 grupos musculares principales)
            character.fatiga = Number((sumaFatigaTotal / 11).toFixed(2)); 
            
            await character.save();
        }
        const training= await this.trainingModel.findOne(
            { status: 'active'}, 
        );
        await this.trainingDescansoModel.create({
            characterId,
            "trainingId":training._id,
            segundos:restSeconds,
            fatigaReducida: character.fatiga 
        })
        return { 
            message: 'Protocolo de recuperación finalizado',
            recuperacionTotal: Number(totalRecuperado.toFixed(2)),
            nuevaFatigaGlobal: character?.fatiga || 0
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
    async addXp(characterId: string, amount: number) {
        const character = await this.characterModel.findById(characterId);
        character.xp += amount;

        // Calcular XP necesaria para el siguiente nivel
        const xpNextLevel = 100 * Math.pow(character.level, 1.5);

        if (character.xp >= xpNextLevel) {
            character.level += 1;
            character.xp -= xpNextLevel; // Reiniciar o mantener el remanente
            // Aquí podrías dar una recompensa en monedas por subir de nivel
            character.coins += character.level * 50; 
        }
        
        await character.save();
    }
    async createTraining(userId: string) {
         const training= await this.trainingModel.findOne(
            { characterId:userId, status: 'active'}, 
            { sort: { createdAt: -1 } } // Por seguridad, tomamos el más reciente
        );
        if(training){
            return { 
                message: "Entrenamiento Creado", 
                trainingId: training._id
            };
        }
        const newTraining = await this.trainingModel.create({ 
            userId,
            startTime: new Date(), // Importante para calcular la duración después
            status: 'active',      // Para saber que aún no debe resetear la fatiga
            characterId: userId
        });

        return { 
            message: "Entrenamiento Creado", 
            trainingId: newTraining._id // Lo devolvemos al Front para las siguientes peticiones
        };
    }
    async finishWorkOut(userId: string, sessionId: string) {
        // 1. Obtener todos los logs de esta sesión
        const sessionLogs = await this.trainingLogModel.find({ trainingId: sessionId });
        // 2. Calcular totales
        const totalXpGained = sessionLogs.reduce((acc, log) => acc + log.totalXp, 0);
        const totalVolume = sessionLogs.reduce((acc, log) => acc + (log.weight * log.reps), 0);
        const calories = sessionLogs.reduce((acc, log) => acc + (log.caloriesBurned), 0);

        // Sacamos los IDs de los ejercicios sin repetir
        const exerciseIds = [...new Set(sessionLogs.map(log => log.exerciseId))];
        
        // Buscamos los detalles de esos ejercicios para saber qué músculos tocan
        const exercises = await this.exerciseModel.find({ _id: { $in: exerciseIds } });
        
        // Aplanamos todos los muscleId involucrados en la sesión
        const muscleIdsWorked = [...new Set(
            exercises.flatMap(ex => ex.muscles.map(m => m.muscleId))
        )];
        // 3. Capturar estado actual de músculos ANTES del reset para informar niveles
        const musclesInfo = await this.characterMuscleModel
        .find({ 
            characterId: userId, 
            muscleId: { $in: muscleIdsWorked } 
        })
        .populate('muscleId', 'name');
        
        // Mapeamos al formato que tu componente "WorkoutSummary" ya recorre
        const muscleReturn = musclesInfo.map(m => ({
            name: (m.muscleId as any).name,
            level: m.level,
            fatigue: m.fatigue, // Guardamos cuánta fatiga se va a limpiar
            levelUp: false // En el cierre de sesión podrías calcular si subió globalmente, por ahora false
        }));

        // 4. Cerrar la sesión en DB
        await this.trainingModel.findOneAndUpdate(
            { _id: sessionId }, 
            { 
                $set: { 
                    endTime: new Date(),
                    status: 'terminado',
                    totalXp: totalXpGained,
                    volume: totalVolume
                } 
            }
        );

        // 5. El Gran Reset (Protocolo de Recuperación Total)
        await this.characterMuscleModel.updateMany({"characterId": userId }, { $set: { fatigue: 0 } });
        await this.characterModel.updateOne({ _id:userId }, { $set: { fatiga: 0 } });

        // 6. Return formateado exactamente para StatsResume
        return { 
            message: "Suministros del Arca actualizados.",
            data: { 
                totalXp: Math.round(totalXpGained),
                totalVolume: totalVolume,
                leveledUpMuscles: muscleReturn,
                calories:calories
            }
        };
    }
    async findAllSession(sessionId: string) {
        const logs = await this.trainingLogModel.find({ trainingId:sessionId })
            .sort({ createdAt: -1 }) 
            .populate('exerciseId', 'name') 
            .exec();

        return logs.map(log => {
            const logObj = log.toObject();
            
            // Casteamos exerciseId como un objeto que tiene name
            const exerciseData = logObj.exerciseId as unknown as { name: string, _id: string };

            return {
                _id: logObj._id,
                weight: logObj.weight,
                reps: logObj.reps,
                totalXp: logObj.totalXp,
                quality: logObj.quality,
                fatigueGenerated: logObj.fatigueGenerated,
                difficulty:logObj.difficulty,
                // Ahora TS no se quejará de .name
                exerciseName: exerciseData?.name || 'Ejercicio Desconocido',
                exerciseId: exerciseData?._id ,
                calories:logObj.caloriesBurned
            };
        });
    }
    calculateCalories(
        peso: number, 
        reps: number, 
        intensity: number, // % del 1RM (ej: 0.8)
        pesoCorporal: number,
        fatigaActual: number,
        dificultadSencida: number // El valor del 1 al 10 que ingresa el usuario
    ): number {
        const durationInMinutes = (reps * 4) / 60;
        
        // 1. Multiplicador de Intensidad (Carga física real)
        const intensityEffect = Math.pow(intensity, 1.5) * 10;
        const intensityMET = 3.5 + intensityEffect; 

        // 2. Multiplicador de Esfuerzo Percibido (Carga mental/nerviosa)
        // Un 10 añade un bono de esfuerzo adicional del 20%
        const effortMultiplier = 0.8 + (dificultadSencida / 10) * 0.4;

        // 3. Multiplicador de Fatiga (Costo de degradación)
        const fatigueMultiplier = 1 + (fatigaActual / 100) * 0.4;

        // 4. Cálculo Base Metabólico
        let caloriesBase = (intensityMET * 3.5 * pesoCorporal / 200) * durationInMinutes;

        // 5. Bono por Trabajo Mecánico (Tonelaje)
        const workBonus = (peso * reps) / 400; 

        // TOTAL: Combinamos Intensidad Real x Esfuerzo Percibido x Fatiga
        const totalCalories = (caloriesBase * effortMultiplier * fatigueMultiplier) + workBonus;

        return Number(totalCalories.toFixed(2));
    }
}
