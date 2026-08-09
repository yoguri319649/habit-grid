import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

import { db } from '@/db/client';
import migrations from '../../drizzle/migrations';

export function DbMigrationsProvider({ children }: PropsWithChildren) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text>Database migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return null;
  }

  return children;
}
