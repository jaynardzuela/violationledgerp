import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { analyticsStore, AnalyticsSnapshot } from './analytics';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#007AFF' },
};

export default function AnalyticsScreen() {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot>(analyticsStore.getSnapshot());

  useEffect(() => {
    const unsub = analyticsStore.subscribe(setSnapshot);
    return unsub;
  }, []);

  const statusData = [
    { name: 'Moving', population: snapshot.movingCount, color: '#007AFF', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Parked', population: snapshot.parkedCount, color: '#34C759', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Violating', population: snapshot.violatingCount, color: '#FF3B30', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  ];

  const lineData = {
    labels: snapshot.timestamps.map((ts, i) => {
      // Show HH:MM for every 3rd label to reduce clutter
      if (i % 3 !== 0) return '';
      const d = new Date(ts);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    }),
    datasets: [{ data: snapshot.violationsSeries.length ? snapshot.violationsSeries : [0] }],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Analytics</Text>
        <Text style={styles.subtitle}>Blue Ridge B District</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={styles.statLabel}>In Boundary</Text><Text style={styles.statValue}>{snapshot.totalInBoundary}</Text></View>
        <View style={styles.statBox}><Text style={styles.statLabel}>Moving</Text><Text style={[styles.statValue, { color: '#007AFF' }]}>{snapshot.movingCount}</Text></View>
        <View style={styles.statBox}><Text style={styles.statLabel}>Parked</Text><Text style={[styles.statValue, { color: '#34C759' }]}>{snapshot.parkedCount}</Text></View>
        <View style={styles.statBox}><Text style={styles.statLabel}>Violating</Text><Text style={[styles.statValue, { color: '#FF3B30' }]}>{snapshot.violatingCount}</Text></View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Live Violations Over Time</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={lineData}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            bezier
            fromZero
            style={styles.chart}
          />
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Live Status Breakdown</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={statusData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
            absolute={false}
            style={styles.chart}
          />
        </View>
        <Text style={styles.chartDescription}>Warnings Issued: {snapshot.warningsCount} • Avg Violation: ~{Math.round(snapshot.avgViolationMs/1000)}s</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16 },
  statBox: { width: '48%', backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#666' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  chartSection: { backgroundColor: 'white', margin: 16, borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  chartContainer: { alignItems: 'center', marginBottom: 12 },
  chart: { borderRadius: 16 },
  chartDescription: { fontSize: 14, color: '#666', textAlign: 'center' },
});
