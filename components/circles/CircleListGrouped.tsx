import { StyleSheet, Text, View } from 'react-native';

import { CircleCard } from '@/components/circles/CircleCard';
import { theme } from '@/constants/theme';
import { getRegionForCity, getRegionOrder } from '@/constants/regions';
import type { Circle } from '@/types/models';

export type CircleSection = {
  title: string;
  region: string;
  data: Circle[];
};

type CircleListGroupedProps = {
  circles: Circle[];
  onOpen: (circle: Circle) => void;
  onJoin?: (circle: Circle) => void;
  joiningCircleId?: string | null;
  currentUserId?: string;
  currentUserGender?: 'male' | 'female' | 'other';
};

function groupCirclesByRegion(circles: Circle[]): CircleSection[] {
  const byRegion = new Map<string, Circle[]>();

  circles.forEach((circle) => {
    const city = circle.city?.trim() || 'אחר';
    const region = getRegionForCity(city);
    const list = byRegion.get(region) ?? [];
    list.push(circle);
    byRegion.set(region, list);
  });

  return Array.from(byRegion.entries())
    .map(([region, data]) => ({
      title: region,
      region,
      data,
    }))
    .sort((a, b) => getRegionOrder(a.region) - getRegionOrder(b.region));
}

function canUserJoinCircle(
  circle: Circle,
  currentUserId: string | undefined,
  currentUserGender: 'male' | 'female' | 'other' | undefined,
): boolean {
  if (!currentUserId || circle.players.includes(currentUserId) || circle.status !== 'open') {
    return false;
  }
  if ((circle.genderRestriction ?? 'any') === 'any') {
    return true;
  }
  return (
    (circle.genderRestriction === 'female' && currentUserGender === 'female') ||
    (circle.genderRestriction === 'male' && currentUserGender === 'male')
  );
}

function toRows(data: Circle[], columns = 2): Circle[][] {
  const rows: Circle[][] = [];
  for (let i = 0; i < data.length; i += columns) {
    rows.push(data.slice(i, i + columns));
  }
  return rows;
}

export function CircleListGrouped({
  circles,
  onOpen,
  onJoin,
  joiningCircleId,
  currentUserId,
  currentUserGender,
}: CircleListGroupedProps) {
  const sections = groupCirclesByRegion(circles);

  if (circles.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>אין כרגע מעגלים פתוחים</Text>
        <Text style={styles.emptyBody}>אפשר ליצור מעגל חדש ולמשוך שחקנים אחרים.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {sections.map((section) => (
        <View key={section.region} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length} מעגלים</Text>
          </View>

          <View style={styles.grid}>
            {toRows(section.data).map((row, rowIndex) => (
              <View key={`${section.region}-row-${rowIndex}`} style={styles.gridRow}>
                {row.map((item) => (
                  <CircleCard
                    key={item.id}
                    circle={item}
                    compact
                    onPress={() => onOpen(item)}
                    onJoin={onJoin ? () => onJoin(item) : undefined}
                    joining={joiningCircleId === item.id}
                    canJoin={canUserJoinCircle(item, currentUserId, currentUserGender)}
                  />
                ))}
                {row.length === 1 ? <View style={styles.gridPlaceholder} /> : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.deep,
    writingDirection: 'rtl',
  },
  sectionCount: {
    fontSize: 13,
    color: theme.colors.muted,
    writingDirection: 'rtl',
  },
  grid: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  gridPlaceholder: {
    flex: 1,
  },
  empty: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    writingDirection: 'rtl',
    color: theme.colors.text,
  },
  emptyBody: {
    textAlign: 'center',
    color: theme.colors.muted,
    writingDirection: 'rtl',
  },
});
