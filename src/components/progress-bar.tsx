import { View } from 'react-native';

type Props = {
  progress: number;
};

export function ProgressBar({ progress }: Props) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-[#E0E1E6] dark:bg-[#2E3135]">
      <View
        testID="progress-bar-fill"
        className="h-full rounded-full bg-[#3c87f7]"
        style={{ width: `${clamped}%` }}
      />
    </View>
  );
}
