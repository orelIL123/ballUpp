import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  Timestamp,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getFirestoreDb, getFirebaseStorage, isFirebaseConfigured } from '@/services/firebase';
import {
  getDemoPlayersByIds,
  getDemoProfile,
  updateDemoProfile,
  upsertDemoProfile,
} from '@/services/demo-data';
import type {
  CourtType,
  Gender,
  NotificationSettings,
  PlayStyle,
  PlayerLevel,
  UserProfile,
  UserRole,
} from '@/types/models';

type CompleteProfileInput = {
  uid: string;
  email: string | null;
  displayName: string;
  city: string;
  area?: string;
  level: PlayerLevel;
  gender?: Gender;
  playStyle?: PlayStyle;
  role?: UserRole;
  favoriteCourtTypes?: CourtType[];
  notificationSettings?: NotificationSettings;
  photoUri?: string | null;
  videoUri?: string | null;
  currentPhotoURL?: string;
  currentVideoURL?: string;
};

const DEFAULT_STATS = {
  circlesJoined: 0,
  circlesCreated: 0,
  noShows: 0,
  rating: 5,
};

function mapUserProfile(data: Record<string, unknown>, uid: string): UserProfile {
  return {
    uid,
    email: typeof data.email === 'string' ? data.email : null,
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : '',
    videoURL: typeof data.videoURL === 'string' ? data.videoURL : '',
    level: (data.level as PlayerLevel | undefined) ?? 'beginner',
    gender: (data.gender as Gender | undefined) ?? 'other',
    playStyle: (data.playStyle as PlayStyle | undefined) ?? 'social',
    role: (data.role as UserRole | undefined) ?? 'player',
    city: typeof data.city === 'string' ? data.city : '',
    location:
      typeof data.location === 'object' && data.location
        ? {
            city: String((data.location as { city?: string }).city ?? ''),
            area: String((data.location as { area?: string }).area ?? ''),
            lat: Number((data.location as { lat?: number }).lat ?? 0),
            lng: Number((data.location as { lng?: number }).lng ?? 0),
          }
        : {
            city: typeof data.city === 'string' ? data.city : '',
            area: '',
            lat: 0,
            lng: 0,
          },
    favoriteCourtTypes: Array.isArray(data.favoriteCourtTypes)
      ? data.favoriteCourtTypes.map((item) => item as CourtType)
      : ['beach'],
    notificationSettings:
      typeof data.notificationSettings === 'object' && data.notificationSettings
        ? {
            nearbyCircles: Boolean((data.notificationSettings as NotificationSettings).nearbyCircles),
            circleReminders: Boolean((data.notificationSettings as NotificationSettings).circleReminders),
            chatMessages: Boolean((data.notificationSettings as NotificationSettings).chatMessages),
            managerAnnouncements: Boolean((data.notificationSettings as NotificationSettings).managerAnnouncements),
            weatherAlerts: Boolean((data.notificationSettings as NotificationSettings).weatherAlerts),
            urgentCircles: Boolean((data.notificationSettings as NotificationSettings).urgentCircles),
            soundsEnabled:
              (data.notificationSettings as NotificationSettings).soundsEnabled !== false,
            badgesEnabled:
              (data.notificationSettings as NotificationSettings).badgesEnabled !== false,
            selectedAreas: Array.isArray((data.notificationSettings as NotificationSettings).selectedAreas)
              ? (data.notificationSettings as NotificationSettings).selectedAreas
              : [],
            activeDays: Array.isArray((data.notificationSettings as NotificationSettings).activeDays)
              ? (data.notificationSettings as NotificationSettings).activeDays
              : ['sun', 'mon', 'tue', 'wed', 'thu'],
            timeFrom: String((data.notificationSettings as NotificationSettings).timeFrom ?? '17:00'),
            timeTo: String((data.notificationSettings as NotificationSettings).timeTo ?? '22:00'),
          }
        : {
            nearbyCircles: true,
            circleReminders: true,
            chatMessages: true,
            managerAnnouncements: true,
            weatherAlerts: false,
            urgentCircles: true,
            soundsEnabled: true,
            badgesEnabled: true,
            selectedAreas: [],
            activeDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
            timeFrom: '17:00',
            timeTo: '22:00',
          },
    fcmToken: typeof data.fcmToken === 'string' ? data.fcmToken : '',
    stats:
      typeof data.stats === 'object' && data.stats
        ? {
            circlesJoined: Number((data.stats as { circlesJoined?: number }).circlesJoined ?? 0),
            circlesCreated: Number((data.stats as { circlesCreated?: number }).circlesCreated ?? 0),
            noShows: Number((data.stats as { noShows?: number }).noShows ?? 0),
            rating: Number((data.stats as { rating?: number }).rating ?? 5),
          }
        : DEFAULT_STATS,
    createdAt: (data.createdAt as Timestamp | null | undefined) ?? null,
    profileCompleted: Boolean(data.profileCompleted),
  };
}

