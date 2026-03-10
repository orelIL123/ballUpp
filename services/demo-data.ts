import { Timestamp } from 'firebase/firestore';

import type {
  ChatMessage,
  Circle,
  CreateCirclePayload,
  CourtType,
  Gender,
  NotificationSettings,
  PlayStyle,
  UserProfile,
} from '@/types/models';
import { parseDateTimeInput } from '@/utils/date';

type Listener<T> = (value: T) => void;

const now = Date.now();

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  nearbyCircles: true,
  circleReminders: true,
  chatMessages: true,
  managerAnnouncements: true,
  weatherAlerts: false,
  urgentCircles: true,
  soundsEnabled: true,
  badgesEnabled: true,
  selectedAreas: ['תל אביב'],
  activeDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
  timeFrom: '17:00',
  timeTo: '22:00',
};

const users = new Map<string, UserProfile>([
  [
    'guest-user',
    {
      uid: 'guest-user',
      email: null,
      displayName: 'אורח',
      photoURL: '',
      videoURL: '',
      level: 'intermediate',
      gender: 'other',
      playStyle: 'social',
      role: 'manager',
      city: 'תל אביב',
      location: {
        city: 'תל אביב',
        area: 'צפון הישן',
        lat: 32.0853,
        lng: 34.7818,
      },
      favoriteCourtTypes: ['beach', 'grass'],
      notificationSettings: DEFAULT_NOTIFICATIONS,
      fcmToken: '',
      stats: {
        circlesJoined: 2,
        circlesCreated: 1,
        noShows: 0,
        rating: 4.7,
      },
      createdAt: Timestamp.fromMillis(now),
      profileCompleted: true,
    },
  ],
  [
    'player-1',
    {
      uid: 'player-1',
      email: 'oded@example.com',
      displayName: 'עודד לוי',
      photoURL: '',
      videoURL: '',
      level: 'expert',
      gender: 'male',
      playStyle: 'competitive',
      role: 'manager',
      city: 'תל אביב',
      location: {
        city: 'תל אביב',
        area: 'גורדון',
        lat: 32.0853,
        lng: 34.7818,
      },
      favoriteCourtTypes: ['beach'],
      notificationSettings: DEFAULT_NOTIFICATIONS,
      fcmToken: '',
      stats: {
        circlesJoined: 14,
        circlesCreated: 5,
        noShows: 1,
        rating: 4.9,
      },
      createdAt: Timestamp.fromMillis(now - 1000 * 60 * 60 * 24 * 80),
      profileCompleted: true,
    },
  ],
  [
    'player-2',
    {
      uid: 'player-2',
      email: 'ron@example.com',
      displayName: 'רון כהן',
      photoURL: '',
      videoURL: '',
      level: 'intermediate',
      gender: 'male',
      playStyle: 'sunset',
      role: 'player',
      city: 'הרצליה',
      location: {
        city: 'הרצליה',
        area: 'מרינה',
        lat: 32.1624,
        lng: 34.8441,
      },
      favoriteCourtTypes: ['beach', 'asphalt'],
      notificationSettings: DEFAULT_NOTIFICATIONS,
      fcmToken: '',
      stats: {
        circlesJoined: 9,
        circlesCreated: 2,
        noShows: 0,
        rating: 4.6,
      },
      createdAt: Timestamp.fromMillis(now - 1000 * 60 * 60 * 24 * 50),
      profileCompleted: true,
    },
  ],
  [
    'player-3',
    {
      uid: 'player-3',
      email: 'gal@example.com',
      displayName: 'גל מזרחי',
      photoURL: '',
      videoURL: '',
      level: 'beginner',
      gender: 'female',
      playStyle: 'social',
      role: 'player',
      city: 'בת ים',
      location: {
        city: 'בת ים',
        area: 'טיילת',
        lat: 32.0158,
        lng: 34.75,
      },
      favoriteCourtTypes: ['grass'],
      notificationSettings: DEFAULT_NOTIFICATIONS,
      fcmToken: '',
      stats: {
        circlesJoined: 4,
        circlesCreated: 1,
        noShows: 0,
        rating: 4.2,
      },
      createdAt: Timestamp.fromMillis(now - 1000 * 60 * 60 * 24 * 30),
      profileCompleted: true,
    },
  ],
]);

