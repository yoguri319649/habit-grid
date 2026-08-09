import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { SubTask } from '@/db/schema';
import { subTaskRepository, taskRepository } from '@/db/repositories';
import { useSubTasks } from '@/hooks/use-subtasks';
import { useTask } from '@/hooks/use-tasks';
import { useTheme } from '@/hooks/use-theme';

function SubTaskEditorRow({
  subTask,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  subTask: SubTask;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const theme = useTheme();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [weightDraft, setWeightDraft] = useState<string | null>(null);

  const commitName = () => {
    if (nameDraft !== null) {
      const trimmed = nameDraft.trim();
      if (trimmed) subTaskRepository.updateSubTaskName(subTask.id, trimmed);
    }
    setNameDraft(null);
  };

  const commitWeight = () => {
    if (weightDraft !== null) {
      const value = Math.round(Number(weightDraft));
      if (Number.isFinite(value)) subTaskRepository.updateSubTaskWeight(subTask.id, value);
    }
    setWeightDraft(null);
  };

  const handleDelete = () => {
    Alert.alert('サブタスクを削除', `「${subTask.name}」を削除しますか?`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => subTaskRepository.deleteSubTask(subTask.id, subTask.taskId),
      },
    ]);
  };

  return (
    <ThemedView type="backgroundElement" className="gap-3 rounded-2xl p-3">
      <View className="flex-row items-center gap-2">
        <TextInput
          value={nameDraft ?? subTask.name}
          onFocus={() => setNameDraft(subTask.name)}
          onChangeText={setNameDraft}
          onEndEditing={commitName}
          placeholderTextColor={theme.textSecondary}
          style={{ color: theme.text, flex: 1 }}
          className="rounded-lg bg-[#E0E1E6] px-3 py-2 dark:bg-[#2E3135]"
        />
        <TextInput
          value={weightDraft ?? String(subTask.weight)}
          onFocus={() => setWeightDraft(String(subTask.weight))}
          onChangeText={setWeightDraft}
          onEndEditing={commitWeight}
          keyboardType="number-pad"
          placeholderTextColor={theme.textSecondary}
          style={{ color: theme.text, width: 56, textAlign: 'right' }}
          className="rounded-lg bg-[#E0E1E6] px-2 py-2 dark:bg-[#2E3135]"
        />
        <ThemedText type="small" themeColor="textSecondary">
          %
        </ThemedText>
      </View>
      <View className="flex-row items-center justify-end gap-5">
        <Pressable onPress={onMoveUp} disabled={isFirst} hitSlop={8}>
          <ThemedText type="small" themeColor={isFirst ? 'textSecondary' : 'text'}>
            ↑ 上へ
          </ThemedText>
        </Pressable>
        <Pressable onPress={onMoveDown} disabled={isLast} hitSlop={8}>
          <ThemedText type="small" themeColor={isLast ? 'textSecondary' : 'text'}>
            ↓ 下へ
          </ThemedText>
        </Pressable>
        <Pressable onPress={handleDelete} hitSlop={8}>
          <ThemedText type="small" style={{ color: '#e34948' }}>
            削除
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = Number(id);
  const router = useRouter();
  const theme = useTheme();

  const task = useTask(taskId);
  const subTasks = useSubTasks(taskId);
  const weightTotal = subTaskRepository.sumWeights(subTasks);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);

  const commitTitle = () => {
    if (titleDraft !== null) {
      const trimmed = titleDraft.trim();
      if (trimmed) taskRepository.renameTask(taskId, trimmed);
    }
    setTitleDraft(null);
  };

  const handleAddSubTask = () => {
    Alert.prompt('サブタスクを追加', undefined, (name) => {
      const trimmed = name?.trim();
      if (trimmed) subTaskRepository.createSubTask(taskId, trimmed);
    });
  };

  const moveSubTask = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= subTasks.length) return;
    const reordered = [...subTasks];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    subTaskRepository.reorderSubTasks(
      taskId,
      reordered.map((subTask) => subTask.id),
    );
  };

  const handleComplete = () => {
    if (subTasks.length > 0 && weightTotal !== 100) {
      Alert.alert(
        '重みの合計が100%ではありません',
        `サブタスクの重みの合計を100%に調整してから完了してください(現在: ${weightTotal}%)`,
      );
      return;
    }
    router.back();
  };

  const handleDeleteTask = () => {
    if (!task) return;
    Alert.alert('タスクを削除', `「${task.title}」を削除しますか?この操作は取り消せません。`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await taskRepository.deleteTask(taskId);
          router.dismissTo('/');
        },
      },
    ]);
  };

  if (!task) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'タスクを編集',
          headerRight: () => (
            <Pressable onPress={handleComplete} hitSlop={8}>
              <ThemedText type="linkPrimary">完了</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 28 }}>
        <View className="gap-2">
          <ThemedText type="small" themeColor="textSecondary">
            タスク名
          </ThemedText>
          <TextInput
            value={titleDraft ?? task.title}
            onFocus={() => setTitleDraft(task.title)}
            onChangeText={setTitleDraft}
            onEndEditing={commitTitle}
            placeholderTextColor={theme.textSecondary}
            style={{ color: theme.text }}
            className="rounded-xl bg-[#F0F0F3] p-4 text-base dark:bg-[#212225]"
          />
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <ThemedText style={{ fontWeight: '700', fontSize: 18, lineHeight: 24 }}>
              サブタスク
            </ThemedText>
            <Pressable onPress={handleAddSubTask} hitSlop={8}>
              <ThemedText type="linkPrimary">＋ 追加</ThemedText>
            </Pressable>
          </View>
          {subTasks.length > 0 && (
            <ThemedText
              type="small"
              style={{ color: weightTotal === 100 ? theme.textSecondary : '#e34948' }}>
              重みの合計: {weightTotal}%{weightTotal !== 100 && ' (100%になるように調整してください)'}
            </ThemedText>
          )}
          {subTasks.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              サブタスクがありません。重みは追加時に自動で均等割りされます。
            </ThemedText>
          ) : (
            <View className="gap-3">
              {subTasks.map((subTask, index) => (
                <SubTaskEditorRow
                  key={subTask.id}
                  subTask={subTask}
                  isFirst={index === 0}
                  isLast={index === subTasks.length - 1}
                  onMoveUp={() => moveSubTask(index, -1)}
                  onMoveDown={() => moveSubTask(index, 1)}
                />
              ))}
            </View>
          )}
        </View>

        <Pressable onPress={handleDeleteTask} className="items-center rounded-xl p-3">
          <ThemedText style={{ color: '#e34948' }}>タスクを削除</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}
