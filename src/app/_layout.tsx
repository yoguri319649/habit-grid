import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DbMigrationsProvider } from '@/db/migrations-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DbMigrationsProvider>
        <AnimatedSplashOverlay />
        <Stack>
          <Stack.Screen name="index" />
          <Stack.Screen name="task/[id]" />
          <Stack.Screen name="task/new" options={{ presentation: 'modal' }} />
        </Stack>
      </DbMigrationsProvider>
    </ThemeProvider>
  );
}
