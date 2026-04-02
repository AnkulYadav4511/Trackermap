import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { BASE_URL } from '../../services/api';

// 1. Updated Interface for structured Note data including counts
interface Note {
  latitude: number;
  longitude: number;
  className: string;
  directorName?: string;
  directorNumber?: string;
  address?: string;
  contactPersonName?: string;
  contactPersonNumber?: string;
  studentCount?: number; // Added
  classCount?: number;   // Added
  createdAt?: string;
  timestamp?: string;
}

////////////////////////////////////////////////////////////
// UTILS: Haversine Formula for Real-World Distance
////////////////////////////////////////////////////////////
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function DayDetails() {
  const { shiftId } = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [isTaskListVisible, setTaskListVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [shiftData, setShiftData] = useState<{ date: string; path: any[]; notes: Note[] }>({
    date: '',
    path: [],
    notes: []
  });

  // Fetch shift path and visit notes from backend
  useEffect(() => {
    if (shiftId) {
      const url = `${BASE_URL}/shift-details/${shiftId}`;
      fetch(url)
        .then(async (res) => {
          if (!res.ok) throw new Error(`Status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setShiftData({
            date: data.date || '',
            path: data.path || [],
            notes: data.notes || []
          });
        })
        .catch((err) => console.error("❌ Fetch Error:", err));
    }
  }, [shiftId]);

  const formattedRoute = useMemo(() => {
    return shiftData.path
      .filter((p: any) => p?.latitude && p?.longitude)
      .map((p: any) => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      }))
      .filter(p => !isNaN(p.latitude) && p.latitude >= -90 && p.latitude <= 90);
  }, [shiftData.path]);

  const totalKm = useMemo(() => {
    if (formattedRoute.length < 2) return 0;
    let distance = 0;
    for (let i = 0; i < formattedRoute.length - 1; i++) {
      distance += calculateDistance(
        formattedRoute[i].latitude, formattedRoute[i].longitude,
        formattedRoute[i + 1].latitude, formattedRoute[i + 1].longitude
      );
    }
    return distance;
  }, [formattedRoute]);

  // Aggregate Total Student and Class counts for the day
  const dailyStats = useMemo(() => {
    return shiftData.notes.reduce((acc, note) => ({
      totalStudents: acc.totalStudents + (Number(note.studentCount) || 0),
      totalClasses: acc.totalClasses + (Number(note.classCount) || 0)
    }), { totalStudents: 0, totalClasses: 0 });
  }, [shiftData.notes]);

  const formattedNotes = useMemo(() => {
    return shiftData.notes
      .filter((n: any) => n?.latitude && n?.longitude)
      .map((n: any) => ({
        ...n,
        latitude: Number(n.latitude),
        longitude: Number(n.longitude),
      }));
  }, [shiftData.notes]);

  const handleNotePress = (note: Note) => {
    setSelectedNote(note);
    setTaskListVisible(true);
    mapRef.current?.animateToRegion({
      latitude: note.latitude,
      longitude: note.longitude,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    }, 800);
  };

  const initialRegion: Region = useMemo(() => {
    const fallback = { latitude: 19.0760, longitude: 72.8777, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    if (formattedRoute.length === 0) return fallback;
    return {
      latitude: formattedRoute[0].latitude,
      longitude: formattedRoute[0].longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
  }, [formattedRoute]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.headerTitle}>{shiftData.date} Activity</Text>
      </TouchableOpacity>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {formattedRoute.length > 1 && (
          <>
            <Polyline coordinates={formattedRoute} strokeColor="#007AFF" strokeWidth={5} />
            <Marker coordinate={formattedRoute[0]} title="Start Point" pinColor="green" />
            <Marker coordinate={formattedRoute[formattedRoute.length - 1]} title="End Point" pinColor="red" />
          </>
        )}

        {formattedNotes.map((note, index) => (
          <Marker
            key={`note-${index}`}
            coordinate={{ latitude: note.latitude, longitude: note.longitude }}
            onPress={() => handleNotePress(note)}
          >
            <View style={styles.noteIconBubble}>
              <Ionicons name="business" size={16} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      <Modal animationType="slide" transparent visible={isTaskListVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTypeLabel}>VISIT INFORMATION</Text>
              <TouchableOpacity onPress={() => setTaskListVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#ccc" />
              </TouchableOpacity>
            </View>

            {selectedNote && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.classNameText}>{selectedNote.className}</Text>
                
                {/* Visual Count Badges inside Modal */}
                <View style={styles.badgeRow}>
                    <View style={[styles.countBadge, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.badgeText, { color: '#0369A1' }]}>Students: {selectedNote.studentCount || 0}</Text>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: '#F0FDF4' }]}>
                        <Text style={[styles.badgeText, { color: '#15803D' }]}>Classes: {selectedNote.classCount || 0}</Text>
                    </View>
                </View>

                <Text style={styles.taskTime}>
                  Recorded: {new Date(selectedNote.createdAt || Date.now()).toLocaleTimeString()}
                </Text>

                <View style={styles.divider} />

                <View style={styles.infoSection}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="person" size={20} color="#007AFF" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Director / Proprietor</Text>
                    <Text style={styles.infoMainText}>{selectedNote.directorName || 'N/A'}</Text>
                    {selectedNote.directorNumber && (
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${selectedNote.directorNumber}`)}>
                        <Text style={styles.phoneLink}>{selectedNote.directorNumber}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="location" size={20} color="#CA8A04" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Address Detail</Text>
                    <Text style={styles.infoMainText}>{selectedNote.address || 'No address saved'}</Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="call" size={20} color="#166534" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Primary Contact</Text>
                    <Text style={styles.infoMainText}>{selectedNote.contactPersonName || 'N/A'}</Text>
                    {selectedNote.contactPersonNumber && (
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${selectedNote.contactPersonNumber}`)}>
                        <Text style={styles.phoneLink}>{selectedNote.contactPersonNumber}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Day Summary</Text>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{totalKm.toFixed(1)}km</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Visits</Text>
            <Text style={styles.statValue}>{formattedNotes.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Students</Text>
            <Text style={styles.statValue}>{dailyStats.totalStudents}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Classes</Text>
            <Text style={styles.statValue}>{dailyStats.totalClasses}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  backBtn: {
    position: 'absolute', top: 50, left: 20, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 12, borderRadius: 25, elevation: 5
  },
  headerTitle: { marginLeft: 10, fontWeight: 'bold' },
  noteIconBubble: {
    backgroundColor: '#EAB308', padding: 8, borderRadius: 20,
    borderWidth: 2, borderColor: 'white', elevation: 5,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTypeLabel: { fontSize: 11, color: '#888', fontWeight: 'bold', letterSpacing: 1 },
  classNameText: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  badgeRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  taskTime: { fontSize: 13, color: '#8e8e93', marginTop: 10 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 },
  infoSection: { flexDirection: 'row', marginBottom: 22, alignItems: 'flex-start' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 2 },
  infoMainText: { fontSize: 16, color: '#333', fontWeight: '600' },
  phoneLink: { fontSize: 15, color: '#007AFF', fontWeight: 'bold', marginTop: 3 },
  summaryBox: { 
    padding: 20, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, 
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 10 
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#444' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center' }, 
  statLabel: { fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: 'bold', color: '#111' }
});