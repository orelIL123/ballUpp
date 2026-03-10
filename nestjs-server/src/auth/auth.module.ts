import { Module } from '@nestjs/common';

import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseAdminService } from '../firebase-admin.service';

@Module({
  providers: [FirebaseAdminService, FirebaseAuthGuard],
  exports: [FirebaseAuthGuard],
})
export class AuthModule {}
