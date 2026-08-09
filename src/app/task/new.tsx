import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { taskRepository } from '@/db/repositories';
import { useTheme } from '@/hooks/use-theme';

export default function NewTaskScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    const task = await taskRepository.createTask(trimmed);
    router.replace({ pathname: '/task/[id]/edit', params: { id: String(task.id) } });
  };

  return (
    <ThemedView style={{ flex: 1, padding: 16, gap: 16 }}>
      <Stack.Screen
        options={{
          title: '新規タスク',
          headerRight: () => (
            <Pressable onPress={handleCreate} hitSlop={8} disabled={saving}>
              <ThemedText type="linkPrimary">作成</ThemedText>
            </Pressable>
          ),
        }}
      />
      <TextInput
        autoFocus
        value={title}
        onChangeText={setTitle}
        onSubmitEditing={handleCreate}
        placeholder="タスク名"
        placeholderTextColor={theme.textSecondary}
        style={{ color: theme.text }}
        className="rounded-xl bg-[#F0F0F3] p-4 text-base dark:bg-[#212225]"
      />
      <ThemedText type="small" themeColor="textSecondary">
        作成すると続けてサブタスクを追加できます
      </ThemedText>
    </ThemedView>
  );
}
