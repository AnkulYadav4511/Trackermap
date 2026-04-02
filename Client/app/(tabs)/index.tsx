// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   View,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   Modal,
//   TextInput,
//   SafeAreaView,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform
// } from 'react-native';
// import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import * as Location from 'expo-location';
// import * as TaskManager from 'expo-task-manager';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons } from '@expo/vector-icons';
// import axios from 'axios';
// import { BASE_URL } from '../../services/api';

// const LOCATION_TASK_NAME = 'background-location-task';
// const SHIFT_DURATION_MS = 8 * 60 * 60 * 1000;

// ////////////////////////////////////////////////////////////
// // UTILS: DISTANCE CALCULATION
// ////////////////////////////////////////////////////////////
// const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//   const R = 6371; 
//   const dLat = (lat2 - lat1) * Math.PI / 180;
//   const dLon = (lon2 - lon1) * Math.PI / 180;
//   const a = 
//     Math.sin(dLat/2) * Math.sin(dLat/2) +
//     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//   return R * c; 
// };

// ////////////////////////////////////////////////////////////
// // BACKGROUND TASK
// ////////////////////////////////////////////////////////////
// TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
//   if (error) return;
//   if (!data?.locations?.length) return;

//   try {
//     const { latitude, longitude } = data.locations[0].coords;
//     const rawId = await AsyncStorage.getItem('userId');
//     if (!rawId) return;
//     const cleanId = rawId.replace(/['"]+/g, '').trim();
    
//     await axios.post(`${BASE_URL}/track`, {
//       userId: cleanId,
//       latitude,
//       longitude,
//     });
//   } catch (err: any) {
//     console.log('BG tracking failed:', err.message);
//   }
// });

// ////////////////////////////////////////////////////////////
// // MAIN COMPONENT
// ////////////////////////////////////////////////////////////
// export default function FieldDashboard() {
//   const mapRef = useRef<MapView>(null);
//   const isEndingShift = useRef(false);

//   const [shiftStart, setShiftStart] = useState<number | null>(null);
//   const [timeLeft, setTimeLeft] = useState('08:00:00');
//   const [totalDistance, setTotalDistance] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [pathCoordinates, setPathCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
//   const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  
//   // NEW FORM STATE
//   const [formData, setFormData] = useState({
//     className: '',
//     directorInfo: '',
//     addressInfo: '',
//     contactPerson: ''
//   });

//   const [userLocation, setUserLocation] = useState({
//     latitude: 19.076,
//     longitude: 72.8777,
//   });

//   useEffect(() => {
//     if (pathCoordinates.length < 2) {
//       setTotalDistance(0);
//       return;
//     }
//     let dist = 0;
//     for (let i = 0; i < pathCoordinates.length - 1; i++) {
//       dist += calculateDistance(
//         pathCoordinates[i].latitude,
//         pathCoordinates[i].longitude,
//         pathCoordinates[i + 1].latitude,
//         pathCoordinates[i + 1].longitude
//       );
//     }
//     setTotalDistance(dist);
//   }, [pathCoordinates]);

//   const fetchCurrentPath = useCallback(async () => {
//     try {
//       const userId = await AsyncStorage.getItem('userId');
//       if (!userId) return;
//       const cleanId = userId.replace(/['"]+/g, '');
//       const res = await axios.get(`${BASE_URL}/shift/active/${cleanId}`);

//       if (res.data?.path?.length) {
//         const coords = res.data.path.map((p: any) => ({
//           latitude: Number(p.latitude),
//           longitude: Number(p.longitude),
//         }));
//         setPathCoordinates(coords);
//       }
//     } catch (err) {}
//   }, []);

//   const startBackgroundTracking = async () => {
//     await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
//       accuracy: Location.Accuracy.High,
//       timeInterval: 5000,
//       distanceInterval: 10,
//       foregroundService: {
//         notificationTitle: "Tracking Active",
//         notificationBody: "Your shift location is being recorded.",
//         notificationColor: "#007AFF",
//       },
//     });
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
//         if (fgStatus !== 'granted') return;
//         await Location.requestBackgroundPermissionsAsync();

