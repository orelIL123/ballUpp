import { Module } from '@nestjs/common';

import { FirebaseAdminService } from './firebase-admin.service';
import { AuthModule } from './auth/auth.module';
import { CirclesModule } from './circles/circles.module';
import { PlayersModule } from './players/players.module';

@Module({
  imports: [AuthModule, CirclesModule, PlayersModule],
  providers: [FirebaseAdminService],
  exports: [FirebaseAdminService],
})
export class AppModule {}
