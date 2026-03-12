import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { getFirestoreDb, isFirebaseConfigured } from '@/services/firebase';

export type HomeBulletin = {
  id: string;
  title: string;
  body: string;
  tag: string;
  ctaLabel: string;
  route: '/manager-alerts' | '/(tabs)/availability' | '/(tabs)/create-circle' | '/(tabs)/settings';
  active: boolean;
};

const DEFAULT_HOME_BULLETINS: HomeBulletin[] = [
  {
    id: 'spring-league',
    tag: 'נושא מרכזי',
    title: 'ליגת האביב נפתחת השבוע',
    body: 'מנהלים יכולים לעדכן קיבולת, שחקנים יכולים לסמן זמינות, וכל המעגלים הרלוונטיים יקבלו קדימות בתזכורות.',
    ctaLabel: 'עדכון זמינות',
    route: '/(tabs)/availability',
    active: true,
  },
  {
    id: 'urgent-openings',
    tag: 'מודעה',
    title: 'יש ביקוש למעגלים דחופים בחוף גורדון',
    body: 'פתיחת מעגל דחוף באזור תל אביב מגדילה חשיפה לשחקנים קרובים ולחברים שסימנו שעות ערב.',
    ctaLabel: 'פתיחת מעגל',
    route: '/(tabs)/create-circle',
    active: true,
  },
  {
    id: 'ops-update',
    tag: 'מערכת',
    title: 'עדכוני שטח והתראות',
    body: 'כאן מרכזים הודעות על תנאי חוף, ביטולים ושינויים תפעוליים כדי שהמשתמש לא יצטרך לנחש מה קורה.',
    ctaLabel: 'ניהול התראות',
    route: '/manager-alerts',
    active: true,
  },
];

let demoBulletins = [...DEFAULT_HOME_BULLETINS];
const demoListeners = new Set<(bulletins: HomeBulletin[]) => void>();

function emitDemoBulletins() {
  const next = [...demoBulletins];
  demoListeners.forEach((listener) => listener(next));
}

function mapBulletin(id: string, data: Record<string, unknown>): HomeBulletin {
  const fallback = DEFAULT_HOME_BULLETINS.find((item) => item.id === id);

  return {
    id,
    title: String(data.title ?? fallback?.title ?? ''),
    body: String(data.body ?? fallback?.body ?? ''),
    tag: String(data.tag ?? fallback?.tag ?? 'עדכון'),
    ctaLabel: String(data.ctaLabel ?? fallback?.ctaLabel ?? 'לצפייה'),
    route:
      (data.route as HomeBulletin['route'] | undefined) ??
      fallback?.route ??
      '/manager-alerts',
    active: Boolean(data.active ?? fallback?.active ?? true),
  };
}

export function subscribeToHomeBulletins(
  onData: (bulletins: HomeBulletin[]) => void,
  onError?: (error: Error) => void,
) {
  if (!isFirebaseConfigured) {
    demoListeners.add(onData);
    onData([...demoBulletins]);

    return () => {
      demoListeners.delete(onData);
    };
  }

  return onSnapshot(
    query(collection(getFirestoreDb(), 'bulletins')),
    (snapshot) => {
      if (snapshot.empty) {
        onData(DEFAULT_HOME_BULLETINS);
        return;
      }

      onData(snapshot.docs.map((item) => mapBulletin(item.id, item.data())));
    },
    (error) => onError?.(error),
  );
}

export async function updateHomeBulletin(id: string, patch: Partial<HomeBulletin>) {
  if (!isFirebaseConfigured) {
    demoBulletins = demoBulletins.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item));
    emitDemoBulletins();
    return demoBulletins.find((item) => item.id === id) ?? null;
  }

  const bulletinRef = doc(getFirestoreDb(), 'bulletins', id);
  const payload = { ...patch };
  delete (payload as Partial<HomeBulletin>).id;

  try {
    await updateDoc(bulletinRef, payload);
  } catch {
    const fallback = DEFAULT_HOME_BULLETINS.find((item) => item.id === id);
    await setDoc(
      bulletinRef,
      {
        ...(fallback ?? {}),
        ...payload,
        id,
      },
      { merge: true },
    );
  }
}
