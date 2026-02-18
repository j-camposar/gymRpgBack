import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { GetActiveMissionsDto, MisionService } from './mision.service';

@Controller('misions')
export class MisionController {
  constructor(private readonly misionService: MisionService) {}

  
    @Get('active')
    async getActive(@Query() query: GetActiveMissionsDto) {
        console.log(")")
        return this.misionService.getActiveMissions(query.characterId);
    }

    @Post('/missions/:id/claim')
    async claim(@Param('id') characterMissionId: string) {
    return this.misionService.claimMission(characterMissionId);
    }
}