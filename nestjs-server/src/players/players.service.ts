import { Injectable } from '@nestjs/common';

import { FirebaseAdminService } from '../firebase-admin.service';

@Injectable()
export class PlayersService {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  async recalculateRating(userId: string, nextRating: number) {
    await this.firebaseAdminService.firestore().collection('users').doc(userId).set(
      {
        stats: {
          rating: nextRating,
        },
      },
      { merge: true },
    );

    return { ok: true };
  }
}
