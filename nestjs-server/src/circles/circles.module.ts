import { Module } from '@nestjs/common';

import { FirebaseAdminService } from '../firebase-admin.service';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';

@Module({
  controllers: [CirclesController],
  providers: [FirebaseAdminService, CirclesService],
})
export class CirclesModule {}
