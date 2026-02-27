import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema({ timestamps: true })
export class NutritionLog {
    @Prop({ type: Types.ObjectId, ref: 'Character', required: true })
    characterId: Types.ObjectId;

    @Prop({ required: true })
    suministro: string;

    @Prop({ type: Object })
    bio_marcadores: {
        calorias: number;
        proteinas: number;
        carbs: number;
        grasas: number;
        fibra: number;
    };

    @Prop({ type: Object })
    rpg_stats: {
        buff_principal: string;
        calidad: string;
        puntos_recuperacion: number;
    };
}