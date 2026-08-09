import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';

import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Task } from '@/db/schema';
import { useOverallProgress } from '@/hooks/use-overall-progress';
import { useTasks } from '@/hooks/use-tasks';

function TaskListItem({ task }: { task: Task }) {
  const router = useRouter();
  const progress = useOverallProgress(task.id);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/task/[id]', params: { id: String(task.id) } })}
      className="active:opacity-70">
      <ThemedView type="backgroundElement" className="gap-3 rounded-2xl p-4">
        <ThemedText
          numberOfLines={1}
          style={task.completed ? { textDecorationLine: 'line-through' } : undefined}>
          {task.title}
        </ThemedText>
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <ProgressBar progress={progress} />
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={{ width: 36, textAlign: 'right' }}>
            {progress}%
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

export default function TaskListScreen() {
  const router = useRouter();
  const tasks = useTasks();

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'タスク',
          headerLargeTitle: true,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/task/new')}
              hitSlop={8}
              accessibilityLabel="タスクを追加">
              <ThemedText type="linkPrimary" style={{ fontSize: 22, lineHeight: 22 }}>
                ＋
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      {tasks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>
            まだタスクがありません。右上の＋から作成しましょう。
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(task) => String(task.id)}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => <TaskListItem task={item} />}
        />
      )}
    </ThemedView>
  );
}
