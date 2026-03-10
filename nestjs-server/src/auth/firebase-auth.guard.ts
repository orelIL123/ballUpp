import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { FirebaseAdminService } from '../firebase-admin.service';

type AuthenticatedRequest = Request & {
  user?: {
    uid: string;
  };
};

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const token = authorization.replace('Bearer ', '').trim();

    try {
      const decoded = await this.firebaseAdminService.auth().verifyIdToken(token);
      request.user = { uid: decoded.uid };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Firebase token.');
    }
  }
}
