import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors.ts';
import { useSatelliteStore } from '../../src/stores/satelliteStore.ts';
import { CompassView } from '../../src/components/CompassView.tsx';

export default function CompassScreen() {
  const {
    selectedSatellite,
    lookAngles,
    satellites,
    selectSatellite
  } = useSatelliteStore();

  const keySatellites = satellites.filter(s =>
    [25544, 48274, 20580, 44713, 36585].includes(s.noradId)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Antenna Alignment & Compass
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Topocentric Pointing Guide • Azimuth / Elevation
          </Text>
        </View>

        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>SENSORS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Satellite Switcher Bar */}
        <View style={styles.switcherSection}>
          <Text style={styles.switcherLabel}>QUICK TARGET SWITCHER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherScroll}>
            {keySatellites.map((sat) => {
              const isSelected = selectedSatellite?.noradId === sat.noradId;
              return (
                <TouchableOpacity
                  key={`switch_${sat.noradId}`}
                  style={[
                    styles.switcherChip,
                    isSelected && styles.switcherChipActive
                  ]}
                  onPress={() => selectSatellite(sat)}
                >
                  <Text
                    style={[
                      styles.switcherChipText,
                      isSelected && styles.switcherChipTextActive
                    ]}
                  >
                    {sat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Real-time Compass & Reticle Component */}
        <CompassView
          targetAngles={lookAngles}
          satelliteName={selectedSatellite?.name}
        />

        {/* Technical Alignment Guidelines */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.infoTitle}>Antenna Pointing Instructions</Text>
          </View>
          <Text style={styles.infoBody}>
            1. Hold your device flat horizontally to calibrate the geomagnetic azimuth heading.{'\n'}
            2. Rotate your body until the target arrow aligns with the top green reticle.{'\n'}
            3. Tilt your antenna or receiver upwards to match the computed elevation angle ({lookAngles?.elevationDeg.toFixed(0) || '0'}°).{'\n'}
            4. Satellites with negative elevation are currently below the horizon.
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
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4
  },
  liveText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: 'bold'
  },
  scrollContent: {
    paddingBottom: 24
  },
  switcherSection: {
    marginTop: 8,
    paddingHorizontal: 16
  },
  switcherLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  switcherScroll: {
    gap: 8,
    paddingBottom: 4
  },
  switcherChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  switcherChipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary
  },
  switcherChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  switcherChipTextActive: {
    color: colors.primary,
    fontWeight: 'bold'
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold'
  },
  infoBody: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18
  }
});