//         const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
//         setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

//         const userId = await AsyncStorage.getItem('userId');
//         if (userId) {
//           const cleanId = userId.replace(/['"]+/g, '');
//           try {
//             const res = await axios.get(`${BASE_URL}/shift/active/${cleanId}`);
//             if (res.data?.startTime) {
//               setShiftStart(new Date(res.data.startTime).getTime());
//               await fetchCurrentPath();
//               const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
//               if (!isTracking) await startBackgroundTracking();
//             }
//           } catch (e) {}
//         }
//       } catch (err) {
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [fetchCurrentPath]);

//   useEffect(() => {
//     if (!shiftStart) return;
//     const syncInterval = setInterval(fetchCurrentPath, 8000);
//     const timer = setInterval(() => {
//       const remaining = SHIFT_DURATION_MS - (Date.now() - shiftStart);
//       if (remaining <= 0) {
//         clearInterval(timer);
//         handleEndShift();
//       } else {
//         const h = Math.floor(remaining / 3600000);
//         const m = Math.floor((remaining % 3600000) / 60000);
//         const s = Math.floor((remaining % 60000) / 1000);
//         setTimeLeft(`${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`);
//       }
//     }, 1000);
//     return () => {
//       clearInterval(timer);
//       clearInterval(syncInterval);
//     };
//   }, [shiftStart, fetchCurrentPath]);

//   const handleStartShift = async () => {
//     try {
//       setLoading(true);
//       const userId = await AsyncStorage.getItem('userId');
//       if (!userId) return;
//       const cleanId = userId.replace(/['"]+/g, '');
//       const res = await axios.post(`${BASE_URL}/shift/start`, { userId: cleanId });
//       setShiftStart(new Date(res.data.startTime).getTime());
//       setPathCoordinates([]);
//       isEndingShift.current = false;
//       await startBackgroundTracking();
//     } catch (err: any) {
//       Alert.alert("Error", "Could not start shift.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEndShift = async () => {
//     if (isEndingShift.current) return;
//     isEndingShift.current = true;
//     try {
//       setLoading(true);
//       const userId = await AsyncStorage.getItem('userId');
//       if (!userId) return;
//       const cleanId = userId.replace(/['"]+/g, '');
//       await axios.post(`${BASE_URL}/shift/end`, { userId: cleanId });
//       if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) {
//         await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
//       }
//       setShiftStart(null);
//       setPathCoordinates([]);
//       setTimeLeft('08:00:00');
//       Alert.alert("Shift Ended", `Distance covered: ${totalDistance.toFixed(2)} km`);
//     } catch (err: any) {
//       isEndingShift.current = false;
//       Alert.alert("Error", "Failed to end shift.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // UPDATED SAVE LOGIC
//   const saveEntryToLog = async () => {
//     if (!formData.className.trim()) {
//       Alert.alert("Error", "Class Name is required.");
//       return;
//     }
//     try {
//       setLoading(true);
//       const userId = await AsyncStorage.getItem('userId');
//       const loc = await Location.getCurrentPositionAsync({});
      
//       await axios.post(`${BASE_URL}/notes`, {
//         userId: userId?.replace(/['"]+/g, ''),
//         ...formData,
//         latitude: loc.coords.latitude,
//         longitude: loc.coords.longitude,
//       });

//       setFormData({ className: '', directorInfo: '', addressInfo: '', contactPerson: '' });
//       setNoteModalVisible(false);
//       Alert.alert("Success", "Entry saved to log.");
//     } catch (err) {
//       Alert.alert("Error", "Could not save entry.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={styles.map}
//         initialRegion={{
//           ...userLocation,
//           latitudeDelta: 0.005,
//           longitudeDelta: 0.005,
//         }}
//         showsUserLocation
//       >
//         {pathCoordinates.length > 1 && (
//           <Polyline
//             coordinates={pathCoordinates}
//             strokeColor="#007AFF"
//             strokeWidth={6}
//             zIndex={10}
//             geodesic={true}
//           />
//         )}
//       </MapView>

