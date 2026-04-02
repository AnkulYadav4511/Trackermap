import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Settings() {
    const router = useRouter();

    const [liveTracking, setLiveTracking] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [breakMode, setBreakMode] = useState(false);

    const checkGPS = () => {
        Alert.alert('GPS Status', 'Location services are active.');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ACCOUNT */}
                <Text style={styles.sectionTitle}>Account</Text>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => router.push('/edit-profile')}
                >
                    <View style={styles.leftSection}>
                        <Ionicons name="person-outline" size={22} color="#007AFF" />
                        <Text style={styles.itemText}>Edit Profile</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => router.push('/change-password')}
                >
                    <View style={styles.leftSection}>
                        <Ionicons name="lock-closed-outline" size={22} color="#007AFF" />
                        <Text style={styles.itemText}>Change Password</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>

                {/* TRACKING */}
                <Text style={styles.sectionTitle}>Tracking</Text>

                <View style={styles.item}>
                    <View style={styles.leftSection}>
                        <Ionicons name="location-outline" size={22} color="#34C759" />
                        <Text style={styles.itemText}>Live Tracking</Text>
                    </View>
                    <Switch value={liveTracking} onValueChange={setLiveTracking} />
                </View>

                <View style={styles.item}>
                    <View style={styles.leftSection}>
                        <Ionicons name="cafe-outline" size={22} color="#FF9500" />
                        <Text style={styles.itemText}>Break Mode</Text>
                    </View>
                    <Switch value={breakMode} onValueChange={setBreakMode} />
                </View>

                <TouchableOpacity style={styles.item} onPress={checkGPS}>
                    <View style={styles.leftSection}>
                        <Ionicons name="navigate-outline" size={22} color="#5856D6" />
                        <Text style={styles.itemText}>Check GPS Status</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>

                {/* NOTIFICATIONS */}
                <Text style={styles.sectionTitle}>Notifications</Text>

                <View style={styles.item}>
                    <View style={styles.leftSection}>
                        <Ionicons name="notifications-outline" size={22} color="#FF2D55" />
                        <Text style={styles.itemText}>Enable Notifications</Text>
                    </View>
                    <Switch value={notifications} onValueChange={setNotifications} />
                </View>

                {/* APP INFO */}
                <Text style={styles.sectionTitle}>App</Text>

                <TouchableOpacity style={styles.item}>
                    <View style={styles.leftSection}>
                        <Ionicons name="information-circle-outline" size={22} color="#8E8E93" />
                        <Text style={styles.itemText}>About App</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Live Tracking App v1.0.0</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 20,
    },
    sectionTitle: {
        marginTop: 30,
        marginBottom: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 18,
        marginBottom: 12,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 3,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemText: {
        marginLeft: 14,
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: 50,
        marginBottom: 30,
    },
    versionText: {
        fontSize: 13,
        color: '#8E8E93',
    },
});