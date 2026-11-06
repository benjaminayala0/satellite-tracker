import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSatelliteStore } from '../src/stores/satelliteStore.ts';
import { colors } from '../src/theme/colors.ts';

export default function RootLayout() {
  const loadCatalog = useSatelliteStore((state) => state.loadCatalog);
  const tickRealtime = useSatelliteStore((state) => state.tickRealtime);

  useEffect(() => {
    // Initial catalog load
    loadCatalog();

    // 1-second real-time orbital propagator tick
    const interval = setInterval(() => {
      tickRealtime();
    }, 1000);

    return () => clearInterval(interval);
  }, [loadCatalog, tickRealtime]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

