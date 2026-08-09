import { Alert, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { timeLogRepository } from '@/db/repositories';
import { todayDateString } from '@/lib/date';

const CHIPS = [
  { label: '15分', minutes: 15 },
  { label: '30分', minutes: 30 },
  { label: '1時間', minutes: 60 },
];

type Props = {
  taskId: number;
};

export function TimeChipRow({ taskId }: Props) {
  const logMinutes = (minutes: number) => {
    timeLogRepository.setTimeLog(taskId, todayDateString(), minutes);
  };

  const handleMore = () => {
    Alert.prompt(
      '今日どのくらい進めた?',
      '取り組んだ時間を分数で入力してください',
      (value) => {
        const minutes = Math.round(Number(value));
        if (Number.isFinite(minutes) && minutes > 0) {
          logMinutes(minutes);
        }
      },
      'plain-text',
      '',
      'number-pad',
    );
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {CHIPS.map((chip) => (
        <Pressable
          key={chip.label}
          onPress={() => logMinutes(chip.minutes)}
          className="rounded-full bg-[#F0F0F3] px-4 py-2 active:opacity-70 dark:bg-[#212225]">
          <ThemedText type="smallBold">{chip.label}</ThemedText>
        </Pressable>
      ))}
      <Pressable
        testID="time-chip-more"
        onPress={handleMore}
        className="rounded-full bg-[#F0F0F3] px-4 py-2 active:opacity-70 dark:bg-[#212225]">
        <ThemedText type="smallBold">それ以上</ThemedText>
      </Pressable>
    </View>
  );
}
