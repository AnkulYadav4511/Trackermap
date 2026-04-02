import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  Platform, Image, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import axios from 'axios';
import { BASE_URL } from '@/services/api';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const rawUserId = await AsyncStorage.getItem('userId');
      if (!rawUserId) {
        setLoading(false);
        return;
      }

      const userId = rawUserId.replace(/['"]+/g, '').trim();
      
      const response = await axios.get(`${BASE_URL}/auth/profile/${userId}`, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      setUser(response.data);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          const LOCATION_TASK_NAME = 'background-location-task';
          try {
            if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) {
              await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }
          } catch (e) {}
          
          await AsyncStorage.clear();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  // Helper to render the rows you were missing
  const SettingItem = ({ icon, title, color, onPress }: any) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionText}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            {user?.profileImage?.data ? (
              <Image
                source={{ uri: `data:${user.profileImage.contentType || 'image/jpeg'};base64,${user.profileImage.data}` }}
                style={styles.profileImg}
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </Text>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
          <Text style={styles.userRole}>Field Worker • ID: {user?._id?.slice(-6) || 'N/A'}</Text>
        </View>

        {/* Action List - All Options Restored */}
        <View style={styles.actionContainer}>
          <Text style={styles.sectionLabel}>Account Settings</Text>
          
          <SettingItem 
            icon="person-outline" 
            title="Personal Information" 
            color="#007AFF" 
            onPress={() => console.log('Edit Profile')} 
          />
          <SettingItem 
            icon="shield-checkmark-outline" 
            title="Privacy & Security" 
            color="#34C759" 
            onPress={() => console.log('Security')} 
          />
          <SettingItem 
            icon="notifications-outline" 
            title="Notifications" 
            color="#FF9500" 
            onPress={() => console.log('Notifications')} 
          />

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Support</Text>
          
          <SettingItem 
            icon="help-circle-outline" 
            title="Help Center" 
            color="#5856D6" 
            onPress={() => console.log('Help')} 
          />
          <SettingItem 
            icon="document-text-outline" 
            title="Terms of Service" 
            color="#8E8E93" 
            onPress={() => console.log('Terms')} 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    alignItems: 'center', 
    paddingVertical: 40, 
    backgroundColor: '#FFFFFF', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    marginBottom: 10, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  avatar: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15, 
    overflow: 'hidden' 
  },
  profileImg: { width: '100%', height: '100%' },
  avatarText: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  userRole: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  actionContainer: { paddingHorizontal: 20 },
  sectionLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#8E8E93', 
    marginBottom: 10, 
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 10 
  },
  iconCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  actionText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1C1C1E' },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginVertical: 30, 
    marginHorizontal: 20, 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: '#FF3B30' 
  },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '700', marginLeft: 8 },
});