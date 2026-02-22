import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { GetActiveMissionsDto, MisionService } from './mision.service';

@Controller('misions')
export class MisionController {
  constructor(private readonly misionService: MisionService) {}
    @Get('available')
    async findAllMissions() {
        return await this.misionService.findAll();
    }
  
    @Get('active')
    async getActive(@Query() query: GetActiveMissionsDto) {
        return this.misionService.getActiveMissions(query.characterId);
    }

    @Post(':id/claim')
    async claim(@Param('id') characterMissionId: string) {
    return this.misionService.claimMission(characterMissionId);
    }
}