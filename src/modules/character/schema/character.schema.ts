import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CharacterDocument = Character & Document;

export enum CharacterGoal {
  RECOMPOSICION = 'RECOMPOSICION',
  POWERLIFTING = 'POWERLIFTING',
  BAJAR_PESO = 'BAJAR_PESO',
  AUMENTAR_FUERZA = 'AUMENTAR_FUERZA',
}
@Schema({ timestamps: true })
export class Character {
  @Prop({ required: true, unique: true })
  nick: string;

  @Prop({ required: true })
  edad: number;

  @Prop({ required: true })
  peso: number; // kg

  @Prop({ required: true })
  estatura: number; // cm

  @Prop({ required: true, enum: CharacterGoal })
  objetivo: CharacterGoal;

  // Progresión general
  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  xp: number;

  // Economía
  @Prop({ default: 0 })
  coins: number;
  @Prop()
  email: string;
  
   @Prop()
  password: string;
    @Prop()
  sexo: string;
}
export const CharacterSchema = SchemaFactory.createForClass(Character);
