import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModuleOptions } from '@nestjs/mongoose';

import { MongooseModule } from '@nestjs/mongoose';
import { databaseConfig } from './config/database.config';
import { CharacterModule } from './modules/character/character.module';
import { MuscleModule } from './modules/muscle/muscle.module';
import { TrainingModule } from './modules/training/training.module';
import { MisionModule } from './modules/mission/mision.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { AuthModule } from './modules/login/auth.module';
import { StateModule } from './modules/state/state.module';

@Module({
  imports: [
    MongooseModule.forRoot(databaseConfig.uri),
    CharacterModule,
    MuscleModule,
    TrainingModule,
    MisionModule,
    ExerciseModule,
    AuthModule,
    StateModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
