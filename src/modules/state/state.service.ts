import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CharacterMuscle } from "../character/schema/characterMuscle.schema";
import { Model } from "mongoose";
import { Muscle } from "../muscle/schema/muscle.schema";
import { ProgressionService } from "../progression/progression.service";
import { console } from "inspector";

@Injectable()
export class StateService {
    constructor(
        @InjectModel(CharacterMuscle.name)
        private characterMuscleModel: Model<CharacterMuscle>,

        private progressionService: ProgressionService,
    ) {};
    async estado(character_id: string) {

    // 1. Buscamos todos los registros de músculos del personaje
        const estado = await this.characterMuscleModel
            .find({ characterId: character_id })
            .populate('muscleId')
            .exec(); // Es buena práctica usar .exec() en Mongoose
        // 2. Usamos .map() para transformar los datos de forma limpia
        const estadoActual = estado.map((item) => {
            return {
                fatiga: item.fatigue,
                xp: item.xp,
                level: item.level,
                label: item.muscleId?.name || 'Músculo desconocido',
                hipertrofia: item.hipertrofia*100 || 0,
                xpNeeded: this.progressionService.xpForNextLevel(item.level)
            };
        });

        return estadoActual;
    }
}