let circles: Circle[] = [
  {
    id: 'circle-1',
    creatorId: 'player-1',
    creatorName: 'עודד לוי',
    creatorPhotoURL: '',
    title: 'הקפצה של שקיעה',
    location: { name: 'חוף גורדון, תל אביב', lat: 0, lng: 0 },
    city: 'תל אביב',
    area: 'גורדון',
    courtType: 'beach',
    dateTime: Timestamp.fromMillis(now + 1000 * 60 * 60 * 3),
    maxPlayers: 4,
    players: ['player-1', 'player-2'],
    requiredLevel: 'intermediate',
    genderRestriction: 'any',
    isUrgent: false,
    status: 'open',
    chatEnabled: true,
    createdAt: Timestamp.fromMillis(now - 1000 * 60 * 20),
  },
  {
    id: 'circle-2',
    creatorId: 'player-2',
    creatorName: 'רון כהן',
    creatorPhotoURL: '',
    title: 'בוקר קליל על החול',
    location: { name: 'חוף סירונית, נתניה', lat: 0, lng: 0 },
    city: 'נתניה',
    area: 'סירונית',
    courtType: 'beach',
    dateTime: Timestamp.fromMillis(now + 1000 * 60 * 60 * 18),
    maxPlayers: 6,
    players: ['player-2', 'player-3', 'guest-user'],
    requiredLevel: 'any',
    genderRestriction: 'any',
    isUrgent: true,
    status: 'open',
    chatEnabled: true,
    createdAt: Timestamp.fromMillis(now - 1000 * 60 * 45),
  },
  {
    id: 'circle-3',
    creatorId: 'guest-user',
    creatorName: 'אורח',
    creatorPhotoURL: '',
    title: 'ערב מהיר בפארק',
    location: { name: 'פארק מנחם בגין', lat: 0, lng: 0 },
    city: 'תל אביב',
    area: 'דרום העיר',
    courtType: 'grass',
    dateTime: Timestamp.fromMillis(now + 1000 * 60 * 60 * 26),
    maxPlayers: 4,
    players: ['guest-user', 'player-3'],
    requiredLevel: 'any',
    genderRestriction: 'any',
    isUrgent: false,
    status: 'open',
    chatEnabled: true,
    createdAt: Timestamp.fromMillis(now - 1000 * 60 * 70),
  },
  {
    id: 'circle-4',
    creatorId: 'player-1',
    creatorName: 'עודד לוי',
    creatorPhotoURL: '',
    title: 'משחק סגור - חוף גורדון',
    location: { name: 'חוף גורדון', lat: 0, lng: 0 },
    city: 'תל אביב',
    area: 'גורדון',
    courtType: 'beach',
    dateTime: Timestamp.fromMillis(now - 1000 * 60 * 60 * 24),
    maxPlayers: 4,
    players: ['player-1', 'player-2', 'guest-user'],
    requiredLevel: 'intermediate',
    genderRestriction: 'any',
    isUrgent: false,
    status: 'closed',
    chatEnabled: true,
    createdAt: Timestamp.fromMillis(now - 1000 * 60 * 60 * 48),
  },
  {
    id: 'circle-5',
    creatorId: 'player-3',
    creatorName: 'גל מזרחי',
    creatorPhotoURL: '',
    title: 'מעגל בנות - חוף השרון',
    location: { name: 'חוף השרון', lat: 0, lng: 0 },
    city: 'הרצליה',
    area: 'מרינה',
    courtType: 'beach',
    dateTime: Timestamp.fromMillis(now + 1000 * 60 * 60 * 12),
    maxPlayers: 4,
    players: ['player-3'],
    requiredLevel: 'any',
    genderRestriction: 'female',
    isUrgent: true,
    status: 'open',
    chatEnabled: true,
    createdAt: Timestamp.fromMillis(now - 1000 * 60 * 30),
  },
];

let chats: Record<string, ChatMessage[]> = {
  'circle-1': [
    {
      id: 'msg-1',
      senderId: 'player-1',
      senderName: 'עודד לוי',
      text: 'מי מביא כדור?',
      createdAt: Timestamp.fromMillis(now - 1000 * 60 * 10),
    },
    {
      id: 'msg-2',
      senderId: 'player-2',
      senderName: 'רון כהן',
      text: 'אני מגיע עם כדור ומים.',
      createdAt: Timestamp.fromMillis(now - 1000 * 60 * 8),
    },
  ],
  'circle-2': [
    {
      id: 'msg-3',
      senderId: 'player-3',
      senderName: 'גל מזרחי',
      text: 'אני קצת מאחר, תשמרו מקום.',
      createdAt: Timestamp.fromMillis(now - 1000 * 60 * 5),
    },
  ],
  'circle-3': [
    {
      id: 'msg-4',
      senderId: 'guest-user',
      senderName: 'אורח',
      text: 'בדשא היום, מי בא?',
      createdAt: Timestamp.fromMillis(now - 1000 * 60 * 4),
    },
  ],
};

