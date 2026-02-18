import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mision } from './schema/mision.schema';
import { CharacterMision } from '../character/schema/characterMision.schema';
import { Wallet } from '../economy/schema/wallet.schema';

@Injectable()
export class MisionService {
  constructor(
    @InjectModel(Mision.name) private misionModel: Model<Mision>,
    @InjectModel(CharacterMision.name)  private characterMisionModel: Model<CharacterMision>,
    @InjectModel(Wallet.name)  private  walletModel: Model<Wallet>,
  ) {}
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
    .populate('missionId');

    for (const cm of missions) {
        const mission: any = cm.misionId;
        let progressAdded = 0;

        // 🎯 XP total
        if (mission.config?.targetXp && !mission.config.muscleCode) {
            progressAdded = totalXp;
        }

        // 💪 XP por músculo
        if (mission.config?.muscleCode) {
            const muscle = muscleResults.find(
                (m) => m.muscle.code === mission.config.muscleCode,
        );
        if (muscle) {
            progressAdded = muscle.gainedXp;
        }
    }

        // 🎥 Calidad mínima
    if (
        mission.config?.minQuality
    ) {
        continue;
    }

        // 💤 Fatiga máxima
    if (
        mission.config?.maxFatigue &&
        fatigueGenerated > mission.config.maxFatigue
    ) {
        continue;
    }

        // ➕ Avanzar progreso
        cm.progress += progressAdded;

        // ✅ Check completion
        if (
            mission.config?.targetXp &&
            cm.progress >= mission.config.targetXp
        ) {
            cm.completed = true;
        }

        await cm.save();
    }
    }
    async getActiveMissions(characterId: string) {
        const missions = await this.characterMisionModel
            .find({
            characterId,
            expiresAt: { $gt: new Date() },
            })
            .populate('missionId');

        return missions.map(cm => ({
            id: cm._id,
            code: cm.misionId.code,
            name: cm.misionId.name,
            description: cm.misionId.description,
            type: cm.misionId.type,
            rewardCoins: cm.misionId.rewardCoins,
            progress: cm.progress,
            completed: cm.completed,
            claimed: cm.claimed,
            expiresAt: cm.expiresAt,
        }));
        }
    async claimMission(characterMissionId: string) {
        const cm = await this.characterMisionModel
            .findById(characterMissionId)
            .populate('missionId');

        if (!cm) throw new Error('Misión no encontrada');
        if (!cm.completed) throw new Error('Misión no completada');
        if (cm.claimed) throw new Error('Misión ya reclamada');

        cm.claimed = true;
        await cm.save();

        // Actualizar wallet
        const wallet = await this.walletModel.findOne({ characterId: cm.characterId });
        if (!wallet) throw new Error('Wallet no encontrada');

        wallet.coins += cm.misionId.rewardCoins;
        await wallet.save();

        return { coins: wallet.coins };
        }
}
export class GetActiveMissionsDto {
  characterId: string;
}
