import { Module } from '@nestjs/common';

import { FirebaseAdminService } from '../firebase-admin.service';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
  controllers: [PlayersController],
  providers: [FirebaseAdminService, PlayersService],
})
export class PlayersModule {}