const circleListeners = new Set<Listener<Circle[]>>();
const circleDetailListeners = new Map<string, Set<Listener<Circle | null>>>();
const chatListeners = new Map<string, Set<Listener<ChatMessage[]>>>();

function emitCircles() {
  const snapshot = [...circles].sort(
    (left, right) => left.dateTime.toMillis() - right.dateTime.toMillis(),
  );
  circleListeners.forEach((listener) => listener(snapshot));
  circleDetailListeners.forEach((listeners, circleId) => {
    const circle = circles.find((item) => item.id === circleId) ?? null;
    listeners.forEach((listener) => listener(circle));
  });
}

function emitChat(circleId: string) {
  const messages = chats[circleId] ?? [];
  chatListeners.get(circleId)?.forEach((listener) => listener(messages));
}

export function getDemoProfile(uid: string) {
  return users.get(uid) ?? null;
}

export function upsertDemoProfile(profile: UserProfile) {
  users.set(profile.uid, profile);
}

export function subscribeToDemoCircles(listener: Listener<Circle[]>) {
  circleListeners.add(listener);
  listener([...circles]);
  return () => {
    circleListeners.delete(listener);
  };
}

export function subscribeToDemoCircle(circleId: string, listener: Listener<Circle | null>) {
  const listeners = circleDetailListeners.get(circleId) ?? new Set<Listener<Circle | null>>();
  listeners.add(listener);
  circleDetailListeners.set(circleId, listeners);
  listener(circles.find((item) => item.id === circleId) ?? null);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeToDemoChat(circleId: string, listener: Listener<ChatMessage[]>) {
  const listeners = chatListeners.get(circleId) ?? new Set<Listener<ChatMessage[]>>();
  listeners.add(listener);
  chatListeners.set(circleId, listeners);
  listener(chats[circleId] ?? []);
  return () => {
    listeners.delete(listener);
  };
}

export async function getDemoPlayersByIds(playerIds: string[]) {
  return playerIds.map((id) => users.get(id)).filter((item): item is UserProfile => Boolean(item));
}

export async function createDemoCircle(payload: CreateCirclePayload) {
  const id = `circle-${Date.now()}`;
  const dateTime = parseDateTimeInput(payload.date, payload.time);
  const circle: Circle = {
    id,
    creatorId: payload.creatorId,
    creatorName: payload.creatorName ?? users.get(payload.creatorId)?.displayName ?? '',
    creatorPhotoURL: payload.creatorPhotoURL ?? users.get(payload.creatorId)?.photoURL ?? '',
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
    genderRestriction: payload.genderRestriction ?? 'any',
    isUrgent: Boolean(payload.isUrgent),
    status: payload.maxPlayers === 1 ? 'full' : 'open',
    chatEnabled: true,
    createdAt: Timestamp.now(),
  };

  circles = [circle, ...circles];
  chats[id] = [];

  const creator = users.get(payload.creatorId);
  if (creator) {
    users.set(payload.creatorId, {
      ...creator,
      stats: {
        ...creator.stats,
        circlesCreated: creator.stats.circlesCreated + 1,
      },
    });
  }

  emitCircles();
  emitChat(id);
  return id;
}

export async function joinDemoCircle(circleId: string, userId: string) {
  const circle = circles.find((c) => c.id === circleId);
  if (circle && circle.genderRestriction !== 'any') {
    const user = users.get(userId);
    const userGender = user?.gender;
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

  circles = circles.map((c) => {
    if (c.id !== circleId || c.players.includes(userId) || c.status !== 'open') {
      return c;
    }

    const nextPlayers = [...c.players, userId];
    return {
      ...c,
      players: nextPlayers,
      status: nextPlayers.length >= c.maxPlayers ? 'full' : 'open',
    };
  });

  const user = users.get(userId);
  if (user) {
    users.set(userId, {
      ...user,
      stats: {
        ...user.stats,
        circlesJoined: user.stats.circlesJoined + 1,
      },
    });
  }

  emitCircles();
}

export async function leaveDemoCircle(circleId: string, userId: string) {
  circles = circles.map((circle) => {
    if (circle.id !== circleId) {
      return circle;
    }

    const nextPlayers = circle.players.filter((playerId) => playerId !== userId);
    return {
      ...circle,
      players: nextPlayers,
      status: nextPlayers.length === 0 ? 'closed' : nextPlayers.length >= circle.maxPlayers ? 'full' : 'open',
    };
  });

  emitCircles();
}

export async function sendDemoMessage(circleId: string, senderId: string, senderName: string, text: string) {
  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    senderId,
    senderName,
    text: text.trim(),
    createdAt: Timestamp.now(),
  };
  chats[circleId] = [...(chats[circleId] ?? []), message];
  emitChat(circleId);
}

export function createGuestProfile() {
  return users.get('guest-user')!;
}

export function createDemoProfile(input: {
  displayName: string;
  city: string;
  area?: string;
  level: UserProfile['level'];
  gender: Gender;
  playStyle: PlayStyle;
  role?: UserProfile['role'];
  favoriteCourtTypes?: CourtType[];
}) {
  const uid = `demo-${Date.now()}`;
  const profile: UserProfile = {
    uid,
    email: null,
    displayName: input.displayName.trim(),
    photoURL: '',
    videoURL: '',
    level: input.level,
    gender: input.gender,
    playStyle: input.playStyle,
    role: input.role ?? 'player',
    city: input.city.trim(),
    location: {
      city: input.city.trim(),
      area: input.area?.trim() ?? '',
      lat: 0,
      lng: 0,
    },
    favoriteCourtTypes: input.favoriteCourtTypes ?? ['beach'],
    notificationSettings: DEFAULT_NOTIFICATIONS,
    fcmToken: '',
    stats: {
      circlesJoined: 0,
      circlesCreated: 0,
      noShows: 0,
      rating: 5,
    },
    createdAt: Timestamp.now(),
    profileCompleted: true,
  };

  users.set(uid, profile);
  return profile;
}

export function updateDemoProfile(uid: string, patch: Partial<UserProfile>) {
  const current = users.get(uid);

  if (!current) {
    return null;
  }

  const currentLocation = current.location ?? {
    city: current.city,
    area: '',
    lat: 0,
    lng: 0,
  };
  const patchLocation = patch.location;
  const nextLocation = {
    city: patchLocation?.city ?? currentLocation.city,
    area: patchLocation?.area ?? currentLocation.area,
    lat: patchLocation?.lat ?? currentLocation.lat,
    lng: patchLocation?.lng ?? currentLocation.lng,
  };

  const currentNotifications = current.notificationSettings ?? DEFAULT_NOTIFICATIONS;
  const patchNotifications = patch.notificationSettings;
  const nextNotifications = {
    nearbyCircles: patchNotifications?.nearbyCircles ?? currentNotifications.nearbyCircles,
    circleReminders: patchNotifications?.circleReminders ?? currentNotifications.circleReminders,
    chatMessages: patchNotifications?.chatMessages ?? currentNotifications.chatMessages,
    managerAnnouncements:
      patchNotifications?.managerAnnouncements ?? currentNotifications.managerAnnouncements,
    weatherAlerts: patchNotifications?.weatherAlerts ?? currentNotifications.weatherAlerts,
    urgentCircles: patchNotifications?.urgentCircles ?? currentNotifications.urgentCircles,
    soundsEnabled: patchNotifications?.soundsEnabled ?? currentNotifications.soundsEnabled,
    badgesEnabled: patchNotifications?.badgesEnabled ?? currentNotifications.badgesEnabled,
    selectedAreas: patchNotifications?.selectedAreas ?? currentNotifications.selectedAreas,
    activeDays: patchNotifications?.activeDays ?? currentNotifications.activeDays,
    timeFrom: patchNotifications?.timeFrom ?? currentNotifications.timeFrom,
    timeTo: patchNotifications?.timeTo ?? currentNotifications.timeTo,
  };

  const nextProfile: UserProfile = {
    ...current,
    ...patch,
    city: patch.city ?? nextLocation.city,
    location: nextLocation,
    notificationSettings: nextNotifications,
    favoriteCourtTypes: patch.favoriteCourtTypes ?? current.favoriteCourtTypes,
    fcmToken: patch.fcmToken ?? current.fcmToken,
  };

  users.set(uid, nextProfile);
  return nextProfile;
}
