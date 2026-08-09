import { Alert, View, useColorScheme } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { buildContributionGrid, type ContributionLevel } from '@/lib/contribution';

const WEEKS = 12;
const CELL_SIZE = 12;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;

/** Sequential blue ramp, level 0 (no activity) through 4 (2h+). Ordered light->dark on a light surface, dark->light on a dark one so intensity always reads as "more prominent". */
const LEVEL_COLORS: Record<'light' | 'dark', Record<ContributionLevel, string>> = {
  light: { 0: '#F0F0F3', 1: '#b7d3f6', 2: '#6da7ec', 3: '#2a78d6', 4: '#184f95' },
  dark: { 0: '#212225', 1: '#1c5cab', 2: '#2a78d6', 3: '#5598e7', 4: '#9ec5f4' },
};

type Props = {
  timeLogs: { date: string; minutes: number }[];
};

export function ContributionGraph({ timeLogs }: Props) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = LEVEL_COLORS[scheme];
  const grid = buildContributionGrid(timeLogs, WEEKS);

  const handleCellPress = (date: string, minutes: number) => {
    Alert.alert(date, minutes > 0 ? `${minutes}分取り組みました` : '記録なし');
  };

  return (
    <View className="gap-2">
      <Svg width={WEEKS * CELL_STEP} height={7 * CELL_STEP}>
        {grid.map((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <Rect
              key={day.date}
              x={weekIndex * CELL_STEP}
              y={dayIndex * CELL_STEP}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={colors[day.level]}
              onPress={() => handleCellPress(day.date, day.minutes)}
            />
          )),
        )}
      </Svg>
      <View className="flex-row items-center gap-1 self-end">
        <ThemedText type="small" themeColor="textSecondary">
          少ない
        </ThemedText>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <View
            key={level}
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors[level] }}
          />
        ))}
        <ThemedText type="small" themeColor="textSecondary">
          多い
        </ThemedText>
      </View>
    </View>
  );
}
