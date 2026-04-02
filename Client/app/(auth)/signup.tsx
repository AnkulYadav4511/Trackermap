import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ScrollView, KeyboardAvoidingView, Platform,
    ActivityIndicator, Image
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/api';

export default function Signup() {
    // Basic Info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Role Logic
    const [role, setRole] = useState<'worker_manager' | 'admin'>('worker_manager');
    const [adminKey, setAdminKey] = useState('');

    // Status Logic
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);
    const router = useRouter();

    const handleTakePhoto = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert("Permission Required", "Camera access is needed for a profile photo.");
                return;
            }
        }
        setShowCamera(true);
    };

    const capturePhoto = async () => {
        if (cameraRef.current) {
            const result = await cameraRef.current.takePictureAsync({
                base64: true,
                quality: 0.3,
            });
            setPhoto(result.base64);
            setShowCamera(false);
        }
    };

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert("Required", "Name, Email, and Password are required.");
            return;
        }

        if (role === 'admin' && !adminKey) {
            Alert.alert("Admin Required", "Please enter the Secret Admin Key to register as an administrator.");
            return;
        }

        setLoading(true);
        try {
            const res = await authService.signup({
                name,
                email,
                password,
                role,
                adminKey: role === 'admin' ? adminKey : null,
                profileImage: photo
            });

            if (res.userId) {
                Alert.alert("Success", "Account created! You can now login.");
                router.replace('/login');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || "Signup failed. Check your network.";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    if (showCamera) {
        return (
            <View style={styles.cameraContainer}>
                <CameraView style={styles.camera} facing="front" ref={cameraRef}>
                    <View style={styles.cameraOverlay}>
                        <TouchableOpacity style={styles.captureBtn} onPress={capturePhoto}>
                            <View style={styles.innerCaptureBtn} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelCamera} onPress={() => setShowCamera(false)}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.logo}>Join Us<Text style={{ color: '#007AFF' }}>.</Text></Text>

                {/* Profile Photo Section */}
                <TouchableOpacity style={styles.photoUpload} onPress={handleTakePhoto}>
                    {photo ? (
                        <Image source={{ uri: `data:image/jpeg;base64,${photo}` }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="camera" size={32} color="#007AFF" />
                            <Text style={styles.photoLabel}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Form Inputs */}
                <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

                {/* Role Selector */}
                <Text style={styles.sectionLabel}>Register as:</Text>
                <View style={styles.rolePickerContainer}>
                    <TouchableOpacity
                        style={[styles.roleTab, role === 'worker_manager' && styles.activeTab]}
                        onPress={() => setRole('worker_manager')}
                    >
                        <Text style={[styles.tabText, role === 'worker_manager' && styles.activeTabText]}>Employee</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleTab, role === 'admin' && styles.activeTab]}
                        onPress={() => setRole('admin')}
                    >
                        <Text style={[styles.tabText, role === 'admin' && styles.activeTabText]}>Admin</Text>
                    </TouchableOpacity>
                </View>

                {/* Admin Key Input (Conditional) */}
                {role === 'admin' && (
                    <View style={styles.adminKeyWrapper}>
                        <Ionicons name="shield-checkmark" size={18} color="#007AFF" style={styles.keyIcon} />
                        <TextInput
                            style={styles.adminKeyInput}
                            placeholder="Secret Admin Key"
                            value={adminKey}
                            onChangeText={setAdminKey}
                            secureTextEntry
                        />
                    </View>
                )}

                <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
                </TouchableOpacity>

                <Link href="/login" asChild>
                    <TouchableOpacity style={styles.link}>
                        <Text style={styles.linkText}>Already have an account? <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Login</Text></Text>
                    </TouchableOpacity>
                </Link>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
    logo: { fontSize: 32, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 30, textAlign: 'center' },
    photoUpload: { alignSelf: 'center', marginBottom: 25 },
    photoPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f2f2f7', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#007AFF' },
    photoLabel: { fontSize: 11, color: '#007AFF', marginTop: 5, fontWeight: '600' },
    previewImage: { width: 110, height: 110, borderRadius: 55 },
    input: { backgroundColor: '#f2f2f7', padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 16 },

    // Role Switcher Styles
    sectionLabel: { fontSize: 14, color: '#8e8e93', marginBottom: 10, marginLeft: 5, fontWeight: '600' },
    rolePickerContainer: { flexDirection: 'row', backgroundColor: '#f2f2f7', borderRadius: 12, padding: 4, marginBottom: 15 },
    roleTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    tabText: { color: '#8e8e93', fontWeight: '600' },
    activeTabText: { color: '#007AFF' },

    // Admin Key Styles
    adminKeyWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15 },
    keyIcon: { marginRight: 10 },
    adminKeyInput: { flex: 1, paddingVertical: 18, fontSize: 16 },

    button: { backgroundColor: '#007aff', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    link: { marginTop: 25, alignItems: 'center' },
    linkText: { color: '#8e8e93', fontSize: 15 },

    // Camera Styles
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
    captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    innerCaptureBtn: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#fff' },
    cancelCamera: { marginTop: 30, padding: 10 }
});