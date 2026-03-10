import {
  Timestamp,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { getFirestoreDb, isFirebaseConfigured } from '@/services/firebase';
import {
  createDemoCircle,
  joinDemoCircle,
  leaveDemoCircle,
  sendDemoMessage,
  subscribeToDemoChat,
  subscribeToDemoCircle,
  subscribeToDemoCircles,
} from '@/services/demo-data';
import type { ChatMessage, Circle, CircleGenderRestriction, CreateCirclePayload } from '@/types/models';
import { getPlayerProfile } from '@/services/players.service';
import { parseDateTimeInput } from '@/utils/date';

function mapCircle(id: string, data: Record<string, unknown>): Circle {
  return {
    id,
    creatorId: String(data.creatorId ?? ''),
    creatorName: String(data.creatorName ?? ''),
    creatorPhotoURL: String(data.creatorPhotoURL ?? ''),
    title: String(data.title ?? ''),
    location: {
      name: String((data.location as { name?: string } | undefined)?.name ?? ''),
      lat: Number((data.location as { lat?: number } | undefined)?.lat ?? 0),
      lng: Number((data.location as { lng?: number } | undefined)?.lng ?? 0),
    },
    city: String(data.city ?? ''),
    area: String(data.area ?? ''),
    courtType: (data.courtType as Circle['courtType'] | undefined) ?? 'beach',
    dateTime: (data.dateTime as Timestamp | undefined) ?? Timestamp.now(),
    maxPlayers: Number(data.maxPlayers ?? 4),
    players: Array.isArray(data.players) ? data.players.map(String) : [],
    requiredLevel: (data.requiredLevel as Circle['requiredLevel'] | undefined) ?? 'any',
    status: (data.status as Circle['status'] | undefined) ?? 'open',
    genderRestriction: (data.genderRestriction as CircleGenderRestriction | undefined) ?? 'any',
    isUrgent: Boolean(data.isUrgent),
    chatEnabled: Boolean(data.chatEnabled ?? true),
    createdAt: (data.createdAt as Timestamp | undefined) ?? Timestamp.now(),
  };
}

function mapMessage(id: string, data: Record<string, unknown>): ChatMessage {
  return {
    id,
    senderId: String(data.senderId ?? ''),
    senderName: String(data.senderName ?? ''),
    text: String(data.text ?? ''),
    createdAt: (data.createdAt as Timestamp | undefined) ?? null,
  };
}

export function subscribeToCircles(onData: (circles: Circle[]) => void, onError: (error: Error) => void) {
  if (!isFirebaseConfigured) {
    return subscribeToDemoCircles(onData);
  }

  return onSnapshot(
    query(collection(getFirestoreDb(), 'circles'), orderBy('dateTime', 'asc')),
    (snapshot) => {
      const circles = snapshot.docs
        .map((item) => mapCircle(item.id, item.data()))
        .filter((item) => item.status !== 'completed' && item.status !== 'closed');

      onData(circles);
    },
    (error) => onError(error),
  );
}

export function subscribeToCircle(
  circleId: string,
  onData: (circle: Circle | null) => void,
  onError: (error: Error) => void,
) {
  if (!isFirebaseConfigured) {
    return subscribeToDemoCircle(circleId, onData);
  }

  return onSnapshot(
    doc(getFirestoreDb(), 'circles', circleId),
    (snapshot) => {
      onData(snapshot.exists() ? mapCircle(snapshot.id, snapshot.data()) : null);
    },
    (error) => onError(error),
  );
}

export function subscribeToCircleChat(
  circleId: string,
  onData: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void,
) {
  if (!isFirebaseConfigured) {
    return subscribeToDemoChat(circleId, onData);
  }

  return onSnapshot(
    query(collection(getFirestoreDb(), 'chats', circleId, 'messages'), orderBy('createdAt', 'asc')),
    (snapshot) => {
      onData(snapshot.docs.map((item) => mapMessage(item.id, item.data())));
    },
    (error) => onError(error),
  );
}

export async function createCircle(payload: CreateCirclePayload) {
  if (!isFirebaseConfigured) {
    return createDemoCircle(payload);
  }

  const dateTime = parseDateTimeInput(payload.date, payload.time);
  const circleRef = await addDoc(collection(getFirestoreDb(), 'circles'), {
    creatorId: payload.creatorId,
    creatorName: payload.creatorName ?? '',
    creatorPhotoURL: payload.creatorPhotoURL ?? '',
    title: payload.title.trim(),
    location: {
      name: payload.locationName.trim(),
      lat: payload.lat ?? 0,
      lng: payload.lng ?? 0,
    },
    city: payload.city.trim(),
    area: payload.area.trim(),
    courtType: payload.courtType,
    dateTime: Timestamp.fromDate(dateTime),
    maxPlayers: payload.maxPlayers,
    players: [payload.creatorId],
    requiredLevel: payload.requiredLevel,
    genderRestriction: payload.genderRestriction,
    isUrgent: Boolean(payload.isUrgent),
    status: payload.maxPlayers <= 1 ? 'full' : 'open',
    chatEnabled: true,
    createdAt: serverTimestamp(),
  });

  await updateDoc(circleRef, { id: circleRef.id });

  return circleRef.id;
}

export async function joinCircle(circleId: string, userId: string) {
  if (!isFirebaseConfigured) {
    return joinDemoCircle(circleId, userId);
  }

  const firestore = getFirestoreDb();
  const circleRef = doc(firestore, 'circles', circleId);
  const userProfile = await getPlayerProfile(userId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(circleRef);

    if (!snapshot.exists()) {
      throw new Error('המעגל לא נמצא.');
    }

    const circle = mapCircle(snapshot.id, snapshot.data());

    if (circle.players.includes(userId)) {
      return;
    }

    if (circle.status !== 'open' || circle.players.length >= circle.maxPlayers) {
      throw new Error('המעגל כבר מלא או סגור.');
    }

    if (circle.genderRestriction !== 'any') {
      const userGender = userProfile?.gender;
      const canJoin =
        (circle.genderRestriction === 'female' && userGender === 'female') ||
        (circle.genderRestriction === 'male' && userGender === 'male');
      if (!canJoin) {
        throw new Error(
          circle.genderRestriction === 'female'
            ? 'מעגל זה פתוח לבנות בלבד.'
            : 'מעגל זה פתוח לבנים בלבד.',
        );
      }
    }

    const nextPlayers = [...circle.players, userId];
    transaction.update(circleRef, {
      players: arrayUnion(userId),
      status: nextPlayers.length >= circle.maxPlayers ? 'full' : 'open',
    });
  });
}

export async function leaveCircle(circleId: string, userId: string) {
  if (!isFirebaseConfigured) {
    return leaveDemoCircle(circleId, userId);
  }

  const firestore = getFirestoreDb();
  const circleRef = doc(firestore, 'circles', circleId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(circleRef);

    if (!snapshot.exists()) {
      throw new Error('המעגל לא נמצא.');
    }

    const circle = mapCircle(snapshot.id, snapshot.data());
    const nextPlayers = circle.players.filter((playerId) => playerId !== userId);

    transaction.update(circleRef, {
      players: arrayRemove(userId),
      status: nextPlayers.length === 0 ? 'closed' : nextPlayers.length >= circle.maxPlayers ? 'full' : 'open',
    });
  });
}

export async function sendChatMessage(circleId: string, senderId: string, senderName: string, text: string) {
  if (!text.trim()) {
    return;
  }

  if (!isFirebaseConfigured) {
    return sendDemoMessage(circleId, senderId, senderName, text);
  }

  await addDoc(collection(getFirestoreDb(), 'chats', circleId, 'messages'), {
    senderId,
    senderName,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getCircle(circleId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), 'circles', circleId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapCircle(snapshot.id, snapshot.data());
}
