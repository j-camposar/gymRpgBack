import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { StateService } from "./state.service";

@Controller('state')
export class StateController {
    constructor(
        private readonly stateService: StateService,
    ) {}
    @Get(':id')
    async getState(@Param('id') character_id: string) {
        return this.stateService.estado(character_id);
    }
}