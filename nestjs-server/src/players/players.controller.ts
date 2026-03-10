import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { PlayersService } from './players.service';

@Controller('players')
@UseGuards(FirebaseAuthGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post('recalculate-rating')
  recalculateRating(
    @Body()
    body: {
      userId: string;
      nextRating: number;
    },
  ) {
    return this.playersService.recalculateRating(body.userId, body.nextRating);
  }
}
