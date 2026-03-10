import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

type AnimatedSplashProps = {
  onFinish: () => void;
};

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const rise = useRef(new Animated.Value(60)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.7)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const titleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.timing(rise, {
        toValue: 0,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 700,
        delay: 180,
        useNativeDriver: true,
      }),
    ]);

    const ballMotion = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bounce, {
            toValue: -88,
            duration: 700,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(spin, {
            toValue: 1,
            duration: 700,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 0.56,
            duration: 700,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bounce, {
            toValue: 0,
            duration: 760,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.timing(spin, {
            toValue: 2,
            duration: 760,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 1,
            duration: 760,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.72,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    intro.start();
    ballMotion.start();
    pulse.start();

    const timer = setTimeout(onFinish, 2300);

    return () => {
      clearTimeout(timer);
      ballMotion.stop();
      pulse.stop();
    };
  }, [bounce, glow, onFinish, rise, shadowScale, spin, titleFade]);

  const rotation = spin.interpolate({
    inputRange: [0, 2],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <View style={[styles.blob, styles.sunBlob]} />
      <View style={[styles.blob, styles.skyBlob]} />
      <Animated.View style={[styles.header, { opacity: titleFade, transform: [{ translateY: rise }] }]}>
        <Text style={styles.kicker}>MIKASA ENERGY</Text>
        <Text style={styles.title}>מקפיצים ביחד</Text>
        <Text style={styles.subtitle}>כדור באוויר, חברים על החוף, ופתיחה עם נוכחות.</Text>
      </Animated.View>
      <View style={styles.stage}>
        <Animated.View style={[styles.glow, { opacity: glow }]} />
        <Animated.View style={[styles.shadow, { transform: [{ scaleX: shadowScale }, { scaleY: shadowScale }] }]} />
        <Animated.View style={[styles.ball, { transform: [{ translateY: bounce }, { rotate: rotation }] }]}>
          <View style={[styles.slice, styles.sliceRed]} />
          <View style={[styles.slice, styles.slicePurple]} />
          <View style={[styles.slice, styles.sliceLavender]} />
          <View style={[styles.slice, styles.sliceRedSmall]} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.footer, { opacity: titleFade }]}>החוף מתעורר מחדש</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 110,
    paddingBottom: 80,
    backgroundColor: theme.colors.sand,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  kicker: {
    color: theme.colors.coral,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.deep,
    writingDirection: 'rtl',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 16,
    writingDirection: 'rtl',
  },
  stage: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  ball: {
    width: 118,
    height: 118,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: '#FFFFFFCC',
  },
  slice: {
    position: 'absolute',
    width: 140,
    height: 44,
    borderRadius: 44,
  },
  sliceRed: {
    top: 16,
    right: -12,
    backgroundColor: theme.colors.coral,
    transform: [{ rotate: '27deg' }],
  },
  slicePurple: {
    top: 42,
    left: -20,
    backgroundColor: theme.colors.teal,
    transform: [{ rotate: '-35deg' }],
  },
  sliceLavender: {
    bottom: 18,
    right: -8,
    backgroundColor: theme.colors.sky,
    transform: [{ rotate: '-18deg' }],
  },
  sliceRedSmall: {
    bottom: 30,
    left: -8,
    width: 84,
    height: 18,
    backgroundColor: theme.colors.sun,
    transform: [{ rotate: '32deg' }],
  },
  glow: {
    position: 'absolute',
    bottom: 42,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: '#FFD1E0',
  },
  shadow: {
    position: 'absolute',
    bottom: 12,
    width: 120,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#6E543B22',
  },
  footer: {
    color: theme.colors.deep,
    fontSize: 18,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  sunBlob: {
    width: 220,
    height: 220,
    top: -70,
    right: -60,
    backgroundColor: theme.colors.sun,
  },
  skyBlob: {
    width: 260,
    height: 260,
    bottom: -110,
    left: -100,
    backgroundColor: theme.colors.sky,
  },
});
