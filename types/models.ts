import type { Timestamp } from 'firebase/firestore';

export type PlayerLevel = 'beginner' | 'intermediate' | 'expert';
export type CircleRequiredLevel = PlayerLevel | 'any';
export type CircleStatus = 'open' | 'full' | 'closed' | 'completed';
export type Gender = 'male' | 'female' | 'other';

/** מעגל פתוח לכל / בנות בלבד / בנים בלבד */
export type CircleGenderRestriction = 'any' | 'female' | 'male';
export type PlayStyle = 'social' | 'competitive' | 'sunset';
export type CourtType = 'beach' | 'asphalt' | 'grass';
export type UserRole = 'player' | 'manager';

export type UserLocation = {
  city: string;
  area: string;
  lat: number;
  lng: number;
};

export type NotificationSettings = {
  nearbyCircles: boolean;
  circleReminders: boolean;
  chatMessages: boolean;
  managerAnnouncements: boolean;
  weatherAlerts: boolean;
  urgentCircles: boolean;
  soundsEnabled: boolean;
  badgesEnabled: boolean;
  selectedAreas: string[];
  activeDays: string[];
  timeFrom: string;
  timeTo: string;
};

export type UserStats = {
  circlesJoined: number;
  circlesCreated: number;
  noShows: number;
  rating: number;
};

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string;
  videoURL: string;
  level: PlayerLevel;
  gender?: Gender;
  playStyle?: PlayStyle;
  role?: UserRole;
  city: string;
  location?: UserLocation;
  favoriteCourtTypes?: CourtType[];
  notificationSettings?: NotificationSettings;
  fcmToken: string;
  stats: UserStats;
  createdAt: Timestamp | null;
  profileCompleted: boolean;
};

export type CircleLocation = {
  name: string;
  lat: number;
  lng: number;
};

export type Circle = {
  id: string;
  creatorId: string;
  creatorName?: string;
  creatorPhotoURL?: string;
  title: string;
  location: CircleLocation;
  city?: string;
  area?: string;
  courtType?: CourtType;
  dateTime: Timestamp;
  maxPlayers: number;
  players: string[];
  requiredLevel: CircleRequiredLevel;
  status: CircleStatus;
  genderRestriction: CircleGenderRestriction;
  isUrgent?: boolean;
  chatEnabled: boolean;
  createdAt: Timestamp;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Timestamp | null;
};

export type CreateCirclePayload = {
  creatorId: string;
  creatorName?: string;
  creatorPhotoURL?: string;
  title: string;
  locationName: string;
  city: string;
  area: string;
  lat?: number;
  lng?: number;
  courtType: CourtType;
  date: string;
  time: string;
  maxPlayers: number;
  requiredLevel: CircleRequiredLevel;
  genderRestriction: CircleGenderRestriction;
  isUrgent?: boolean;
};
