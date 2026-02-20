import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Character,CharacterSchema } from './schema/character.schema';
import { CharacterMuscle } from './schema/characterMuscle.schema';
import { Muscle } from '../muscle/schema/muscle.schema';
import * as bcrypt from 'bcryptjs';
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

    async create(
        userId: string, name: string, peso: string, nick: string, edad: number, 
        estatura: string, objetivo: string, coins: number, email: string, password: string, sexo:string
    ) {
        // 1. Verificar si el Nick ya existe
        const existente = await this.characterModel.findOne({ nick });
        if (existente) {
            throw new BadRequestException('El nick ingresado ya existe, inténtelo de nuevo');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Crear personaje con la clave hasheada
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
            coins,
            email,
            password: hashedPassword ,
            sexo
        });

        // 4. Obtener músculos base e inicializar sistema RPG
        const muscles = await this.muscleModel.find();
        const characterMuscles = muscles.map((muscle) => ({
            characterId: character._id,
            muscleId: muscle._id,
            level: 0,
            xp: 0,
            fatigue: 0,
        }));

        await this.characterMuscleModel.insertMany(characterMuscles);

        // Opcional: No devolver la contraseña en la respuesta
        const characterObject = character.toObject();
        delete characterObject.password;

        return {
            character: characterObject,
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
