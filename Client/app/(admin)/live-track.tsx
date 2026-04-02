import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/api';

export default function LiveTrack() {
  const { shiftId, workerName } = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [shiftId]);

  const loadStatus = async () => {
    try {
      const data = await authService.getShiftDetails(shiftId as string);
      
      if (data && data.path && data.path.length > 0) {
        const latest = data.path[data.path.length - 1];
        
        setCurrentLocation(latest);
        setLastUpdated(new Date().toLocaleTimeString());

        // ZOOM LOGIC: Smoothly animate to the user's location
        mapRef.current?.animateToRegion({
          latitude: latest.latitude,
          longitude: latest.longitude,
          latitudeDelta: 0.005, // Lower number = More zoom
          longitudeDelta: 0.005,
        }, 1000);
      }
    } catch (error) {
      console.error("Error fetching live status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to manually re-center if admin scrolls away
  const centerMap = () => {
    if (currentLocation) {
      mapRef.current?.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        // Shows the zoom and compass UI
        showsCompass={true}
        showsScale={true}
      >
        {currentLocation && (
          <Marker 
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude
            }} 
            title={workerName as string}
          >
             <View style={styles.markerContainer}>
                <View style={styles.markerDot} />
             </View>
          </Marker>
        )}
      </MapView>

      {/* Floating Buttons */}
      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={centerMap}>
          <Ionicons name="locate" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.headerRow}>
            <Text style={styles.workerName}>{workerName}</Text>
            <View style={styles.liveBadge}>
                <View style={styles.dot} />
                <Text style={styles.liveText}>LIVE</Text>
            </View>
        </View>
        <Text style={styles.statusText}>Syncing every 10s • Last: {lastUpdated}</Text>
        <Text style={styles.coordsText}>
            {currentLocation?.latitude.toFixed(5)}, {currentLocation?.longitude.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topButtons: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    right: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  iconButton: { 
    backgroundColor: 'white', 
    padding: 12, 
    borderRadius: 30, 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  infoCard: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workerName: { fontSize: 18, fontWeight: 'bold' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 5, borderRadius: 5 },
  dot: { width: 8, height: 8, backgroundColor: '#4CAF50', borderRadius: 4, marginRight: 5 },
  liveText: { fontSize: 10, color: '#4CAF50', fontWeight: 'bold' },
  statusText: { color: '#8E8E93', fontSize: 12, marginTop: 4 },
  coordsText: { color: '#007AFF', fontSize: 10, fontWeight: '600', marginTop: 5 },
  markerContainer: { backgroundColor: 'rgba(0, 122, 255, 0.2)', padding: 15, borderRadius: 40 },
  markerDot: { width: 14, height: 14, backgroundColor: '#007AFF', borderRadius: 7, borderWidth: 3, borderColor: 'white' }
});