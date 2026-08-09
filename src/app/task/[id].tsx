import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { ContributionGraph } from '@/components/contribution-graph';
import { ProgressBar } from '@/components/progress-bar';
import { SubTaskProgressSlider } from '@/components/subtask-progress-slider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimeChipRow } from '@/components/time-chip-row';
import { subTaskRepository, taskRepository } from '@/db/repositories';
import { useOverallProgress } from '@/hooks/use-overall-progress';
import { useSubTasks } from '@/hooks/use-subtasks';
import { useTask } from '@/hooks/use-tasks';
import { useTimeLogs } from '@/hooks/use-time-logs';

function SectionTitle({ children }: { children: string }) {
  return (
    <ThemedText type="default" style={{ fontWeight: '700', fontSize: 18, lineHeight: 24 }}>
      {children}
    </ThemedText>
  );
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = Number(id);

  const task = useTask(taskId);
  const subTasks = useSubTasks(taskId);
  const timeLogs = useTimeLogs(taskId);
  const progress = useOverallProgress(taskId);

  const handleAddSubTask = () => {
    Alert.prompt('サブタスクを追加', undefined, (name) => {
      const trimmed = name?.trim();
      if (trimmed) subTaskRepository.createSubTask(taskId, trimmed);
    });
  };

  const handleToggleCompleted = () => {
    if (!task) return;
    taskRepository.setTaskCompleted(taskId, !task.completed);
  };

  if (!task) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: task.title }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 28 }}>
        <View className="gap-3">
          <Pressable
            onPress={handleToggleCompleted}
            className="flex-row items-center gap-3 active:opacity-70">
            <View
              className="h-7 w-7 items-center justify-center rounded-full border-2"
              style={{
                borderColor: task.completed ? '#3c87f7' : '#B0B4BA',
                backgroundColor: task.completed ? '#3c87f7' : 'transparent',
              }}>
              {task.completed && <ThemedText style={{ color: '#fff', fontSize: 14 }}>✓</ThemedText>}
            </View>
            <ThemedText
              style={[
                { flex: 1, fontSize: 22, lineHeight: 28, fontWeight: '600' },
                task.completed && { textDecorationLine: 'line-through' },
              ]}
              numberOfLines={2}>
              {task.title}
            </ThemedText>
          </Pressable>
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <ProgressBar progress={progress} />
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={{ width: 36, textAlign: 'right' }}>
              {progress}%
            </ThemedText>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <SectionTitle>サブタスク</SectionTitle>
            <Pressable onPress={handleAddSubTask} hitSlop={8}>
              <ThemedText type="linkPrimary">＋ 追加</ThemedText>
            </Pressable>
          </View>
          {subTasks.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              サブタスクがありません
            </ThemedText>
          ) : (
            <View className="gap-3">
              {subTasks.map((subTask) => (
                <ThemedView key={subTask.id} type="backgroundElement" className="gap-2 rounded-2xl p-3">
                  <View className="flex-row items-center justify-between gap-2">
                    <ThemedText numberOfLines={1} style={{ flex: 1 }}>
                      {subTask.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {subTask.weight}%
                    </ThemedText>
                  </View>
                  <SubTaskProgressSlider subTaskId={subTask.id} progress={subTask.progress} />
                </ThemedView>
              ))}
            </View>
          )}
        </View>

        <View className="gap-3">
          <SectionTitle>今日どのくらい進めた?</SectionTitle>
          <TimeChipRow taskId={taskId} />
        </View>

        <View className="gap-3">
          <SectionTitle>取り組みの記録</SectionTitle>
          <ContributionGraph timeLogs={timeLogs} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}
