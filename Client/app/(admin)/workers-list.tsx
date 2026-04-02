import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/api';

export default function WorkersList() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const data = await authService.getAllWorkers();
      setWorkers(data);
    } catch (e) {
      console.error("Worker List Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkers();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Fetching Workforce...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push({
              pathname: '/(admin)/workers-shifts', // Make sure this matches your .tsx filename
              params: { userId: item._id, name: item.name }
            })}
          >
            <View style={styles.cardContent}>
              <View style={styles.avatarContainer}>
                {item.profileImage ? (
                  <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                {/* Visual indicator if shift is active (using your schema property) */}
                {item.isShiftActive && <View style={styles.activeBadge} />}
              </View>

              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <View style={styles.emailRow}>
                  <Ionicons name="mail-outline" size={12} color="#8E8E93" />
                  <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                </View>
              </View>

              <View style={styles.actionContainer}>
                <Text style={styles.viewText}>History</Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#D1D1D6" />
            <Text style={styles.emptyText}>No workers registered yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' },
  loadingText: { marginTop: 12, color: '#8E8E93', fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 30 },

  // Card Look
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Android Shadow
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },

  // Avatar
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E1E1E1' },
  initialsAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  activeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFF'
  },

  // Info
  info: { flex: 1, marginLeft: 16 },
  name: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  emailRow: { flexDirection: 'row', alignItems: 'center' },
  email: { color: '#8E8E93', fontSize: 13, marginLeft: 4 },

  // Action
  actionContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  viewText: { fontSize: 12, color: '#007AFF', fontWeight: '600', marginRight: 2 },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#8E8E93', fontWeight: '500' }
});