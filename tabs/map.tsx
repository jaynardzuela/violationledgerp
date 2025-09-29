import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Button } from 'react-native';
import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import { analyticsStore } from './analytics';

type Vehicle = {
  id: number;
  latitude: number;
  longitude: number;
  isStationary: boolean;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  registrationDate: string;
  lastInspection: string;
  // Violation tracking
  violationStartAt?: number; // epoch ms when violation detected
  warningIssued?: boolean; // whether a warning has been issued
};

type VehicleStatus = {
  id: number;
  status: 'Moving' | 'Parked';
  zone: 'Parking Zone' | 'Non-Parking Zone' | 'General Area' | 'Outside Boundary';
  violation: boolean;
};

const blueRidgeBCoords = [
  { latitude: 14.62004750426467, longitude: 121.07443830194403 },
  { latitude: 14.616393204867702, longitude: 121.07273778141894 },
  { latitude: 14.615929596639097, longitude: 121.07383236912817 },
  { latitude: 14.616265696928444, longitude: 121.07424286284156 },
  { latitude: 14.616462118934791, longitude: 121.07620060208043 },
  { latitude: 14.617658106949442, longitude: 121.0765344101521 },
  { latitude: 14.617863257522814, longitude: 121.07769371656481 },
  { latitude: 14.618500532544994, longitude: 121.07782453324269 },
];

// Parking zones within Blue Ridge B (designated area only)
const parkingZones = [
  {
    id: 1,
    coordinates: [
      { latitude: 14.6162, longitude: 121.0735 },
      { latitude: 14.6166, longitude: 121.0735 },
      { latitude: 14.6166, longitude: 121.0739 },
      { latitude: 14.6162, longitude: 121.0739 },
    ],
  },
  {
    id: 2,
    coordinates: [
      { latitude: 14.6180, longitude: 121.0762 },
      { latitude: 14.6184, longitude: 121.0762 },
      { latitude: 14.6184, longitude: 121.0766 },
      { latitude: 14.6180, longitude: 121.0766 },
    ],
  },
];

// Non-parking zones within Blue Ridge B (designated area only)
const nonParkingZones = [
  {
    id: 1,
    coordinates: [
      { latitude: 14.6168, longitude: 121.0740 },
      { latitude: 14.6172, longitude: 121.0740 },
      { latitude: 14.6172, longitude: 121.0745 },
      { latitude: 14.6168, longitude: 121.0745 },
    ],
  },
  {
    id: 2,
    coordinates: [
      { latitude: 14.6175, longitude: 121.0755 },
      { latitude: 14.6179, longitude: 121.0755 },
      { latitude: 14.6179, longitude: 121.0760 },
      { latitude: 14.6175, longitude: 121.0760 },
    ],
  },
];

// Calculate the bounding box for the Blue Ridge B area to restrict map movement
const getMapBounds = () => {
  const lats = blueRidgeBCoords.map(coord => coord.latitude);
  const lngs = blueRidgeBCoords.map(coord => coord.longitude);
  
  return {
    northEast: {
      latitude: Math.max(...lats) + 0.002, // Add small buffer
      longitude: Math.max(...lngs) + 0.002,
    },
    southWest: {
      latitude: Math.min(...lats) - 0.002,
      longitude: Math.min(...lngs) - 0.002,
    },
  };
};

// Function to check if a point is inside a polygon
const isPointInPolygon = (point: { latitude: number; longitude: number }, polygon: { latitude: number; longitude: number }[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      polygon[i].longitude > point.longitude !== polygon[j].longitude > point.longitude &&
      point.latitude < ((polygon[j].latitude - polygon[i].latitude) * (point.longitude - polygon[i].longitude)) / (polygon[j].longitude - polygon[i].longitude) + polygon[i].latitude
    ) {
      inside = !inside;
    }
  }
  return inside;
};

