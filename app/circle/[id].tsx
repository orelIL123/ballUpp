import { useLocalSearchParams, router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { CircleStatusBadge } from '@/components/circles/CircleStatusBadge';
import { RatePlayersSection } from '@/components/circles/RatePlayersSection';
import { LevelBadge } from '@/components/player/LevelBadge';
import { PlayerCard } from '@/components/player/PlayerCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenScroll, ScreenView } from '@/components/ui/Screen';
import { theme } from '@/constants/theme';
import {
  joinCircle,
  leaveCircle,
  sendChatMessage,
  subscribeToCircle,
  subscribeToCircleChat,
} from '@/services/circles.service';
import { getPlayersByIds } from '@/services/players.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatMessage, Circle, UserProfile } from '@/types/models';
import { goBackOrReplace } from '@/utils/navigation';
import { formatTimestamp } from '@/utils/date';

type MessageForm = {
  text: string;
};

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((state) => state.profile);
  const currentUserId = profile?.uid ?? null;
  const [circle, setCircle] = useState<Circle | null>(null);
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingAction, setLoadingAction] = useState<'join' | 'leave' | null>(null);

  const { control, handleSubmit, reset } = useForm<MessageForm>({
    defaultValues: {
      text: '',
    },
  });

  useEffect(() => {
    if (!id) {
      return;
    }

    const unsubscribeCircle = subscribeToCircle(
      id,
      (nextCircle) => {
        setCircle(nextCircle);
      },
      (error) => {
        Alert.alert('טעינת מעגל נכשלה', error.message);
      },
    );

    const unsubscribeChat = subscribeToCircleChat(
      id,
      (nextMessages) => setMessages(nextMessages),
      (error) => Alert.alert('טעינת צ׳אט נכשלה', error.message),
    );

    return () => {
      unsubscribeCircle();
      unsubscribeChat();
    };
  }, [id]);

  useEffect(() => {
    if (!circle) {
      setPlayers([]);
      return;
    }

    getPlayersByIds(circle.players)
      .then((result) => setPlayers(result))
      .catch((error: Error) => Alert.alert('טעינת שחקנים נכשלה', error.message));
  }, [circle]);

  const handleJoin = async () => {
    if (!currentUserId || !circle) {
      return;
    }

    setLoadingAction('join');
    try {
      await joinCircle(circle.id, currentUserId);
    } catch (error) {
      Alert.alert('לא הצלחנו לצרף אותך', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLeave = async () => {
    if (!currentUserId || !circle) {
      return;
    }

    setLoadingAction('leave');
    try {
      await leaveCircle(circle.id, currentUserId);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('לא הצלחנו לעזוב', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendMessage = handleSubmit(async ({ text }) => {
    if (!circle || !currentUserId || !profile) {
      return;
    }

    try {
      await sendChatMessage(circle.id, currentUserId, profile.displayName, text);
      reset();
    } catch (error) {
      Alert.alert('שליחת הודעה נכשלה', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    }
  });

  if (!circle) {
    return (
      <ScreenView style={styles.empty}>
        <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={styles.backButton}>
          <ChevronRight size={22} color={theme.colors.deep} strokeWidth={2.5} />
          <Text style={styles.backLabel}>חזור</Text>
        </Pressable>
        <Text style={styles.emptyText}>טוען פרטי מעגל...</Text>
      </ScreenView>
    );
  }

  const alreadyJoined = circle.players.includes(currentUserId ?? '');
  const isCreator = circle.creatorId === currentUserId;
  const canJoinByGender =
    (circle.genderRestriction ?? 'any') === 'any' ||
    (circle.genderRestriction === 'female' && profile?.gender === 'female') ||
    (circle.genderRestriction === 'male' && profile?.gender === 'male');

  return (
    <ScreenScroll contentContainerStyle={styles.container}>
      <Pressable
        onPress={() => goBackOrReplace('/(tabs)')}
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
      >
        <ChevronRight size={22} color={theme.colors.deep} strokeWidth={2.5} />
        <Text style={styles.backLabel}>חזור</Text>
      </Pressable>

      <View style={styles.card}>
        <View style={styles.topRow}>
          <CircleStatusBadge status={circle.status} />
          <LevelBadge level={circle.requiredLevel} />
        </View>
        <Text style={styles.title}>{circle.title}</Text>
        <Text style={styles.meta}>{circle.location.name}</Text>
        <Text style={styles.meta}>
          {formatTimestamp(circle.dateTime)}
          {(circle.genderRestriction ?? 'any') !== 'any' && ` · ${circle.genderRestriction === 'female' ? 'בנות בלבד' : 'בנים בלבד'}`}
        </Text>
        <Text style={styles.meta}>
          {circle.players.length}/{circle.maxPlayers} שחקנים
        </Text>
        {!alreadyJoined && circle.status === 'open' ? (
          <Button
            title={canJoinByGender ? 'הצטרף למעגל' : circle.genderRestriction === 'female' ? 'מעגל לבנות בלבד' : 'מעגל לבנים בלבד'}
            loading={loadingAction === 'join'}
            onPress={handleJoin}
            disabled={!canJoinByGender}
          />
        ) : null}
        {alreadyJoined ? (
          <Button
            title={isCreator ? 'סגירת השתתפות' : 'עזיבת מעגל'}
            variant="secondary"
            loading={loadingAction === 'leave'}
            onPress={handleLeave}
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>שחקנים במעגל</Text>
        <View style={styles.sectionBody}>
          {players.map((player) => (
            <PlayerCard key={player.uid} player={player} onPress={() => router.push(`/player/${player.uid}`)} />
          ))}
        </View>
      </View>

      {(circle.status === 'closed' || circle.status === 'completed') && alreadyJoined && currentUserId ? (
        <RatePlayersSection circleId={circle.id} players={players} currentUserId={currentUserId} />
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>צ׳אט בזמן אמת</Text>
        <View style={styles.sectionBody}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.message,
                message.senderId === currentUserId ? styles.ownMessage : styles.otherMessage,
              ]}
            >
              <Text style={styles.messageSender}>{message.senderName}</Text>
              <Text style={styles.messageText}>{message.text}</Text>
              <Text style={styles.messageTime}>{formatTimestamp(message.createdAt)}</Text>
            </View>
          ))}
          <Controller
            control={control}
            name="text"
            render={({ field: { onChange, value } }) => (
              <Input label="הודעה חדשה" value={value} onChangeText={onChange} />
            )}
          />
          <Button title="שליחה" onPress={handleSendMessage} />
        </View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingBottom: 36,
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.deep,
    writingDirection: 'rtl',
  },
  card: {
    gap: 12,
    padding: 22,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.shell,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
  meta: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
  sectionBody: {
    gap: 10,
    padding: 18,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.shell,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  message: {
    padding: 14,
    borderRadius: 20,
    gap: 6,
  },
  ownMessage: {
    backgroundColor: theme.colors.foam,
  },
  otherMessage: {
    backgroundColor: theme.colors.cream,
  },
  messageSender: {
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
  messageText: {
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.text,
  },
  messageTime: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    writingDirection: 'rtl',
    color: theme.colors.deep,
    fontSize: 16,
  },
});
