import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSettings() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to end the admin session?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/login');
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Account</Text>
      <View style={styles.group}>
        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <View style={[styles.iconBox, { backgroundColor: '#FF3B30' }]}>
            <Ionicons name="log-out" size={20} color="white" />
          </View>
          <Text style={styles.itemText}>Logout Admin</Text>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.footerText}>Tracker Admin v1.0.2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 20 },
  sectionHeader: { fontSize: 13, color: '#8E8E93', textTransform: 'uppercase', marginBottom: 8, marginLeft: 5 },
  group: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1C1C1E' },
  footerText: { textAlign: 'center', color: '#8E8E93', fontSize: 12, marginTop: 10 }
});