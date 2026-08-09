import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { subTaskRepository } from '@/db/repositories';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  subTaskId: number;
  progress: number;
};

export function SubTaskProgressSlider({ subTaskId, progress }: Props) {
  const theme = useTheme();
  const [dragValue, setDragValue] = useState<number | null>(null);

  return (
    <View className="flex-row items-center gap-3">
      <Slider
        testID="subtask-progress-slider"
        style={{ flex: 1 }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={progress}
        minimumTrackTintColor={theme.text}
        maximumTrackTintColor={theme.backgroundSelected}
        onValueChange={setDragValue}
        onSlidingComplete={(value) => {
          setDragValue(null);
          subTaskRepository.updateSubTaskProgress(subTaskId, value);
        }}
      />
      <ThemedText type="small" style={{ width: 40, textAlign: 'right' }}>
        {Math.round(dragValue ?? progress)}%
      </ThemedText>
    </View>
  );
}
