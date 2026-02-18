import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Character,CharacterSchema } from './schema/character.schema';
import { CharacterMuscle } from './schema/characterMuscle.schema';
import { Muscle } from '../muscle/schema/muscle.schema';
@Injectable()
export class CharacterService {
  constructor(
    @InjectModel(Character.name)
    private readonly characterModel: Model<Character>,

    @InjectModel(Muscle.name)
    private readonly muscleModel: Model<Muscle>,

    @InjectModel(CharacterMuscle.name)
    private readonly characterMuscleModel: Model<CharacterMuscle>,
  ) {}

    async create(userId: string, name: string, peso:string, nick:string, edad:number , estatura :string,
        objetivo:string, coins: number
    ) {
        const existente = await this.characterModel.findOne({ nick });

        if (existente) {
            throw new BadRequestException(
                'El nick ingresado ya existe, inténtelo de nuevo',
            );
        }
        // 1. Crear personaje
        const character = await this.characterModel.create({
            userId,
            name,
            nick,
            peso,
            edad,
            estatura,
            objetivo,
            level: 0,
            xp: 0,
            coins
        });

        // 2. Obtener músculos base
        const muscles = await this.muscleModel.find();

        // 3. Crear músculos RPG
        const characterMuscles = muscles.map((muscle) => ({
            characterId: character._id,
            muscleId: muscle._id,
            level:0,
            xp: 0,
            fatigue: 0,
        }));

        await this.characterMuscleModel.insertMany(characterMuscles);

        return {
            character,
            muscles: characterMuscles,
        };
    }

    async viewAll(){
        return this.muscleModel.find();
    }
    async viewById(idUser : string){
        return this.characterModel.findById(idUser);
    }
    async viewMuscleCharacter(idUser : string){
        return this.characterMuscleModel.find({"characterId":idUser}).populate('muscleId');
    }
}
