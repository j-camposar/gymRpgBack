import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Exercise } from "../exercise/schemas/exercise.schema";
import { Model, Types } from "mongoose";
import { CharacterMuscle } from "../character/schema/characterMuscle.schema";
import { TrainingLog } from "./schema/training-log.schema";
import { ProgressionService } from "../progression/progression.service";
import { Muscle } from "../muscle/schema/muscle.schema";
import { MisionService } from "../mission/mision.service";
import { Character, CharacterGoal } from "../character/schema/character.schema";
import { CharacterExerciseStats } from "../character/schema/characterExerciseStats.schema";
import { Training } from "./schema/training.schema";
import { TrainingDescanso } from "./schema/training-descanso";
import { format } from 'date-fns';
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
        let musclesFatigue=0;
        let grupoMusculares=[];
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
                pesoCorporal: character.peso,
                edad: character.edad
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
            if(characterMuscle.fatigue>8){
                musclesFatigue++;
            }
            grupoMusculares.push({
                "nombreMusculo":characterMuscle.muscleId.name,
                "fatigaActual":characterMuscle.fatigue
            }); 
           
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
        const calories = this.calculateCalories(weight, reps, intensity, character.peso, difficulty,grupoMusculares ,character.edad);
        const feedback=await this.feedbackCoach(difficulty, musclesFatigue, character.objetivo );
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
            calories: calories,
            feedback:feedback
        }};
    }
    estimate1RM(peso: number, reps: number) {
        if (!peso || !reps || reps <= 0) return 0;
        return peso * (1 + reps / 30);
    
    }
    async descansar(characterId: string, restSeconds: number) {
        const muscles = await this.characterMuscleModel.find({ characterId });
        const character = await this.characterModel.findById(characterId);


        if (!muscles.length) {
            throw new Error('El personaje no tiene músculos');
        }

        let totalRecuperado = 0;

        for (const muscle of muscles) {
            const fatigaAntes = muscle.fatigue;
            
            muscle.fatigue = this.recoverDuringRest(
                muscle.fatigue,
                restSeconds,
                character.edad
            );
            
            // Calculamos cuánto bajó la fatiga en este músculo (valor positivo)
            totalRecuperado += (fatigaAntes - muscle.fatigue);
            await muscle.save();
        }

        // Actualizamos el personaje restando el total recuperado
        if (character) {
            // Opción A: Si quieres que el personaje refleje el promedio real de los músculos:
            // Primero obtenemos la suma total de fatiga de TODOS los músculos después del descanso
            const allMuscles = await this.characterMuscleModel.find({ characterId });
            const sumaFatigaTotal = allMuscles.reduce((acc, m) => acc + m.fatigue, 0);
            
            // El personaje muestra el promedio (suponiendo 11 grupos musculares principales)
            character.fatiga = Number((sumaFatigaTotal / 12).toFixed(2)); 
            
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
        restSeconds: number,
        edad: number // 28 años en tu caso
    ): number {
        if (fatigaActual <= 0) return 0;

        // 1. Curva base de recuperación (asintótica)
        // t=90s -> 63%, t=180s -> 86%
        const recoveryPercent = 1 - Math.exp(-restSeconds / 90);

        // 2. Penalización por fatiga alta (Eficiencia Metabólica)
        const fatigueEfficiency = 150 / (150 + fatigaActual);

        // 3. Bio-Cap: El límite de recuperación por sesión basado en la edad
        // A los 20 años el cap es 0.85 (85%). Cada año extra reduce un 1% la capacidad.
        // Para ti (28 años): 0.85 - (28 - 20) * 0.01 = 0.77 (77%)
        const baseCap = 0.85;
        const agePenalty = Math.max(0, (edad - 20) * 0.01);
        const bioCap = Math.max(0.4, baseCap - agePenalty); 

        // 4. Aplicar eficiencia y limitar por el Bio-Cap
        const adjustedPercent = recoveryPercent * fatigueEfficiency;
        const finalPercent = Math.min(adjustedPercent, bioCap);

        const recovered = fatigaActual * finalPercent;
        
        // Resultado final redondeado
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
            { "characterId":userId, status: 'active'}, 
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
            "characterId": userId
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
        const character=await this.characterModel.findOne({ _id:userId });
        // buscamos feedback
        const feedback=await this.feedbackCoach(0, 0, character.objetivo );
        // 6. Return formateado exactamente para StatsResume
        return { 
            message: "Suministros del Arca actualizados.",
            data: { 
                totalXp: Math.round(totalXpGained),
                totalVolume: totalVolume,
                leveledUpMuscles: muscleReturn,
                calories:calories,
                feedback:feedback
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
        intensity: number, 
        pesoCorporal: number,
        dificultadSencida: number,
        musculosImplicados: {
            nombreMusculo: string,
            fatigaActual: number
        }[],
        edad: number
    ): number {
        const muscleImpact: Record<string, number> = {
            'cuádriceps': 0.6,
            'glúteos': 0.5,
            'femorales': 0.4,
            'aductor': 0.4,
            'espalda_alta': 0.4,
            'dorsales': 0.3,
            'pecho': 0.25,
            'hombros': 0.2,
            'biceps': 0.1,
            'tríceps': 0.1,
            'core': 0.2,
            'gemelos': 0.1,
        };

        let kFactor = 0.9; 
        let sumaFatiga = 0;

        // Procesamos el array para el kFactor y la Fatiga Localizada
        musculosImplicados.forEach(m => {
            const nombre = m.nombreMusculo.toLowerCase();
            kFactor += (muscleImpact[nombre] || 0.1);
            sumaFatiga += m.fatigaActual; // Sumamos las fatigas individuales
        });

        kFactor = Math.min(kFactor, 2.2);
        
        // Calculamos el promedio de fatiga de los músculos que están trabajando
        const fatigaPromedioLocal = musculosImplicados.length > 0 
            ? sumaFatiga / musculosImplicados.length 
            : 0;

        const durationInMinutes = (reps * 4) / 60;
        const intensityEffect = Math.pow(intensity, 1.5) * 10;
        const intensityMET = (3.5 + intensityEffect) * kFactor; 

        // 4. Factores de Esfuerzo, Fatiga y Edad
        const effortMultiplier = 0.7 + (Math.pow(dificultadSencida, 2) / 250);
        const fatigueMultiplier = 1 + (fatigaPromedioLocal / 100) * 0.15; // 👈 Ahora usa la fatiga local
        const ageFactor = 1 - (edad - 25) * 0.002;

        // 5. Cálculo Final
        const caloriesBase = (intensityMET * 3.5 * pesoCorporal / 200) * durationInMinutes * ageFactor;
        const workBonus = (peso * reps) / 350; 

        // Aplicamos multiplicadores a la suma de base + bono para que el RPE y Fatiga afecten todo
        const totalCalories = (caloriesBase + workBonus) * effortMultiplier * fatigueMultiplier;

        return Number(totalCalories.toFixed(2));
    }
    async feedbackCoach(rpe:number, musclesFatigued:number, goal:CharacterGoal){
        
          // 1. Feedback Prioritario: Fallo Muscular (RPE 10)
          if (rpe >= 10) {
            return "¡Agotamiento crítico detectado! Descansa al menos 90-120 segundos para que tu sistema nervioso se recupere antes del próximo set.";
          }
        
          // 2. Feedback por Objetivo Específico
        switch (goal) {
        case CharacterGoal.POWERLIFTING:
            if (rpe < 7 ) {
                return "La intensidad detectada es baja para Powerlifting. Para optimizar el reclutamiento de fibras, aumentemos 5 kilos en la próxima incursión.";
            }else if(rpe > 7 || rpe <=10){
                return "¡Wuo, excelente entrenamiento! Has mantenido el umbral de fuerza ideal. Sincronizando progreso..."
            }
            return "Buen control de carga. La estabilidad es clave para el movimiento total.";

        case CharacterGoal.AUMENTAR_FUERZA:
            
            return "Mantén el rango de fuerza. Si tu persepcion de esfuerzo es bajo, es hora de subir el peso.";

        case CharacterGoal.BAJAR_PESO:
            // El volumen de trabajo afecta la quema de calorías
            return musclesFatigued > 3 
                ? "Gran volumen de trabajo. Estás maximizando el gasto calórico de esta sesión."
                : "Aumenta la densidad del entrenamiento para optimizar la quema de grasa.";

        case CharacterGoal.RECOMPOSICION:
           
            return "Equilibrio perfecto entre volumen e intensidad. Sigue así.";

        default:
            return "Sesión sincronizada. Buen trabajo, sigue procesando datos.";
        }
    }
// listado de entrenamientos
    async findSessions(start: string, end: string, character_id: string) {
        // 1. Obtener las sesiones base
        const sessions = await this.trainingModel
            .find({
                characterId: character_id,
                createdAt: { $gte: new Date(start), $lte: new Date(end) }
            })
            .sort({ createdAt: -1 })
            .exec();

        if (sessions.length === 0) return [];

        // 2. Extraer los IDs para la búsqueda masiva
        const sessionIds = sessions.map(s => s._id.toString());

        // 3. Query única de suma (Agrupación simple por trainingId)
        const totals = await this.trainingLogModel.aggregate([
            { $match: { trainingId: { $in: sessionIds } } },
            { 
                $group: { 
                    _id: "$trainingId", 
                    totalPeso: { $sum: { $multiply: ["$weight", "$reps"] } },
                    totalXp:{$sum:  "$totalXp" },
                    totalCalorias: { $sum: "$caloriesBurned" },
                    fatigueGenerated: { $sum: "$fatigueGenerated" }
                } 
            }
        ]);
        // 4. Mapeo final (Unimos la sesión con sus totales)
        return sessions.map((s: any) => {
            // Buscamos el total que coincida con el ID de esta sesión
            const sessionTotals = totals.find(t => t._id.toString() === s._id.toString());
            return {
                id: s._id,
                fecha: s.createdAt,
                horaInicio: s.startTime ? format(new Date(s.startTime), 'HH:mm') : '--:--',
                horaFin: s.endTime ? format(new Date(s.endTime), 'HH:mm') : '--:--',
                fatiga: s.fatigaGenerada || 0,
                pesoTotal: Math.round(sessionTotals?.totalPeso || 0),
                calorias: Math.round(sessionTotals?.totalCalorias || 0),
                totalXp: Math.round(sessionTotals?.totalXp || 0),
                fatigueGenerated: Math.round(sessionTotals?.fatigueGenerated || 0),
                nombre: "Incursión Registrada"
            };
        });
    }
    // listado de ejercicios del sets
    async findSessionHistory(training_id: string) {
        // Buscamos todos los logs de UNA sola sesión
        const logs = await this.trainingLogModel
            .find({ trainingId: training_id })
            .populate({
                path: 'exerciseId',
                populate: { path: 'muscles.muscleId', model: 'Muscle' }
            })
            .exec();
        let estimate1RM=0;
        // Agrupamos por ejercicio para el mapa y la lista
        const ejercicios = logs.reduce((acc, log) => {
            const ex = log.exerciseId as any;
            const exId = ex._id.toString();
            
            if (!acc[exId]) {
                estimate1RM=0;
                acc[exId] = {
                    id: exId,
                    nombre: ex.name,
                    musculos: ex.muscles?.map((m: any) => m.muscleId?.name.toLowerCase()) || [],
                    seriesCount: 0,
                    cargaMax: 0,
                };
            }
            acc[exId].cargaMax = Math.max(acc[exId].cargaMax, log.weight);
            const current1RM = this.estimate1RM(log.weight, log.reps);
            acc[exId].estimate1RM = Math.max(acc[exId].estimate1RM || 0, current1RM);
            acc[exId].seriesCount++;
            return acc;
        }, {});

        return Object.values(ejercicios);
    }
    // listado de sets 
    async findHistoryExercise(exercise_id: string, character_id: string, training_id: string) {
        // 1. Traemos las series de HOY para este ejercicio
        const seriesHoy = await this.trainingLogModel
            .find({ trainingId: training_id, exerciseId: exercise_id })
            .sort({ createdAt: 1 })
            .exec();

        // 2. Buscamos la ÚLTIMA sesión anterior donde se hizo este ejercicio
        const ultimaSesion = await this.trainingLogModel.findOne({
            characterId: character_id,
            exerciseId: exercise_id,
            trainingId: { $ne: training_id }
        })
        .sort({ createdAt: -1 })
        .exec();

        let logsAnteriores = [];
        if (ultimaSesion) {
            logsAnteriores = await this.trainingLogModel.find({
                trainingId: ultimaSesion.trainingId.toString(),
                exerciseId: exercise_id
            })
            .sort({ createdAt: 1 })
            .exec();
        }
        // 3. Mapeamos con la comparativa de peso real
        return seriesHoy.map((log, index) => {
            const logAnterior = logsAnteriores[index];
            const weight = log.weight;
            const reps = log.reps;
            const estimacion1RM = reps > 1 ? weight / (1.0278 - (0.0278 * reps)) : weight;

            let progreso = 'INICIAL';
            if (logAnterior) {
                if (weight > logAnterior.weight || (weight === logAnterior.weight && reps > logAnterior.reps)) {
                    progreso = 'SUBISTE';
                } else if (weight === logAnterior.weight && reps === logAnterior.reps) {
                    progreso = 'ESTABLE';
                } else {
                    progreso = 'BAJASTE';
                }
            }
            return {
                weight,
                reps,
                estimacion1RM: Math.round(estimacion1RM * 10) / 10,
                progreso
            };
        });
    }
}
