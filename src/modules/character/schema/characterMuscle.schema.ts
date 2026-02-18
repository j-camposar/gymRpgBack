import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Muscle } from 'src/modules/muscle/schema/muscle.schema';
import { Character } from './character.schema';

@Schema()
export class CharacterMuscle extends Document {
    @Prop({ type: String, ref: 'Character', required: true })
    characterId: Character;

    @Prop({ type: String, ref: 'Muscle', required: true })
    muscleId: Muscle 

    @Prop({ default: 1 })
    level: number;

    @Prop({ default: 0 })
    xp: number;

    @Prop({ default: 0 })
    fatigue: number;
    
    @Prop({ default: 0 })
    hipertrofia: number;
}

export const CharacterMuscleSchema =
  SchemaFactory.createForClass(CharacterMuscle);
