import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LeadManagement() {
  const [leads, setLeads] = useState([
    { id: '1', name: 'Rahul Kumar', ref: 'Self', phone: '+91 9876543210', status: 'Verified' },
    { id: '2', name: 'Suresh Patil', ref: 'Bharat', phone: '+91 9555726438', status: 'Pending' },
  ]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.formCard}>
        <Text style={styles.title}>New Referral</Text>
        
        <View style={styles.inputGroup}>
          <Ionicons name="person-outline" size={20} color="#007AFF" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Lead Full Name" placeholderTextColor="#999" />
        </View>

        <View style={styles.inputGroup}>
          <Ionicons name="call-outline" size={20} color="#007AFF" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Phone Number" 
            keyboardType="phone-pad"
            placeholderTextColor="#999" 
          />
        </View>

        <View style={styles.inputGroup}>
          <Ionicons name="share-social-outline" size={20} color="#007AFF" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Reference Name" placeholderTextColor="#999" />
        </View>
        
        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8}>
          <Text style={styles.submitBtnText}>Register Lead</Text>
          <Ionicons name="chevron-forward" size={18} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.subTitle}>Recent Referrals</Text>
        <Text style={styles.countBadge}>{leads.length}</Text>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.leadCard}>
            <View style={styles.leadInfo}>
              <Text style={styles.leadName}>{item.name}</Text>
              <Text style={styles.leadDetails}>📞 {item.phone}</Text>
              <Text style={styles.leadRef}>Ref: {item.ref}</Text>
            </View>
            <View style={[
              styles.statusTag, 
              { backgroundColor: item.status === 'Verified' ? '#E8F5E9' : '#FFF3E0' }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: item.status === 'Verified' ? '#2E7D32' : '#EF6C00' }
              ]}>
                {item.status}
              </Text>
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', paddingHorizontal: 20, paddingTop: 60 },
  formCard: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 20, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10,
    marginBottom: 30 
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1C1C1E' },
  inputGroup: { 
    flexDirection: 'row', 
    alignItems: 'center',    
    backgroundColor: '#F2F2F7', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    marginBottom: 15 
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: '#1C1C1E', fontSize: 16 },
  submitBtn: { 
    backgroundColor: '#007AFF', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginTop: 10 
  },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginRight: 8 },
  listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  subTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginRight: 10 },
  countBadge: { backgroundColor: '#007AFF', color: 'white', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 12, overflow: 'hidden' },
  leadCard: { 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF'
  },
  leadInfo: { flex: 1 },
  leadName: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  leadDetails: { fontSize: 13, color: '#666', marginTop: 4 },
  leadRef: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' }
});