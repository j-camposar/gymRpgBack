import { Module } from '@nestjs/common';
import { MuscleService } from './muscle.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Muscle, MuscleSchema } from './schema/muscle.schema';
import { CharacterMuscle, CharacterMuscleSchema } from '../character/schema/characterMuscle.schema';

@Module({
   imports: [
        MongooseModule.forFeature([
            { name: Muscle.name, schema: MuscleSchema },
            { name: CharacterMuscle.name, schema: CharacterMuscleSchema },
        ]),
    ],
    exports: [MongooseModule],
    providers: [MuscleService]
})
export class MuscleModule {}
