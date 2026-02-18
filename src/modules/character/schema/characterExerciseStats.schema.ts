import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Muscle } from 'src/modules/muscle/schema/muscle.schema';
import { Character } from './character.schema';


@Schema({ timestamps: true })
export class CharacterExerciseStats {
    @Prop({ type: String, ref: 'Muscle', required: true })
    muscleId: Muscle

    @Prop({ type: String, ref: 'Character', required: true })
    characterId: Character;
   
    @Prop({ required: true })
    pesoMaximo: number; // kg

    @Prop({ required: true})
    lastUpdate: Date;

}
export const CharacterExerciseStatsSchema = SchemaFactory.createForClass(CharacterExerciseStats);