//       <SafeAreaView style={styles.headerContainer}>
//         <View style={styles.glassHeader}>
//           <View>
//             <Text style={styles.headerLabel}>{shiftStart ? 'ACTIVE SHIFT' : 'OFF DUTY'}</Text>
//             <Text style={styles.timerText}>{shiftStart ? timeLeft : '08:00:00'}</Text>
//             <View style={styles.statsRow}>
//                <Text style={styles.subLabel}>{totalDistance.toFixed(2)} km</Text>
//                <Text style={styles.subDivider}>•</Text>
//                <Text style={styles.subLabel}>{pathCoordinates.length} points</Text>
//             </View>
//           </View>
//           <View style={[styles.statusDot, { backgroundColor: shiftStart ? '#4ADE80' : '#F87171' }]} />
//         </View>
//       </SafeAreaView>

//       <View style={styles.bottomControls}>
//         {!shiftStart ? (
//           <TouchableOpacity style={styles.mainBtn} onPress={handleStartShift}>
//             <Ionicons name="play" size={24} color="white" />
//             <Text style={styles.mainBtnText}>Start Tracking</Text>
//           </TouchableOpacity>
//         ) : (
//           <View style={styles.activeRow}>
//             <TouchableOpacity style={styles.noteFab} onPress={() => setNoteModalVisible(true)}>
//               <Ionicons name="add-circle" size={32} color="white" />
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.stopBtn} onPress={handleEndShift}>
//               <Ionicons name="stop" size={24} color="white" />
//               <Text style={styles.mainBtnText}>End Shift</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>

//       {/* UPDATED MODAL MATCHING SCREENSHOT */}
//       <Modal visible={isNoteModalVisible} transparent animationType="slide">
//         <KeyboardAvoidingView 
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           style={styles.modalOverlay}
//         >
//           <View style={styles.formCard}>
//             <View style={styles.formHeader}>
//               <Text style={styles.formTitle}>Field Entry Form</Text>
//               <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
//                 <Ionicons name="close" size={28} color="#A0AEC0" />
//               </TouchableOpacity>
//             </View>

//             <ScrollView showsVerticalScrollIndicator={false}>
//               <Text style={styles.inputLabel}>Class Name</Text>
//               <TextInput 
//                 style={styles.formInput} 
//                 placeholder="Enter Class Name" 
//                 value={formData.className}
//                 onChangeText={(t) => setFormData({...formData, className: t})}
//               />

//               <Text style={styles.inputLabel}>Director / Proprietor (Name & Number)</Text>
//               <TextInput 
//                 style={styles.formInput} 
//                 placeholder="Name / Phone" 
//                 value={formData.directorInfo}
//                 onChangeText={(t) => setFormData({...formData, directorInfo: t})}
//               />

//               <Text style={styles.inputLabel}>Address — Class Number</Text>
//               <TextInput 
//                 style={styles.formInput} 
//                 placeholder="Full Address / Room No" 
//                 value={formData.addressInfo}
//                 onChangeText={(t) => setFormData({...formData, addressInfo: t})}
//               />

//               <Text style={styles.inputLabel}>Contact Person (Name & Number)</Text>
//               <TextInput 
//                 style={styles.formInput} 
//                 placeholder="Contact Name / Phone" 
//                 value={formData.contactPerson}
//                 onChangeText={(t) => setFormData({...formData, contactPerson: t})}
//               />

