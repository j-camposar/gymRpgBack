import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mision } from './schema/mision.schema';
import { CharacterMision } from '../character/schema/characterMision.schema';
import { Wallet } from '../economy/schema/wallet.schema';
import { Character } from '../character/schema/character.schema';

@Injectable()
export class MisionService {
  constructor(
    @InjectModel(Mision.name) private misionModel: Model<Mision>,
    @InjectModel(CharacterMision.name)  private characterMisionModel: Model<CharacterMision>,
    @InjectModel(Character.name)  private characterModel: Model<Character>,
    @InjectModel(Wallet.name)  private  walletModel: Model<Wallet>,
  ) {}
    async findAll() {
        return await this.misionModel.find().exec();
    }
    async onTrainingCompleted({
        characterId,
        totalXp,
        muscleResults,
        fatigueGenerated,
        weight,
    }: {
        characterId: string;
        totalXp: number;
        muscleResults: {
            muscle: { code: string };
            gainedXp: number;
            fatiga: number;
        }[];
        fatigueGenerated: number;
        weight: number;
    }) {
        const missions = await this.characterMisionModel
            .find({
                characterId,
                completed: false,
                expiresAt: { $gt: new Date() },
            })
        .populate('misionId');

        for (const cm of missions) {
            const mission: Mision = cm.misionId;
            let progressAdded = 0;
            let skipMission = false;

            // 🎯 Caso A: XP total (Sin restricción de músculo específico)
            if (mission.config?.targetXp && !mission.config.muscleCode) {
                // Aquí sí podrías evaluar la fatigaGlobal del personaje si la config lo pide
                if (mission.config.maxFatigue && fatigueGenerated > mission.config.maxFatigue) {
                    continue; 
                }
                progressAdded = totalXp;
            }

            // 💪 Caso B: XP por músculo específico
            if (mission.config?.muscleCode) {
                const muscleResult = muscleResults.find(
                    (m) => m.muscle.code === mission.config.muscleCode
                );

                if (muscleResult) {
                    // 🛡️ VALIDACIÓN CRÍTICA: Evaluar la fatiga del MÚSCULO específico
                    // Usamos la fatiga final (actual + generada) del músculo
                    if (
                        mission.config.maxFatigue && 
                        muscleResult.fatiga > mission.config.maxFatigue
                    ) {
                        console.log(`Misión ${mission.name} abortada: Fatiga del músculo excesiva.`);
                        skipMission = true;
                    } else {
                        progressAdded = muscleResult.gainedXp;
                    }
                }
            }

            if (skipMission) continue;

            // ➕ Avanzar progreso y guardar
            cm.progress += progressAdded;

            if (mission.config?.targetXp && cm.progress >= mission.config.targetXp) {
                cm.completed = true;
            }

            await cm.save();
        }
    }
    async getActiveMissions(characterId: string) {
        // 1. Buscar si ya existen misiones activas (sin expirar y no reclamadas)
        let characterMissions = await this.characterMisionModel
            .find({
                characterId,
                expiresAt: { $gt: new Date() },
                claimed: false
            })
            .populate('misionId');

        // 2. Si no hay misiones activas, asignamos una automáticamente
        if (characterMissions.length === 0) {
            // Buscamos todas las misiones maestras disponibles en el sistema
            const availableMissions = await this.misionModel.find().exec();

            if (availableMissions.length > 0) {
                // Seleccionamos una (puedes usar [0] o una lógica aleatoria)
                const randomMision = availableMissions[Math.floor(Math.random() * availableMissions.length)];
                
                // Definimos la expiración (24 horas para DAILY)
                const expiresAt = new Date();
                const startedAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);

                // Creamos la nueva instancia para el personaje
                const newAssignment = new this.characterMisionModel({
                    characterId,
                    misionId: randomMision._id,
                    progress: 0,
                    completed: false,
                    claimed: false,
                    expiresAt,
                    startedAt,
                });

                const savedAssignment = await newAssignment.save();
                
                // Volvemos a buscar para devolver el objeto con el populate de la misión maestra
                const populatedAssignment = await this.characterMisionModel
                    .findById(savedAssignment._id)
                    .populate('misionId');
                
                characterMissions = [populatedAssignment];
            }
        }

        // 3. Mapeo de la respuesta para el Frontend (el mismo que ya tenías)
        return characterMissions
            .filter(cm => cm.misionId) 
            .map(cm => ({
                id: cm._id,
                code: cm.misionId.code,
                name: cm.misionId.name,
                description: cm.misionId.description,
                type: cm.misionId.type,
                rewardCoins: cm.misionId.rewardCoins,
                targetXp: cm.misionId.config?.targetXp || 100, 
                progress: cm.progress,
                completed: cm.completed,
                claimed: cm.claimed,
                expiresAt: cm.expiresAt,
            }));
    }
    async claimMission(characterMisionId: string) {
        const cm = await this.characterMisionModel.findById(characterMisionId).populate('misionId');
        
        if (cm.completed && !cm.claimed) {
            cm.claimed = true;
            await cm.save();

            // Actualizar el perfil de Adolfo
            await this.characterModel.findByIdAndUpdate(cm.characterId, {
                $inc: { 
                    xp: cm.misionId.rewardCoins * 2, // Ejemplo: la XP es el doble de las coins
                    coins: cm.misionId.rewardCoins 
                }
            });
            return { message: 'Recompensa procesada' };
        }
    }
}
export class GetActiveMissionsDto {
  characterId: string;
}