// Function to determine vehicle zone and status
const getVehicleStatus = (vehicle: Vehicle): VehicleStatus => {
  const status: VehicleStatus = {
    id: vehicle.id,
    status: vehicle.isStationary ? 'Parked' : 'Moving',
    zone: 'General Area',
    violation: false,
  };

  // Check if vehicle is in Blue Ridge B boundary
  const isInBoundary = isPointInPolygon(vehicle, blueRidgeBCoords);
  
  if (!isInBoundary) {
    status.zone = 'Outside Boundary';
    return status;
  }

  // Check if vehicle is in parking zones
  for (const zone of parkingZones) {
    if (isPointInPolygon(vehicle, zone.coordinates)) {
      status.zone = 'Parking Zone';
      return status;
    }
  }

  // Check if vehicle is in non-parking zones
  for (const zone of nonParkingZones) {
    if (isPointInPolygon(vehicle, zone.coordinates)) {
      status.zone = 'Non-Parking Zone';
      if (vehicle.isStationary) {
        status.violation = true;
      }
      return status;
    }
  }

  return status;
};

// Helper to format duration mm:ss
const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function Map() {
  const mapRef = useRef<MapView | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    // Moving vehicles
    { 
      id: 1, 
      latitude: 14.6170, 
      longitude: 121.0750, 
      isStationary: false,
      plateNumber: 'ABC-1234',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Silver',
      ownerName: 'John Smith',
      ownerPhone: '+63 912 345 6789',
      ownerEmail: 'john.smith@email.com',
      registrationDate: '2020-03-15',
      lastInspection: '2024-01-10'
    },
    { 
      id: 2, 
      latitude: 14.6180, 
      longitude: 121.0760, 
      isStationary: false,
      plateNumber: 'XYZ-5678',
      make: 'Honda',
      model: 'Civic',
      year: 2019,
      color: 'Blue',
      ownerName: 'Maria Garcia',
      ownerPhone: '+63 917 890 1234',
      ownerEmail: 'maria.garcia@email.com',
      registrationDate: '2019-07-22',
      lastInspection: '2023-12-05'
    },
    // Stationary vehicles in parking zones
    { 
      id: 3, 
      latitude: 14.6164, 
      longitude: 121.0737, 
      isStationary: true,
      plateNumber: 'DEF-9012',
      make: 'Ford',
      model: 'Focus',
      year: 2021,
      color: 'Red',
      ownerName: 'Robert Johnson',
      ownerPhone: '+63 918 234 5678',
      ownerEmail: 'robert.johnson@email.com',
      registrationDate: '2021-05-10',
      lastInspection: '2024-02-15'
    },
    { 
      id: 4, 
      latitude: 14.6165, 
      longitude: 121.0738, 
      isStationary: true,
      plateNumber: 'GHI-3456',
      make: 'Nissan',
      model: 'Altima',
      year: 2018,
      color: 'Black',
      ownerName: 'Sarah Wilson',
      ownerPhone: '+63 919 456 7890',
      ownerEmail: 'sarah.wilson@email.com',
      registrationDate: '2018-11-30',
      lastInspection: '2023-11-20'
    },
    { 
      id: 5, 
      latitude: 14.6182, 
      longitude: 121.0764, 
      isStationary: true,
      plateNumber: 'JKL-7890',
      make: 'Hyundai',
      model: 'Elantra',
      year: 2022,
      color: 'White',
      ownerName: 'Michael Brown',
      ownerPhone: '+63 920 678 9012',
      ownerEmail: 'michael.brown@email.com',
      registrationDate: '2022-01-15',
      lastInspection: '2024-03-01'
    },
    { 
      id: 6, 
      latitude: 14.6183, 
      longitude: 121.0765, 
      isStationary: true,
      plateNumber: 'MNO-2345',
      make: 'Mazda',
      model: 'CX-5',
      year: 2020,
      color: 'Gray',
      ownerName: 'Lisa Davis',
      ownerPhone: '+63 921 890 1234',
      ownerEmail: 'lisa.davis@email.com',
      registrationDate: '2020-09-08',
      lastInspection: '2023-10-12'
    },
    // Test vehicle parked in non-parking zone (for demonstration)
    { 
      id: 7, 
      latitude: 14.6170, 
      longitude: 121.0742, 
      isStationary: true,
      plateNumber: 'PQR-6789',
      make: 'BMW',
      model: 'X3',
      year: 2021,
      color: 'Black',
      ownerName: 'David Martinez',
      ownerPhone: '+63 922 123 4567',
      ownerEmail: 'david.martinez@email.com',
      registrationDate: '2021-04-20',
      lastInspection: '2024-01-25'
    },
  ]);
  const [violations, setViolations] = useState<number[]>([]);
  const previousViolationsRef = useRef<number[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchPlate, setSearchPlate] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Moving' | 'Parked' | 'Violating'>('All');
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);
  const [tick, setTick] = useState(0); // used to refresh durations
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const didFitRef = useRef(false);

  // Simple in-app toast (non-disruptive)
  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2500);
  };

  // Issue warning handler
  const handleIssueWarning = (vehicleId: number) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return { ...v, warningIssued: true, violationStartAt: v.violationStartAt ?? Date.now() };
      }
      return v;
    }));
    // keep selectedVehicle in sync if open
    setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, warningIssued: true, violationStartAt: prev.violationStartAt ?? Date.now() } : prev));
    showToast(`⚠️ Warning issued to Vehicle ${vehicleId}`);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // Ticking timer to refresh durations shown in UI
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Center the map around the approximate middle of the polygon
  const initialRegion: Region = {
    latitude: 14.6177,
    longitude: 121.0753,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  // Simulate vehicles moving every 2s (only non-stationary vehicles)
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.isStationary) {
            return v; // Don't move stationary vehicles
          }
          return {
            ...v,
            latitude: v.latitude + (Math.random() - 0.5) * 0.0002,
            longitude: v.longitude + (Math.random() - 0.5) * 0.0002,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Check for violations whenever vehicles change
  useEffect(() => {
    const currentViolations: number[] = [];

    let changed = false;
    const updatedVehicles = vehicles.map((vehicle) => {
      const status = getVehicleStatus(vehicle);
      if (status.violation) {
        currentViolations.push(vehicle.id);
        // Set start time if first detected
        const startAt = vehicle.violationStartAt ?? Date.now();
        const ms = Date.now() - startAt;
        // Issue warning after 2 minutes (demo threshold)
        const shouldWarn = ms >= 2 * 60 * 1000;
        const nextWarning = vehicle.warningIssued ? true : shouldWarn;

        if (vehicle.violationStartAt !== startAt || vehicle.warningIssued !== nextWarning) {
          changed = true;
          return { ...vehicle, violationStartAt: startAt, warningIssued: nextWarning };
        }
        return vehicle;
      } else {
        // Clear tracking if no longer violating
        if (vehicle.violationStartAt !== undefined || vehicle.warningIssued) {
          changed = true;
          return { ...vehicle, violationStartAt: undefined, warningIssued: false };
        }
        return vehicle;
      }
    });

    // Only update vehicles if something actually changed to avoid loops
    if (changed) {
      setVehicles(updatedVehicles);
    }

    // Check for new violations using ref to avoid dependency issues
    const newViolations = currentViolations.filter(id => !previousViolationsRef.current.includes(id));
    if (newViolations.length > 0) {
      newViolations.forEach(id => {
        // Non-disruptive toast instead of modal alert
        showToast(`🚨 Vehicle ${id} parked in a non-parking zone`);
      });
    }
    setViolations(currentViolations);
    previousViolationsRef.current = currentViolations;
  }, [vehicles]);

  // Function to handle vehicle selection
  const handleVehiclePress = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setBottomSheetVisible(true);
  };

  // Function to search for vehicle by plate number
  const handleSearch = () => {
    const foundVehicle = vehicles.find(vehicle => 
      vehicle.plateNumber.toLowerCase() === searchPlate.toLowerCase()
    );
    
    if (foundVehicle) {
      // Center map on the found vehicle
      mapRef.current?.animateToRegion({
        latitude: foundVehicle.latitude,
        longitude: foundVehicle.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
      
      // Open modal with vehicle details
      setSelectedVehicle(foundVehicle);
      setBottomSheetVisible(true);
      
      // Clear search input
      setSearchPlate('');
    } else {
      Alert.alert("Not found", "No vehicle with that plate number");
    }
  };

  // Sort vehicles with violators at the top
  const sortedVehicles = vehicles.sort((a, b) => {
    const statusA = getVehicleStatus(a);
    const statusB = getVehicleStatus(b);
    
    // Violators first
    if (statusA.violation && !statusB.violation) return -1;
    if (!statusA.violation && statusB.violation) return 1;
    
    // Then by status (Parked before Moving)
    if (statusA.status === 'Parked' && statusB.status === 'Moving') return -1;
    if (statusA.status === 'Moving' && statusB.status === 'Parked') return 1;
    
    // Finally by ID
    return a.id - b.id;
  });

  // Function to simulate random vehicle movement
  const handleSimulation = () => {
    setVehicles(prevVehicles => 
      prevVehicles.map(vehicle => {
        // Generate random offset within the Blue Ridge B boundary
        const latOffset = (Math.random() - 0.5) * 0.003; // ±0.0015 degrees
        const lngOffset = (Math.random() - 0.5) * 0.003; // ±0.0015 degrees
        
        const newLat = Math.max(14.6159, Math.min(14.6200, vehicle.latitude + latOffset));
        const newLng = Math.max(121.0727, Math.min(121.0778, vehicle.longitude + lngOffset));
        
        return {
          ...vehicle,
          latitude: newLat,
          longitude: newLng,
        };
      })
    );
  };

  // Function to filter vehicles based on active filter
  const getFilteredVehicles = () => {
    switch (activeFilter) {
      case 'Moving':
        return vehicles.filter(vehicle => !vehicle.isStationary);
      case 'Parked':
        return vehicles.filter(vehicle => vehicle.isStationary && !getVehicleStatus(vehicle).violation);
      case 'Violating':
        return vehicles.filter(vehicle => getVehicleStatus(vehicle).violation);
      default:
        return vehicles;
    }
  };

  const filteredVehicles = getFilteredVehicles();

  // Only show in-boundary vehicles in the status lists (hide those outside)
  const inBoundaryVehicles = vehicles.filter(v => isPointInPolygon(v, blueRidgeBCoords));

  // Vehicles to render on the map: apply UI filter + boundary constraint
  const mapVehicles = filteredVehicles.filter(v => isPointInPolygon(v, blueRidgeBCoords));

  // Live analytics derived data (in-boundary only)
  const totalInBoundary = inBoundaryVehicles.length;
  const movingCount = inBoundaryVehicles.filter(v => !v.isStationary).length;
  const parkedCount = inBoundaryVehicles.filter(v => v.isStationary && !getVehicleStatus(v).violation).length;
  const violatingCount = inBoundaryVehicles.filter(v => getVehicleStatus(v).violation).length;
  const warningsCount = inBoundaryVehicles.filter(v => v.warningIssued).length;
  const violationDurations = inBoundaryVehicles
    .filter(v => v.violationStartAt)
    .map(v => Date.now() - (v.violationStartAt as number));
  const avgViolationMs = violationDurations.length > 0
    ? Math.round(violationDurations.reduce((a, b) => a + b, 0) / violationDurations.length)
    : 0;
  const avgViolationText = formatDuration(avgViolationMs);

  // Publish live metrics
  useEffect(() => {
    analyticsStore.publish({
      timestamp: Date.now(),
      totalInBoundary,
      movingCount,
      parkedCount,
      violatingCount,
      warningsCount,
      avgViolationMs,
    });
  }, [totalInBoundary, movingCount, parkedCount, violatingCount, warningsCount, avgViolationMs]);

  return (
    <View style={styles.container}>
      {/* Map Section - 50% of screen */}
      <View style={styles.mapContainer}>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {(['All', 'Moving', 'Parked', 'Violating'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === filter && styles.activeFilterButtonText
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter plate number (e.g., ABC-1234)"
            value={searchPlate}
            onChangeText={setSearchPlate}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          minZoomLevel={16} // prevent zooming too far out
          maxZoomLevel={19} // prevent excessive zooming in
          mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          showsPointsOfInterest={false}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          onLayout={() => {
            if (mapRef.current && !didFitRef.current) {
              didFitRef.current = true;
              mapRef.current.fitToCoordinates(blueRidgeBCoords, {
                edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                animated: false,
              });
            }
          }}
        >
          {/* Draw boundary polygon */}
          <Polygon
            coordinates={blueRidgeBCoords}
            fillColor="rgba(255, 255, 0, 0.3)" // More prominent yellow fill
            strokeColor="red"
            strokeWidth={3}
          />

          {/* Parking zones */}
          {parkingZones.map((zone) => (
            <Polygon
              key={`parking-${zone.id}`}
              coordinates={zone.coordinates}
              fillColor="rgba(0, 255, 0, 0.4)" // More prominent green fill
              strokeColor="green"
              strokeWidth={2}
            />
          ))}

          {/* Non-parking zones */}
          {nonParkingZones.map((zone) => (
            <Polygon
              key={`no-parking-${zone.id}`}
              coordinates={zone.coordinates}
              fillColor="rgba(255, 0, 0, 0.4)" // More prominent red fill
              strokeColor="red"
              strokeWidth={2}
            />
          ))}

          {/* Mock vehicles */}
          {mapVehicles.map((v) => (
            <Marker
              key={v.id}
              coordinate={{ latitude: v.latitude, longitude: v.longitude }}
              title={`Vehicle ${v.id}`}
              description={v.isStationary ? 'Stationary (Parked)' : 'Moving'}
              pinColor={v.isStationary ? 'green' : 'blue'}
            />
          ))}
        </MapView>

        {/* Toast */}
        {toastMessage && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* Legend Overlay */}
        <View style={styles.legendContainer}>
          <TouchableOpacity 
            style={styles.legendToggle}
            onPress={() => setLegendVisible(!legendVisible)}
          >
            <Text style={styles.legendToggleText}>
              {legendVisible ? '▼' : '▲'} Legend
            </Text>
          </TouchableOpacity>
          
          {legendVisible && (
            <View style={styles.legendContent}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: 'rgba(0, 255, 0, 0.4)' }]} />
                <Text style={styles.legendText}>🟢 Parking Zone</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 0, 0, 0.4)' }]} />
                <Text style={styles.legendText}>🔴 No Parking Zone</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
                <Text style={styles.legendText}>🔵 Moving Vehicle</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#34C759' }]} />
                <Text style={styles.legendText}>🟢 Parked Vehicle</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendText}>🚨 Violation</Text>
              </View>
            </View>
          )}
        </View>

        {/* Simulation Button */}
        <TouchableOpacity style={styles.simulationButton} onPress={handleSimulation}>
          <Text style={styles.simulationButtonText}>🎲 Simulate</Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle List Section - 50% of screen */}
      <View style={styles.vehicleListContainer}>
        <ScrollView style={styles.vehicleList}>
          <Text style={styles.vehicleListTitle}>Vehicle Status</Text>
          
          {(() => {
            const violators = inBoundaryVehicles.filter((vehicle: Vehicle) => getVehicleStatus(vehicle).violation)
              .sort((a: Vehicle, b: Vehicle) => a.id - b.id);
            const nonViolators = inBoundaryVehicles.filter((vehicle: Vehicle) => !getVehicleStatus(vehicle).violation)
              .sort((a: Vehicle, b: Vehicle) => a.id - b.id);
            return (
              <>
                {/* Violators Section */}
                {violators.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>🚨 VIOLATIONS ({violators.length})</Text>
                    </View>
                    {violators.map((vehicle: Vehicle) => {
                      const status = getVehicleStatus(vehicle);
                      const durationText = vehicle.violationStartAt ? formatDuration(Date.now() - vehicle.violationStartAt) : '00:00';
                      return (
                        <TouchableOpacity
                          key={vehicle.id}
                          style={[styles.vehicleItem, styles.violationItem]}
                          onPress={() => handleVehiclePress(vehicle)}
                        >
                          <View style={styles.vehicleHeader}>
                            <Text style={styles.vehicleId}>{vehicle.plateNumber} - {vehicle.make} {vehicle.model}</Text>
                            <View style={[styles.statusBadge, styles.parkedBadge]}>
                              <Text style={styles.statusText}>{status.status}</Text>
                            </View>
                          </View>
                          <Text style={styles.zoneText}>Zone: {status.zone}</Text>
                          <Text style={styles.zoneText}>Duration: {durationText}</Text>
                          <Text style={styles.zoneText}>Warning Issued: {vehicle.warningIssued ? 'Yes' : 'No'}</Text>
                          {!vehicle.warningIssued && (
                            <TouchableOpacity
                              style={styles.warningButton}
                              onPress={() => handleIssueWarning(vehicle.id)}
                            >
                              <Text style={styles.warningButtonText}>Issue Warning</Text>
                            </TouchableOpacity>
                          )}
                          <Text style={styles.violationText}>🚨 VIOLATION: Parked in Non-Parking Zone!</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

                {/* Non-Violators Section */}
                {nonViolators.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>✅ COMPLIANT VEHICLES ({nonViolators.length})</Text>
                    </View>
                    {nonViolators.map((vehicle: Vehicle) => {
                      const status = getVehicleStatus(vehicle);
                      return (
                        <TouchableOpacity
                          key={vehicle.id}
                          style={styles.vehicleItem}
                          onPress={() => handleVehiclePress(vehicle)}
                        >
                          <View style={styles.vehicleHeader}>
                            <Text style={styles.vehicleId}>{vehicle.plateNumber} - {vehicle.make} {vehicle.model}</Text>
                            <View style={[
                              styles.statusBadge,
                              status.status === 'Moving' ? styles.movingBadge : styles.parkedBadge
                            ]}>
                              <Text style={styles.statusText}>{status.status}</Text>
                            </View>
                          </View>
                          <Text style={styles.zoneText}>Zone: {status.zone}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </>
            );
          })()}
        </ScrollView>
      </View>

      {/* Bottom Sheet */}
      {bottomSheetVisible && selectedVehicle && (
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity 
            style={styles.bottomSheetBackdrop}
            onPress={() => setBottomSheetVisible(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <ScrollView style={styles.bottomSheetContent}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Vehicle Details</Text>
                <TouchableOpacity
                  style={styles.bottomSheetCloseButton}
                  onPress={() => setBottomSheetVisible(false)}
                >
                  <Text style={styles.bottomSheetCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {/* Vehicle Information */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionLabel}>🚗 Vehicle Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Plate Number:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.plateNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Make & Model:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.make} {selectedVehicle.model}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Year:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.year}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Color:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.color}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Registration Date:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.registrationDate}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last Inspection:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.lastInspection}</Text>
                </View>
              </View>

              {/* Owner Information */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionLabel}>👤 Owner Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.ownerName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.ownerPhone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.ownerEmail}</Text>
                </View>
              </View>

              {/* Current Status */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionLabel}>📍 Current Status</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={styles.infoValue}>{selectedVehicle.isStationary ? 'Parked' : 'Moving'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Zone:</Text>
                  <Text style={styles.infoValue}>{getVehicleStatus(selectedVehicle).zone}</Text>
                </View>
                {getVehicleStatus(selectedVehicle).violation && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Duration:</Text>
                      <Text style={styles.infoValue}>
                        {selectedVehicle.violationStartAt ? formatDuration(Date.now() - selectedVehicle.violationStartAt) : '00:00'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Warning Issued:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.infoValue, { flex: 0, textAlign: 'right', marginRight: 8 }]}>
                          {selectedVehicle.warningIssued ? 'Yes' : 'No'}
                        </Text>
                        {!selectedVehicle.warningIssued && (
                          <TouchableOpacity
                            style={styles.warningButton}
                            onPress={() => handleIssueWarning(selectedVehicle.id)}
                          >
                            <Text style={styles.warningButtonText}>Issue Warning</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </>
                )}
                {getVehicleStatus(selectedVehicle).violation && (
                  <View style={styles.violationAlert}>
                    <Text style={styles.violationAlertText}>🚨 PARKING VIOLATION DETECTED!</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    flexDirection: 'column',
  },
  mapContainer: {
    height: '50%', // Fixed 50% of screen height
  },
  map: { 
    flex: 1,
  },
  vehicleListContainer: {
    height: '50%', // Fixed 50% of screen height
    backgroundColor: 'white',
    borderTopWidth: 2,
    borderTopColor: '#e9ecef',
  },
  vehicleList: {
    flex: 1,
    padding: 16,
  },
  vehicleListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  vehicleItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  violationItem: {
    backgroundColor: '#fff5f5',
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  movingBadge: {
    backgroundColor: '#007AFF',
  },
  parkedBadge: {
    backgroundColor: '#34C759',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  zoneText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  violationText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  sectionHeader: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  violationAlert: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    marginTop: 8,
  },
  violationAlertText: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  legendContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 120,
  },
  legendToggle: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  legendToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  legendContent: {
    padding: 8,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  simulationButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  simulationButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomSheetCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetCloseButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  warningButton: {
    marginTop: 6,
    backgroundColor: '#FF9500',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  warningButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
