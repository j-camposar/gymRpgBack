import { Body, Controller, Post } from "@nestjs/common";
import { TrainingService } from "./training.service";

@Controller('training')
export class TrainingController {
  constructor(
    private readonly trainingService: TrainingService,
  ) {}

  @Post()
  async register(@Body() body: { characterId: string,
    exerciseId: string,
    weight: number,
    reps: number,
    difficulty: number,
    sessionId:string}) {
    return this.trainingService.registerTraining(body.characterId,
        body.exerciseId,
        body.weight,
        body.reps,
        body.difficulty,
        body.sessionId);
  }
  @Post("/descanso")
  async descanso(@Body() body: { characterId: string,
    restSeconds: number}) {
    return this.trainingService.descansar(body.characterId,
        body.restSeconds
        );
  }
  @Post("/crearEntrenamiento")
  async crearEntrenamiento(@Body() body: { characterId: string}) {
    return this.trainingService.createTraining(body.characterId);
  }
   @Post("/terminarEntrenamiento")
  async terminarEntrenamiento(@Body() body: { characterId: string, sessionId:string}) {
    return this.trainingService.finishWorkOut(body.characterId, body.sessionId);
  }
}