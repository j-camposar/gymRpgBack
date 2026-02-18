import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MissionConfig } from '../interface/mision.interface';

export type MissionType = 'DAILY' | 'WEEKLY';

@Schema()
export class Mision extends Document {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;      

  @Prop({ required: true, enum: ['DAILY', 'WEEKLY'] })
  type: MissionType;  

  @Prop({ default: 1 })
  rewardCoins: number;

  @Prop({ type: Object, required: true })
  config: MissionConfig; 
}

export const MisionSchema =
  SchemaFactory.createForClass(Mision);

