import { Image, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

type AvatarProps = {
  uri?: string;
  name: string;
  size?: number;
};

export function Avatar({ uri, name, size = 56 }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.initials}>{initials || 'ש'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#d9ccba',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.teal,
    borderWidth: 3,
    borderColor: '#FFFFFFBB',
  },
  initials: {
    color: theme.colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
});
