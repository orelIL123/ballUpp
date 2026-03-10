import { Injectable } from '@nestjs/common';

import { FirebaseAdminService } from '../firebase-admin.service';

type NearbyQuery = {
  lat: number;
  lng: number;
  radiusKm: number;
};

type CircleRecord = {
  id: string;
  location?: {
    lat?: number;
    lng?: number;
  };
} & Record<string, unknown>;

@Injectable()
export class CirclesService {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  async findNearby(query: NearbyQuery) {
    const snapshot = await this.firebaseAdminService.firestore().collection('circles').get();

    return snapshot.docs
      .map(
        (doc): CircleRecord => ({
          id: doc.id,
          ...(doc.data() as Record<string, unknown>),
        }),
      )
      .filter((circle: CircleRecord) => {
        const location = circle.location;

        if (typeof location?.lat !== 'number' || typeof location.lng !== 'number') {
          return false;
        }

        return distanceInKm(query.lat, query.lng, location.lat, location.lng) <= query.radiusKm;
      });
  }
}

function distanceInKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
