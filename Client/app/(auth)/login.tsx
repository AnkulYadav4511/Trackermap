import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

import { authService } from '../../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');

  const router = useRouter();

  useEffect(() => {
    checkDeviceSupport();
  }, []);

  const checkDeviceSupport = async () => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID');
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('Touch ID');
    }
  };

  const handleLoginPress = async () => {
    if (!email || !password) return Alert.alert("Required", "Please enter credentials.");

    try {
      setLoading(true);

      // 1. Biometric verification (Keep your existing logic)
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return Alert.alert("Security Error", "Biometrics not set up on this device.");
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Verify your identity to login`,
      });

      if (result.success) {
        // 2. Call Login API
        const res = await authService.login({ email, password });

        if (res.userId) {
          // 3. Store User ID, Name, and Role
          await AsyncStorage.setItem('userId', res.userId);
          await AsyncStorage.setItem('userName', res.name);
          await AsyncStorage.setItem('userRole', res.role);

          // 4. Role-Based Navigation
          if (res.role === 'admin') {
            router.replace('/(admin)/admin-dashboard');
          } else {
            router.replace('/(tabs)/dashboard');
          }
        }
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Tracker<Text style={{ color: '#007AFF' }}>.</Text></Text>
        <Text style={styles.subLogo}>SECURE DEVICE AUTH</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#8e8e93" style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#8e8e93" style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLoginPress} disabled={loading}>
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="finger-print" size={22} color="white" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Login with {biometricType}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <Link href="/signup" asChild>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>New Employee? Register Account</Text>
        </TouchableOpacity>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  header: { marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#1c1c1e' },
  subLogo: { fontSize: 10, color: '#007AFF', fontWeight: '900', letterSpacing: 2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f7', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: '#000' },
  button: { backgroundColor: '#007aff', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  link: { marginTop: 25, alignItems: 'center' },
  linkText: { color: '#8e8e93' }
});