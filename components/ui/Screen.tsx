import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewProps } from 'react-native';

import { theme } from '@/constants/theme';

export function ScreenScroll({ children, contentContainerStyle, style, ...props }: ScrollViewProps) {
  return (
    <View style={styles.root}>
      <BackgroundDecor />
      <ScrollView
        style={[styles.fill, style]}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function ScreenView({ children, style, ...props }: ViewProps) {
  return (
    <View style={styles.root}>
      <BackgroundDecor />
      <View style={[styles.content, styles.fill, style]} {...props}>
        {children}
      </View>
    </View>
  );
}

function BackgroundDecor() {
  return (
    <>
      <View style={[styles.blob, styles.blobOne]} />
      <View style={[styles.blob, styles.blobTwo]} />
      <View style={[styles.blob, styles.blobThree]} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.sand,
  },
  fill: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  blobOne: {
    width: 220,
    height: 220,
    top: -50,
    right: -70,
    backgroundColor: theme.colors.sun,
  },
  blobTwo: {
    width: 240,
    height: 240,
    bottom: -90,
    left: -110,
    backgroundColor: theme.colors.sky,
  },
  blobThree: {
    width: 170,
    height: 170,
    top: '38%',
    left: -60,
    backgroundColor: theme.colors.foam,
  },
});
