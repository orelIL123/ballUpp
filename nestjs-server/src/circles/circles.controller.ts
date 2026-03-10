import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CirclesService } from './circles.service';

@Controller('circles')
@UseGuards(FirebaseAuthGuard)
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  @Get('nearby')
  getNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm = '10',
  ) {
    return this.circlesService.findNearby({
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: Number(radiusKm),
    });
  }
}
