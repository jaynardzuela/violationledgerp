import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { PurposeType, Resident, Visitor } from '../src/types';
import { mockResidents, mockVisitors } from '../src/mockData';

type FormState = {
  driverName: string;
  plateNumber: string;
  purpose: PurposeType;
  residentQuery: string;
  residentId?: number | null;
  purposeOther?: string;
};

export default function VisitorsScreen() {
  const [form, setForm] = useState<FormState>({
    driverName: '',
    plateNumber: '',
    purpose: 'Visit Resident',
    residentQuery: '',
    residentId: null,
    purposeOther: '',
  });
  const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([...mockVisitors]);
  const [showConfirmation, setShowConfirmation] = useState<Visitor | null>(null);

  const filteredResidents = useMemo(() => {
    const q = form.residentQuery.trim().toLowerCase();
    if (!q) return mockResidents;
    return mockResidents.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
    );
  }, [form.residentQuery]);

  const handleSubmit = () => {
    const { driverName, plateNumber, purpose, residentId, purposeOther } = form;
    if (!driverName.trim() || !plateNumber.trim()) {
      Alert.alert('Missing information', 'Please enter driver name and plate number.');
      return;
    }
    if (purpose === 'Visit Resident' && !residentId) {
      Alert.alert('Resident required', 'Please select a resident to link this visitor.');
      return;
    }

    const now = Date.now();
    const newVisitor: Visitor = {
      id: (activeVisitors[activeVisitors.length - 1]?.id ?? 0) + 1,
      driverName: driverName.trim(),
      plateNumber: plateNumber.trim().toUpperCase(),
      purpose: purpose === 'Others' && purposeOther?.trim() ? 'Others' : purpose,
      residentId: purpose === 'Visit Resident' ? residentId ?? null : null,
      status: 'active',
      timeIn: now,
      timeOut: null,
    };

    const next = [...activeVisitors, newVisitor];
    setActiveVisitors(next);
    // Update mock store for consistency
    mockVisitors.push(newVisitor);
    setShowConfirmation(newVisitor);
    setForm({ driverName: '', plateNumber: '', purpose: 'Visit Resident', residentQuery: '', residentId: null, purposeOther: '' });
  };

  const handleLogout = (visitorId: number) => {
    const now = Date.now();
    const next = activeVisitors.map(v =>
      v.id === visitorId ? { ...v, status: 'logged_out', timeOut: now } : v
    );
    setActiveVisitors(next);
  };

  const activeList = activeVisitors.filter(v => v.status === 'active');

  const selectedResident = form.residentId ? mockResidents.find(r => r.id === form.residentId) : undefined;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Guard Dashboard</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register Visitor</Text>

          <Text style={styles.label}>Driver Name</Text>
          <TextInput
            style={styles.input}
            value={form.driverName}
            onChangeText={(t) => setForm(s => ({ ...s, driverName: t }))}
            placeholder="e.g., Juan Dela Cruz"
          />

          <Text style={styles.label}>Vehicle Plate Number</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="characters"
            value={form.plateNumber}
            onChangeText={(t) => setForm(s => ({ ...s, plateNumber: t }))}
            placeholder="e.g., ABC-1234"
          />

          <Text style={styles.label}>Purpose of Visit</Text>
          <View style={styles.purposeRow}>
            {(['Visit Resident', 'Delivery', 'Barangay Errand', 'Others'] as PurposeType[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.pill, form.purpose === p && styles.pillActive]}
                onPress={() => setForm(s => ({ ...s, purpose: p }))}
              >
                <Text style={[styles.pillText, form.purpose === p && styles.pillTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.purpose === 'Visit Resident' && (
            <View>
              <Text style={styles.label}>Search Resident</Text>
              <TextInput
                style={styles.input}
                value={form.residentQuery}
                onChangeText={(t) => setForm(s => ({ ...s, residentQuery: t }))}
                placeholder="Type name or address"
              />
              <View style={styles.residentsList}>
                {filteredResidents.map((r: Resident) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.residentItem, form.residentId === r.id && styles.residentItemActive]}
                    onPress={() => setForm(s => ({ ...s, residentId: r.id }))}
                  >
                    <Text style={styles.residentName}>{r.name}</Text>
                    <Text style={styles.residentAddress}>{r.address}</Text>
                  </TouchableOpacity>
                ))}
                {filteredResidents.length === 0 && (
                  <Text style={styles.muted}>No residents match your search.</Text>
                )}
              </View>
              {selectedResident && (
                <Text style={styles.selectedResident}>Linked to: {selectedResident.name} ({selectedResident.address})</Text>
              )}
            </View>
          )}

          {form.purpose === 'Others' && (
            <View>
              <Text style={styles.label}>Specify purpose</Text>
              <TextInput
                style={styles.input}
                value={form.purposeOther}
                onChangeText={(t) => setForm(s => ({ ...s, purposeOther: t }))}
                placeholder="Enter purpose"
              />
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
            <Text style={styles.primaryBtnText}>Save & Confirm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Visitors ({activeList.length})</Text>
          {activeList.length === 0 && <Text style={styles.muted}>No active visitors.</Text>}
          {activeList.map(v => (
            <View key={v.id} style={styles.activeItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeLine}>{v.driverName} • {v.plateNumber}</Text>
                <Text style={styles.mutedSmall}>
                  {v.purpose}{v.residentId ? ` → Resident #${v.residentId}` : ''} • In: {new Date(v.timeIn).toLocaleTimeString()}
                </Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={() => handleLogout(v.id)}>
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {showConfirmation && (
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmTitle}>Visitor Registered</Text>
            <Text style={styles.confirmLine}>Driver: {showConfirmation.driverName}</Text>
            <Text style={styles.confirmLine}>Plate: {showConfirmation.plateNumber}</Text>
            <Text style={styles.confirmLine}>Purpose: {showConfirmation.purpose}{showConfirmation.residentId ? ` (Resident #${showConfirmation.residentId})` : ''}</Text>
            <Text style={styles.rulesTitle}>Parking Rules Reminder</Text>
            <Text style={styles.rulesText}>- Park only in designated areas.</Text>
            <Text style={styles.rulesText}>- Follow guard instructions at all times.</Text>
            <Text style={styles.rulesText}>- Keep driveways and fire lanes clear.</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowConfirmation(null)}>
              <Text style={styles.secondaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  card: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 12, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  label: { marginTop: 8, fontSize: 12, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4, backgroundColor: 'white' },
  purposeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#e9ecef', borderRadius: 16, marginRight: 8, marginBottom: 8, backgroundColor: '#fff' },
  pillActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  pillText: { fontSize: 12, color: '#555' },
  pillTextActive: { color: 'white', fontWeight: 'bold' },
  residentsList: { marginTop: 8 },
  residentItem: { padding: 10, borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, backgroundColor: 'white', marginBottom: 6 },
  residentItemActive: { borderColor: '#007AFF', borderWidth: 2 },
  residentName: { fontWeight: '600', color: '#333' },
  residentAddress: { color: '#666', fontSize: 12 },
  selectedResident: { marginTop: 4, fontSize: 12, color: '#333' },
  primaryBtn: { marginTop: 12, backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  primaryBtnText: { color: 'white', fontWeight: 'bold' },
  activeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  activeLine: { fontWeight: '600', color: '#333' },
  muted: { color: '#777' },
  mutedSmall: { color: '#777', fontSize: 12 },
  logoutBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginLeft: 12 },
  logoutBtnText: { color: 'white', fontWeight: 'bold' },
  confirmationBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 12 },
  confirmTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: '#333' },
  confirmLine: { color: '#333', marginBottom: 2 },
  rulesTitle: { marginTop: 8, fontWeight: '600', color: '#333' },
  rulesText: { color: '#555', fontSize: 12 },
  secondaryBtn: { marginTop: 10, backgroundColor: '#34C759', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  secondaryBtnText: { color: 'white', fontWeight: 'bold' },
});


