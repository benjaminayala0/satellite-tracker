import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../../src/theme/colors.ts';
import { useSatelliteStore } from '../../src/stores/satelliteStore.ts';
import { WorldMap } from '../../src/components/WorldMap.tsx';

export default function OrbitMapScreen() {
  const {
    selectedSatellite,
    currentPosition,
    lookAngles,
    groundTrackSegments,
    footprintRadiusKm,
    observerLocation,
    setObserverLocation,
    isStarlinkLayerActive,
    toggleStarlinkLayer,
    starlinkSwarmPositions,
    isLoading
  } = useSatelliteStore();

  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to calculate satellite passes.');
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setObserverLocation({
        latitude: Math.round(loc.coords.latitude * 10000) / 10000,
        longitude: Math.round(loc.coords.longitude * 10000) / 10000,
        altitudeMeters: Math.round(loc.coords.altitude || 20),
        label: 'My Device GPS'
      });
      Alert.alert('GPS Updated', `Observer set to: ${loc.coords.latitude.toFixed(4)}°, ${loc.coords.longitude.toFixed(4)}°`);
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Could not fetch device GPS');
    } finally {
      setIsLocating(false);
    }
  };

  const isVisibleNow = lookAngles && lookAngles.elevationDeg >= 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedSatellite ? selectedSatellite.name : 'Satellite Tracker'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            NORAD ID: {selectedSatellite?.noradId || '25544'} • SGP4 Local Propagator
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.starlinkToggle,
            { backgroundColor: isStarlinkLayerActive ? colors.secondaryGlow : colors.surfaceLight }
          ]}
          onPress={toggleStarlinkLayer}
        >
          <Ionicons
            name="layers"
            size={14}
            color={isStarlinkLayerActive ? colors.starlinkDot : colors.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.starlinkToggleText,
              { color: isStarlinkLayerActive ? colors.starlinkDot : colors.textMuted }
            ]}
          >
            Starlink
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Telemetry HUD Grid */}
        <View style={styles.telemetryGrid}>
          <View style={styles.telemetryCard}>
            <Text style={styles.telemetryLabel}>Subsatellite Point</Text>
            <Text style={styles.telemetryValue}>
              {currentPosition
                ? `${Math.abs(currentPosition.latitude).toFixed(2)}°${currentPosition.latitude >= 0 ? 'N' : 'S'} ` +
                  `${Math.abs(currentPosition.longitude).toFixed(2)}°${currentPosition.longitude >= 0 ? 'E' : 'W'}`
                : 'Propagating...'}
            </Text>
          </View>

          <View style={styles.telemetryCard}>
            <Text style={styles.telemetryLabel}>Orbital Altitude</Text>
            <Text style={[styles.telemetryValue, { color: colors.primary }]}>
              {currentPosition ? `${currentPosition.altitudeKm} km` : '---'}
            </Text>
          </View>

          <View style={styles.telemetryCard}>
            <Text style={styles.telemetryLabel}>Velocity</Text>
            <Text style={styles.telemetryValue}>
              {currentPosition ? `${currentPosition.velocityKmh.toLocaleString()} km/h` : '---'}
            </Text>
          </View>

          <View style={styles.telemetryCard}>
            <Text style={styles.telemetryLabel}>Local Look Angles</Text>
            <Text
              style={[
                styles.telemetryValue,
                { color: isVisibleNow ? colors.success : colors.textSecondary }
              ]}
            >
              {lookAngles
                ? `${lookAngles.azimuthDeg.toFixed(0)}° Az • ${lookAngles.elevationDeg.toFixed(0)}° El`
                : '---'}
            </Text>
          </View>
        </View>

        {/* Visibility Status Pill */}
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isVisibleNow
                ? 'rgba(0, 230, 118, 0.15)'
                : 'rgba(255, 82, 82, 0.12)',
              borderColor: isVisibleNow ? colors.success : colors.border
            }
          ]}
        >
          <Ionicons
            name={isVisibleNow ? 'radio' : 'radio-outline'}
            size={14}
            color={isVisibleNow ? colors.success : colors.danger}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.statusPillText,
              { color: isVisibleNow ? colors.success : colors.textSecondary }
            ]}
          >
            {isVisibleNow
              ? `SIGNAL IN RANGE (AOS) — Elevation ${lookAngles?.elevationDeg.toFixed(1)}°`
              : `OUT OF SIGHT (LOS) — Below Horizon (${lookAngles?.elevationDeg.toFixed(1)}°)`}
          </Text>
        </View>

        {/* Interactive World Map */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Propagating SGP4 Orbital Coordinates...</Text>
          </View>
        ) : (
          <WorldMap
            currentPosition={currentPosition}
            satelliteName={selectedSatellite?.name}
            groundTrackSegments={groundTrackSegments}
            footprintRadiusKm={footprintRadiusKm}
            observerLocation={observerLocation}
            starlinkSwarm={starlinkSwarmPositions}
            isStarlinkActive={isStarlinkLayerActive}
          />
        )}

        {/* Observer Station Footer Controls */}
        <View style={styles.observerCard}>
          <View style={styles.observerHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location" size={16} color={colors.userLocation} style={{ marginRight: 6 }} />
              <Text style={styles.observerTitle}>Ground Station Observer</Text>
            </View>
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleUseCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Ionicons name="navigate" size={13} color="#000000" style={{ marginRight: 4 }} />
                  <Text style={styles.gpsButtonText}>Use GPS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.observerCoordinates}>
            {observerLocation.label || 'Configured Location'}: {observerLocation.latitude.toFixed(4)}°, {observerLocation.longitude.toFixed(4)}° ({observerLocation.altitudeMeters}m MSL)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 10
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  starlinkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  starlinkToggleText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  scrollContent: {
    paddingBottom: 24
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8
  },
  telemetryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  telemetryLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600'
  },
  telemetryValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 10
  },
  observerCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  observerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  observerTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold'
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  gpsButtonText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold'
  },
  observerCoordinates: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 6
  }
});

