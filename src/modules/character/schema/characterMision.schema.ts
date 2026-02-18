import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Mision } from 'src/modules/mission/schema/mision.schema';

@Schema({ timestamps: true })
export class CharacterMision extends Document {

  @Prop({ type: Types.ObjectId, ref: 'Character', required: true })
  characterId: Types.ObjectId;

  @Prop({ type: String, ref: 'Mision', required: true })
  misionId: Mision;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ default: false })
  claimed: boolean;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const CharacterMisionSchema =
  SchemaFactory.createForClass(CharacterMision);
