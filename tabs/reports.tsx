import React from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Mock data for violations per day (last 7 days)
const violationsData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      data: [3, 5, 2, 8, 4, 1, 6], // Mock violation counts
    },
  ],
};

// Mock data for vehicle status breakdown
const vehicleStatusData = [
  { name: 'Moving', population: 2, color: '#007AFF', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  { name: 'Parked', population: 5, color: '#34C759', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  { name: 'Violating', population: 1, color: '#FF3B30', legendFontColor: '#7F7F7F', legendFontSize: 12 },
];

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#007AFF',
  },
};

export default function Reports() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
        <Text style={styles.subtitle}>Blue Ridge B District</Text>
      </View>

      {/* Violations Chart Section */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Violations (Last 7 Days)</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={violationsData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            showValuesOnTopOfBars={true}
            fromZero={true}
            yAxisLabel=""
            yAxisSuffix=""
            style={styles.chart}
          />
        </View>
        <Text style={styles.chartDescription}>
          Daily parking violations detected in the district
        </Text>
      </View>

      {/* Vehicle Status Chart Section */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Vehicle Status Breakdown</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={vehicleStatusData}
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
        <Text style={styles.chartDescription}>
          Current distribution of vehicle statuses
        </Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>29</Text>
            <Text style={styles.statLabel}>Total Violations</Text>
            <Text style={styles.statPeriod}>Last 7 days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Active Vehicles</Text>
            <Text style={styles.statPeriod}>Currently tracked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12.5%</Text>
            <Text style={styles.statLabel}>Violation Rate</Text>
            <Text style={styles.statPeriod}>Current period</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4.1</Text>
            <Text style={styles.statLabel}>Avg Daily</Text>
            <Text style={styles.statPeriod}>Violations</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  chartSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  chartDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  statPeriod: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
