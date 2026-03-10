import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'המסך לא קיים' }} />
      <View style={styles.container}>
        <Text style={styles.title}>לא מצאנו את המסך שביקשת.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>חזרה למסך הבית</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f1e8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#1d6f5f',
  },
});