export async function getPlayerProfile(uid: string) {
  if (!isFirebaseConfigured) {
    return getDemoProfile(uid);
  }

  const snapshot = await getDoc(doc(getFirestoreDb(), 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return mapUserProfile(snapshot.data(), snapshot.id);
}

export async function getPlayersByIds(playerIds: string[]) {
  if (!isFirebaseConfigured) {
    return getDemoPlayersByIds(playerIds);
  }

  if (playerIds.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(playerIds)];
  const chunks: string[][] = [];

  for (let index = 0; index < uniqueIds.length; index += 10) {
    chunks.push(uniqueIds.slice(index, index + 10));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      getDocs(query(collection(getFirestoreDb(), 'users'), where(documentId(), 'in', chunk))),
    ),
  );

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map((item) => mapUserProfile(item.data(), item.id)),
  );
}

async function uploadMedia(uri: string, destination: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(getFirebaseStorage(), destination);

  await uploadBytes(storageRef, blob);

  return getDownloadURL(storageRef);
}

export async function completeUserProfile(input: CompleteProfileInput) {
  if (!isFirebaseConfigured) {
    const current = getDemoProfile(input.uid);
    const profile: UserProfile = {
      uid: input.uid,
      email: input.email,
      displayName: input.displayName.trim(),
      photoURL: input.photoUri ?? input.currentPhotoURL ?? '',
      videoURL: input.videoUri ?? input.currentVideoURL ?? '',
      level: input.level,
      gender: current?.gender ?? 'other',
      playStyle: current?.playStyle ?? 'social',
      role: current?.role ?? 'player',
      city: input.city.trim(),
      location: {
        city: input.city.trim(),
        area: input.area?.trim() ?? current?.location?.area ?? '',
        lat: current?.location?.lat ?? 0,
        lng: current?.location?.lng ?? 0,
      },
      favoriteCourtTypes: input.favoriteCourtTypes ?? current?.favoriteCourtTypes ?? ['beach'],
      notificationSettings:
        input.notificationSettings ??
        current?.notificationSettings ?? {
          nearbyCircles: true,
          circleReminders: true,
          chatMessages: true,
          managerAnnouncements: true,
          weatherAlerts: false,
          urgentCircles: true,
          soundsEnabled: true,
          badgesEnabled: true,
          selectedAreas: [],
          activeDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
          timeFrom: '17:00',
          timeTo: '22:00',
        },
      fcmToken: '',
      stats: current?.stats ?? DEFAULT_STATS,
      createdAt: current?.createdAt ?? Timestamp.now(),
      profileCompleted: true,
    };
    upsertDemoProfile(profile);
    return profile;
  }

  const photoURL =
    input.photoUri && !input.photoUri.startsWith('http')
      ? await uploadMedia(input.photoUri, `users/${input.uid}/profile-photo.jpg`)
      : (input.photoUri ?? input.currentPhotoURL ?? '');

  const videoURL =
    input.videoUri && !input.videoUri.startsWith('http')
      ? await uploadMedia(input.videoUri, `users/${input.uid}/profile-video.mp4`)
      : (input.videoUri ?? input.currentVideoURL ?? '');

  await setDoc(
    doc(getFirestoreDb(), 'users', input.uid),
    {
      uid: input.uid,
      email: input.email,
      displayName: input.displayName.trim(),
      photoURL,
      videoURL,
      level: input.level,
      gender: input.gender ?? 'other',
      playStyle: input.playStyle ?? 'social',
      role: input.role ?? 'player',
      city: input.city.trim(),
      location: {
        city: input.city.trim(),
        area: input.area?.trim() ?? '',
        lat: 0,
        lng: 0,
      },
      favoriteCourtTypes: input.favoriteCourtTypes ?? ['beach'],
      notificationSettings:
        input.notificationSettings ?? {
          nearbyCircles: true,
          circleReminders: true,
          chatMessages: true,
          managerAnnouncements: true,
          weatherAlerts: false,
          urgentCircles: true,
          soundsEnabled: true,
          badgesEnabled: true,
          selectedAreas: [],
          activeDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
          timeFrom: '17:00',
          timeTo: '22:00',
        },
      fcmToken: '',
      stats: DEFAULT_STATS,
      profileCompleted: true,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  return getPlayerProfile(input.uid);
}

export async function updatePlayerSettings(
  uid: string,
  patch: Partial<
    Pick<UserProfile, 'notificationSettings' | 'favoriteCourtTypes' | 'role' | 'location' | 'city' | 'fcmToken'>
  >,
) {
  if (!isFirebaseConfigured) {
    return updateDemoProfile(uid, patch);
  }

  await updateDoc(doc(getFirestoreDb(), 'users', uid), patch);
  return getPlayerProfile(uid);
}
