import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getFirestoreDb, isFirebaseConfigured } from '@/services/firebase';
import { getPlayerProfile } from '@/services/players.service';
import type { UserProfile } from '@/types/models';

export type PlayerRatingRecord = {
  circleId: string;
  raterId: string;
  ratedId: string;
  score: number;
  createdAt: Timestamp | null;
};

export async function submitRating(circleId: string, raterId: string, ratedId: string, score: number): Promise<void> {
  if (raterId === ratedId) {
    throw new Error('לא ניתן לדרג את עצמך.');
  }
  if (score < 1 || score > 5) {
    throw new Error('הדירוג חייב להיות בין 1 ל-5.');
  }

  if (!isFirebaseConfigured) {
    return submitDemoRating(circleId, raterId, ratedId, score);
  }

  const db = getFirestoreDb();
  const existing = await getDocs(
    query(
      collection(db, 'ratings'),
      where('circleId', '==', circleId),
      where('raterId', '==', raterId),
      where('ratedId', '==', ratedId),
    ),
  );

  if (!existing.empty) {
    throw new Error('כבר דירגת שחקן זה במעגל הזה.');
  }

  await addDoc(collection(db, 'ratings'), {
    circleId,
    raterId,
    ratedId,
    score,
    createdAt: serverTimestamp(),
  });

  await recalculatePlayerRating(ratedId);
}

export async function getMyRatingsForCircle(circleId: string, raterId: string): Promise<Record<string, number>> {
  if (!isFirebaseConfigured) {
    return getDemoRatingsForCircle(circleId, raterId);
  }

  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(collection(db, 'ratings'), where('circleId', '==', circleId), where('raterId', '==', raterId)),
  );

  const result: Record<string, number> = {};
  snapshot.docs.forEach((d) => {
    const data = d.data();
    result[String(data.ratedId)] = Number(data.score);
  });
  return result;
}

async function recalculatePlayerRating(userId: string): Promise<void> {
  const profile = await getPlayerProfile(userId);
  if (!profile) return;

  const db = getFirestoreDb();
  const snapshot = await getDocs(query(collection(db, 'ratings'), where('ratedId', '==', userId)));
  if (snapshot.empty) return;

  const scores = snapshot.docs.map((d) => Number(d.data().score));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const rounded = Math.round(avg * 10) / 10;

  await updateDoc(doc(db, 'users', userId), {
    'stats.rating': rounded,
  });
}

// Demo mode
const demoRatings = new Map<string, { circleId: string; raterId: string; ratedId: string; score: number }>();

function ratingKey(circleId: string, raterId: string, ratedId: string) {
  return `${circleId}:${raterId}:${ratedId}`;
}

async function submitDemoRating(circleId: string, raterId: string, ratedId: string, score: number): Promise<void> {
  const key = ratingKey(circleId, raterId, ratedId);
  if (demoRatings.has(key)) {
    throw new Error('כבר דירגת שחקן זה במעגל הזה.');
  }
  demoRatings.set(key, { circleId, raterId, ratedId, score });

  const profile = await getPlayerProfile(ratedId);
  if (profile) {
    const { updateDemoProfile } = await import('@/services/demo-data');
    const existingRatings = [...demoRatings.values()].filter((r) => r.ratedId === ratedId);
    const avg = existingRatings.reduce((a, r) => a + r.score, 0) / existingRatings.length;
    const rounded = Math.round(avg * 10) / 10;
    updateDemoProfile(ratedId, { stats: { ...profile.stats, rating: rounded } });
  }
}

async function getDemoRatingsForCircle(circleId: string, raterId: string): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  demoRatings.forEach((r, key) => {
    if (r.circleId === circleId && r.raterId === raterId) {
      result[r.ratedId] = r.score;
    }
  });
  return result;
}