//               <TouchableOpacity style={styles.saveToLogBtn} onPress={saveEntryToLog}>
//                 <Text style={styles.saveToLogText}>Save to Log</Text>
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   map: { ...StyleSheet.absoluteFillObject },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   headerContainer: { position: 'absolute', top: 50, width: '100%', alignItems: 'center' },
//   glassHeader: { width: '90%', backgroundColor: 'white', borderRadius: 15, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
//   headerLabel: { fontSize: 10, color: 'gray', letterSpacing: 1 },
//   timerText: { fontSize: 26, fontWeight: 'bold' },
//   statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
//   subLabel: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
//   subDivider: { marginHorizontal: 6, color: '#CCC' },
//   statusDot: { width: 12, height: 12, borderRadius: 6 },
//   bottomControls: { position: 'absolute', bottom: 30, width: '100%', paddingHorizontal: 20 },
//   mainBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
//   activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   noteFab: { backgroundColor: '#007AFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 4 },
//   stopBtn: { backgroundColor: '#FF3B30', flex: 0.8, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
//   mainBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
  
//   // MODAL STYLES
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
//   formCard: { backgroundColor: 'white', width: '92%', borderRadius: 24, padding: 24, maxHeight: '80%' },
//   formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
//   formTitle: { fontSize: 22, fontWeight: 'bold', color: '#2D3748' },
//   inputLabel: { fontSize: 13, fontWeight: '700', color: '#4A5568', marginTop: 15, marginBottom: 6 },
//   formInput: { backgroundColor: '#F7F8FA', borderRadius: 12, padding: 15, fontSize: 16, color: '#2D3748', borderWidth: 1, borderColor: '#EDF2F7' },
//   saveToLogBtn: { backgroundColor: '#007AFF', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 30, marginBottom: 10 },
//   saveToLogText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
// });






import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../../services/api';

const LOCATION_TASK_NAME = 'background-location-task';
const SHIFT_DURATION_MS = 8 * 60 * 60 * 1000;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) return;
  if (!data?.locations?.length) return;
  try {
    const { latitude, longitude } = data.locations[0].coords;
    const rawId = await AsyncStorage.getItem('userId');
    if (!rawId) return;
    const cleanId = rawId.replace(/['"]+/g, '').trim();
    await axios.post(`${BASE_URL}/track`, { userId: cleanId, latitude, longitude });
  } catch (err: any) { console.log('BG tracking failed:', err.message); }
});

