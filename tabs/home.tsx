import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

// Mock dashboard stats (replace with real data from API/store later)
const DASHBOARD_STATS = [
  { id: 'violationsToday', title: 'Violations Today', value: 12, subtitle: 'as of now' },
  { id: 'activeVehicles', title: 'Active Vehicles', value: 37, subtitle: 'currently in boundary' },
  { id: 'warningsIssued', title: 'Warnings Issued', value: 5, subtitle: 'last 24h' },
  { id: 'avgResponse', title: 'Avg Response', value: '03:42', subtitle: 'mm:ss to action' },
];

// Mock recent activities (replace with real feed later)
const RECENT_ACTIVITY: { id: string; title: string; detail: string; time: string }[] = [
  { id: 'a1', title: 'Warning Issued', detail: 'BMW X3 • PQR-6789 • Sector B', time: '2m ago' },
  { id: 'a2', title: 'Violation Cleared', detail: 'Toyota Camry • ABC-1234 • Sector A', time: '12m ago' },
  { id: 'a3', title: 'Vehicle Entered', detail: 'Honda Civic • XYZ-5678 entered boundary', time: '25m ago' },
  { id: 'a4', title: 'Vehicle Parked', detail: 'Mazda CX-5 • MNO-2345 at San Juan St', time: '48m ago' },
];

export default function Home() {
  // NOTE: To navigate on card press, inject a navigation prop
  // (e.g., from React Navigation) and call navigation.navigate('ScreenName')
  // in handleCardPress below.
  const handleCardPress = (cardId: string) => {
    // Example:
    // if (cardId === 'violationsToday') navigation.navigate('Reports');
    // if (cardId === 'activeVehicles') navigation.navigate('Map');
  };

  const renderCard = ({ item }: { item: typeof DASHBOARD_STATS[number] }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => handleCardPress(item.id)}
      style={styles.card}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {/* Small chevron to indicate pressable */}
        <Text style={styles.chevron}>›</Text>
      </View>
      <Text style={styles.cardValue}>{item.value}</Text>
      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
    </TouchableOpacity>
  );

  const renderActivityItem = ({ item }: { item: typeof RECENT_ACTIVITY[number] }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityRow}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
      <Text style={styles.activityDetail}>{item.detail}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header / App Name */}
      <View style={styles.header}>
        <Text style={styles.appName}>Violation Ledger</Text>
        <Text style={styles.appTagline}>Operations Dashboard</Text>
      </View>

      {/* 2x2 Grid of Statistic Cards */
      }
      <FlatList
        contentContainerStyle={styles.grid}
        data={DASHBOARD_STATS}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />

      {/* Recent Activity */}
      <View style={styles.activityHeader}>
        <Text style={styles.activityHeaderText}>Recent Activity</Text>
      </View>
      <FlatList
        data={RECENT_ACTIVITY}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityItem}
        contentContainerStyle={styles.activityList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const CARD_BG = '#2F6BFF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B2559',
  },
  appTagline: {
    marginTop: 2,
    fontSize: 14,
    color: '#5B6B92',
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.95,
  },
  chevron: {
    color: '#FFFFFF',
    fontSize: 18,
    opacity: 0.9,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    color: '#E6EEFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.95,
  },
  activityHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  activityHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B2559',
  },
  activityList: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E6ECF5',
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityTitle: {
    color: '#1B2559',
    fontSize: 14,
    fontWeight: '700',
  },
  activityTime: {
    color: '#5B6B92',
    fontSize: 12,
  },
  activityDetail: {
    color: '#304675',
    fontSize: 12,
  },
});


