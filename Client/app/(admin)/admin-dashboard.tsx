import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/api'; // Ensure this export exists in your api.ts

export default function AdminDashboard() {
    const router = useRouter();
    const [ongoingShifts, setOngoingShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 1. Load data on mount and set up auto-refresh
    useEffect(() => {
        fetchOngoingShifts();

        // Refresh the list every 20 seconds to see new workers clocking in
        const interval = setInterval(fetchOngoingShifts, 20000);
        return () => clearInterval(interval);
    }, []);

    const fetchOngoingShifts = async () => {
        try {
            // FIX: Call the specific method from authService
            const data = await authService.getOngoingShifts();

            // Note: Since authService returns response.data, 
            // 'data' here is already the array of shifts.
            setOngoingShifts(data);

        } catch (e: any) {
            console.error("Dashboard Fetch Error:", e);
            if (loading) Alert.alert("Sync Error", "Could not connect to server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/login');
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOngoingShifts();
    };

    const renderShiftItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.shiftCard}
            onPress={() => router.push({
                pathname: '/(admin)/live-track', // Matches the filename above
                params: { shiftId: item._id, workerName: item.userId?.name || 'Worker' }
            })}
        >
            <View style={styles.workerInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.userId?.name ? item.userId.name.charAt(0).toUpperCase() : 'W'}
                    </Text>
                </View>
                <View style={{ marginLeft: 15 }}>
                    <Text style={styles.workerName}>{item.userId?.name || 'Unknown User'}</Text>
                    <Text style={styles.startTime}>
                        Clocked in: {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>

            <View style={styles.statusSection}>
                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Admin Panel</Text>
                    <Text style={styles.subText}>Real-time Monitoring</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="power" size={22} color="#FF3B30" />
                </TouchableOpacity>
            </View>

            {/* Stats Quick View */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{ongoingShifts.length}</Text>
                    <Text style={styles.statLabel}>Active Now</Text>
                </View>
                {/* Placeholder for other stats like "Total Today" */}
                <View style={[styles.statBox, { backgroundColor: '#E1F5FE' }]}>
                    <Ionicons name="map" size={20} color="#007AFF" />
                    <Text style={[styles.statLabel, { color: '#007AFF' }]}>Full Map</Text>
                </View>
            </View>

            {/* List Section */}
            <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Ongoing Shifts</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={ongoingShifts}
                        keyExtractor={(item) => item._id}
                        renderItem={renderShiftItem}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
                        }
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                {/* FIXED: No leading space in icon name */}
                                <Ionicons name="footsteps-outline" size={60} color="#D1D1D6" />
                                <Text style={styles.emptyText}>No workers currently active.</Text>
                                <TouchableOpacity onPress={fetchOngoingShifts} style={styles.refreshBtn}>
                                    <Text style={styles.refreshBtnText}>Tap to Refresh</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: 60 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginBottom: 20
    },
    welcome: { fontSize: 32, fontWeight: 'bold', color: '#1C1C1E' },
    subText: { color: '#8E8E93', fontSize: 15, fontWeight: '500' },
    logoutBtn: { backgroundColor: '#FFF', padding: 12, borderRadius: 15, elevation: 2 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 25 },
    statBox: {
        flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center', elevation: 2
    },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
    statLabel: { fontSize: 13, color: '#8E8E93', marginTop: 4, fontWeight: '600' },

    listContainer: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, elevation: 10 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1C1C1E' },

    shiftCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#F8F9FA', padding: 16, borderRadius: 18, marginBottom: 12,
        borderWidth: 1, borderColor: '#E5E5EA'
    },
    workerInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 20 },
    workerName: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
    startTime: { fontSize: 13, color: '#8E8E93', marginTop: 3 },

    statusSection: { alignItems: 'flex-end', gap: 8 },
    liveBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 5 },
    liveText: { fontSize: 10, fontWeight: '900', color: '#4CAF50' },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#8E8E93', marginTop: 15, fontSize: 16, fontWeight: '500' },
    refreshBtn: { marginTop: 20, padding: 10 },
    refreshBtnText: { color: '#007AFF', fontWeight: 'bold' }
});