export default function FieldDashboard() {
  const mapRef = useRef<MapView>(null);
  const isEndingShift = useRef(false);

  const [shiftStart, setShiftStart] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState('08:00:00');
  const [totalDistance, setTotalDistance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pathCoordinates, setPathCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  
  // FORM STATE MATCHING DB FIELDS
  const [formData, setFormData] = useState({
    className: '',
    directorName: '',
    directorNumber: '',
    address: '',
    contactPersonName: '',
    contactPersonNumber: '',
    studentCount: '',
    classCount: ''
  });

  const [userLocation, setUserLocation] = useState({ latitude: 19.076, longitude: 72.8777 });

  useEffect(() => {
    if (pathCoordinates.length < 2) { setTotalDistance(0); return; }
    let dist = 0;
    for (let i = 0; i < pathCoordinates.length - 1; i++) {
      dist += calculateDistance(pathCoordinates[i].latitude, pathCoordinates[i].longitude, pathCoordinates[i + 1].latitude, pathCoordinates[i + 1].longitude);
    }
    setTotalDistance(dist);
  }, [pathCoordinates]);

  const fetchCurrentPath = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const cleanId = userId.replace(/['"]+/g, '');
      const res = await axios.get(`${BASE_URL}/shift/active/${cleanId}`);
      if (res.data?.path?.length) {
        const coords = res.data.path.map((p: any) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }));
        setPathCoordinates(coords);
      }
    } catch (err) {}
  }, []);

  const startBackgroundTracking = async () => {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
      foregroundService: {
        notificationTitle: "Tracking Active",
        notificationBody: "Your shift location is being recorded.",
        notificationColor: "#007AFF",
      },
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') return;
        await Location.requestBackgroundPermissionsAsync();
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const cleanId = userId.replace(/['"]+/g, '');
          const res = await axios.get(`${BASE_URL}/shift/active/${cleanId}`);
          if (res.data?.startTime) {
            setShiftStart(new Date(res.data.startTime).getTime());
            await fetchCurrentPath();
            const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
            if (!isTracking) await startBackgroundTracking();
          }
        }
      } catch (err) {} finally { setLoading(false); }
    })();
  }, [fetchCurrentPath]);

  useEffect(() => {
    if (!shiftStart) return;
    const syncInterval = setInterval(fetchCurrentPath, 8000);
    const timer = setInterval(() => {
      const remaining = SHIFT_DURATION_MS - (Date.now() - shiftStart);
      if (remaining <= 0) { clearInterval(timer); handleEndShift(); }
      else {
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`);
      }
    }, 1000);
    return () => { clearInterval(timer); clearInterval(syncInterval); };
  }, [shiftStart, fetchCurrentPath]);

  const handleStartShift = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const cleanId = userId?.replace(/['"]+/g, '');
      const res = await axios.post(`${BASE_URL}/shift/start`, { userId: cleanId });
      setShiftStart(new Date(res.data.startTime).getTime());
      setPathCoordinates([]);
      await startBackgroundTracking();
    } catch (err: any) { Alert.alert("Error", "Could not start shift."); }
    finally { setLoading(false); }
  };

  const handleEndShift = async () => {
    if (isEndingShift.current) return;
    isEndingShift.current = true;
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const cleanId = userId?.replace(/['"]+/g, '');
      await axios.post(`${BASE_URL}/shift/end`, { userId: cleanId });
      if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) { await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME); }
      setShiftStart(null);
      setPathCoordinates([]);
      setTimeLeft('08:00:00');
      Alert.alert("Shift Ended", `Distance: ${totalDistance.toFixed(2)} km`);
    } catch (err: any) { Alert.alert("Error", "Failed to end shift."); }
    finally { setLoading(false); isEndingShift.current = false; }
  };

  const saveEntryToLog = async () => {
    if (!formData.className.trim()) { Alert.alert("Error", "Class Name is required."); return; }
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const loc = await Location.getCurrentPositionAsync({});
      await axios.post(`${BASE_URL}/notes`, {
        userId: userId?.replace(/['"]+/g, ''),
        ...formData,
        studentCount: formData.studentCount ? parseInt(formData.studentCount) : 0,
        classCount: formData.classCount ? parseInt(formData.classCount) : 0,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setFormData({ 
        className: '', directorName: '', directorNumber: '', address: '', 
        contactPersonName: '', contactPersonNumber: '', studentCount: '', classCount: '' 
      });
      setNoteModalVisible(false);
      Alert.alert("Success", "Entry saved.");
    } catch (err) { Alert.alert("Error", "Save failed."); }
    finally { setLoading(false); }
  };

  if (loading) return (<View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{ ...userLocation, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        showsUserLocation
      >
        {pathCoordinates.length > 1 && (
          <Polyline coordinates={pathCoordinates} strokeColor="#007AFF" strokeWidth={6} />
        )}
      </MapView>

      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.glassHeader}>
          <View>
            <Text style={styles.headerLabel}>{shiftStart ? 'ACTIVE SHIFT' : 'OFF DUTY'}</Text>
            <Text style={styles.timerText}>{shiftStart ? timeLeft : '08:00:00'}</Text>
            <View style={styles.statsRow}>
               <Text style={styles.subLabel}>{totalDistance.toFixed(2)} km</Text>
               <Text style={styles.subDivider}>•</Text>
               <Text style={styles.subLabel}>{pathCoordinates.length} points</Text>
            </View>
          </View>
          <View style={[styles.statusDot, { backgroundColor: shiftStart ? '#4ADE80' : '#F87171' }]} />
        </View>
      </SafeAreaView>

      <View style={styles.bottomControls}>
        {!shiftStart ? (
          <TouchableOpacity style={styles.mainBtn} onPress={handleStartShift}>
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.mainBtnText}>Start Tracking</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeRow}>
            <TouchableOpacity style={styles.noteFab} onPress={() => setNoteModalVisible(true)}>
              <Ionicons name="add-circle" size={32} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={handleEndShift}>
              <Ionicons name="stop" size={24} color="white" />
              <Text style={styles.mainBtnText}>End Shift</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={isNoteModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Field Entry Form</Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}><Ionicons name="close" size={28} color="#A0AEC0" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
              <Text style={styles.inputLabel}>Class Name</Text>
              <TextInput style={styles.formInput} placeholder="Enter Class Name" value={formData.className} onChangeText={(t) => setFormData({...formData, className: t})} />
              
              <Text style={styles.inputLabel}>Director / Proprietor Name</Text>
              <TextInput style={styles.formInput} placeholder="Name" value={formData.directorName} onChangeText={(t) => setFormData({...formData, directorName: t})} />
              
              <Text style={styles.inputLabel}>Director Phone Number</Text>
              <TextInput style={styles.formInput} placeholder="Phone" keyboardType="phone-pad" value={formData.directorNumber} onChangeText={(t) => setFormData({...formData, directorNumber: t})} />
              
              <Text style={styles.inputLabel}>Address — Class Number</Text>
              <TextInput style={styles.formInput} placeholder="Address details" value={formData.address} onChangeText={(t) => setFormData({...formData, address: t})} />
              
              <Text style={styles.inputLabel}>Contact Person Name</Text>
              <TextInput style={styles.formInput} placeholder="Name" value={formData.contactPersonName} onChangeText={(t) => setFormData({...formData, contactPersonName: t})} />
              
              <Text style={styles.inputLabel}>Contact Person Number</Text>
              <TextInput style={styles.formInput} placeholder="Phone" keyboardType="phone-pad" value={formData.contactPersonNumber} onChangeText={(t) => setFormData({...formData, contactPersonNumber: t})} />
              
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <View style={{flex: 1, marginRight: 10}}>
                  <Text style={styles.inputLabel}>Student Count</Text>
                  <TextInput style={styles.formInput} placeholder="Number" keyboardType="numeric" value={formData.studentCount} onChangeText={(t) => setFormData({...formData, studentCount: t})} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Class Count</Text>
                  <TextInput style={styles.formInput} placeholder="Number" keyboardType="numeric" value={formData.classCount} onChangeText={(t) => setFormData({...formData, classCount: t})} />
                </View>
              </View>

              <TouchableOpacity style={styles.saveToLogBtn} onPress={saveEntryToLog}><Text style={styles.saveToLogText}>Save to Log</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { position: 'absolute', top: 50, width: '100%', alignItems: 'center' },
  glassHeader: { width: '90%', backgroundColor: 'white', borderRadius: 15, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5 },
  headerLabel: { fontSize: 10, color: 'gray', letterSpacing: 1 },
  timerText: { fontSize: 26, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  subLabel: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  subDivider: { marginHorizontal: 6, color: '#CCC' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  bottomControls: { position: 'absolute', bottom: 30, width: '100%', paddingHorizontal: 20 },
  mainBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteFab: { backgroundColor: '#007AFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  stopBtn: { backgroundColor: '#FF3B30', flex: 0.8, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  mainBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  formCard: { backgroundColor: 'white', width: '92%', borderRadius: 24, padding: 24, maxHeight: '85%' },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#2D3748' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#4A5568', marginTop: 12, marginBottom: 4 },
  formInput: { backgroundColor: '#F7F8FA', borderRadius: 12, padding: 12, fontSize: 15, color: '#2D3748', borderWidth: 1, borderColor: '#EDF2F7' },
  saveToLogBtn: { backgroundColor: '#007AFF', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 25 },
  saveToLogText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});