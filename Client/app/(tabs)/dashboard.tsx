import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../services/api';

export default function HistoryList() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setError(null);
      const raw = await AsyncStorage.getItem('userId');
      if (!raw) {
        setError("Not logged in.");
        return;
      }
      
      const userId = raw.replace(/['"]+/g, '').trim();
      const url = `${BASE_URL}/history/${userId}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isOngoing = item.logoutTime === 'Ongoing';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/details',
            params: { shiftId: item._id },
          })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{item.date}</Text>
          <View style={styles.headerRight}>
            {isOngoing && (
              <View style={styles.ongoingBadge}>
                <Text style={styles.ongoingText}>LIVE</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoGroup}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              {item.loginTime} – {item.logoutTime}
            </Text>
          </View>

          <View style={styles.infoGroup}>
            <Ionicons name="document-text-outline" size={14} color="#EAB308" />
            <Text style={styles.infoText}>{item.dayNotes?.length || 0} Notes</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchHistory}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Logs</Text>
      <FlatList
        data={history}
        renderItem={renderItem}
        // ✅ FIX: Use _id not date — two shifts on same day would cause duplicate key warning
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No shift logs found yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 20, color: '#1E293B', letterSpacing: -0.5 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontWeight: '700', fontSize: 16, color: '#0F172A' },
  ongoingBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  ongoingText: { color: '#16A34A', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardBody: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  infoText: { marginLeft: 6, color: '#475569', fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', marginTop: 12, color: '#94A3B8', fontSize: 16 },
  errorText: { color: '#F87171', fontSize: 15, textAlign: 'center', marginTop: 12, marginBottom: 20 },
  retryBtn: {
    backgroundColor: '#007AFF', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20,
  },
});