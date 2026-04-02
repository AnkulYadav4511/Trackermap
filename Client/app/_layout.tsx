import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, [segments]); // Runs every time the user moves to a new screen

  const checkAccess = async () => {
    const userRole = await AsyncStorage.getItem('userRole');
    const userId = await AsyncStorage.getItem('userId');

    // Define which folder group the user is currently in
    const inAdminGroup = segments[0] === '(admin)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'index';

    // 1. Protection: If NOT logged in, send to login
    if (!userId && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    // 2. Admin Protection: Admin should NOT be in (tabs)
    if (userRole === 'admin' && inTabsGroup) {
      console.log("Admin blocked from worker tabs");
      router.replace('/(admin)/admin-dashboard');
      return;
    }

    // 3. Worker Protection: Worker should NOT be in (admin)
    if (userRole === 'worker_manager' && inAdminGroup) {
      console.log("Worker blocked from admin panel");
      router.replace('/(tabs)/dashboard');
      return;
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}