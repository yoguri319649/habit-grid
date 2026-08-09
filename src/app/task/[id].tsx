import { Stack, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTask } from '@/hooks/use-tasks';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useTask(Number(id));

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <Stack.Screen options={{ title: task?.title ?? '' }} />
      <ThemedText>{task?.title}</ThemedText>
    </ThemedView>
  );
}
