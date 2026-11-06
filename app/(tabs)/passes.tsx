import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors.ts';
import { useSatelliteStore } from '../../src/stores/satelliteStore.ts';
import { SkyChart } from '../../src/components/SkyChart.tsx';
import type { PassPrediction } from '../../src/types/satellite.ts';

export default function PassesScreen() {
  const {
    selectedSatellite,
    upcomingPasses,
    lookAngles,
    minElevationDeg,
    setMinElevationDeg,
    scheduledPassIds,
    togglePassReminder,
    observerLocation
  } = useSatelliteStore();

  const [activePassIndex, setActivePassIndex] = useState<number>(0);

  const activePass =
    upcomingPasses.length > 0
      ? upcomingPasses[Math.min(activePassIndex, upcomingPasses.length - 1)]
      : null;

  const handleReminderToggle = async (pass: PassPrediction) => {
    const isNowScheduled = await togglePassReminder(pass);
    Alert.alert(
      isNowScheduled ? 'Pass Reminder Set' : 'Reminder Cancelled',
      isNowScheduled
        ? `You will be alerted 5 minutes before AOS for ${pass.satelliteName} (Peak ${pass.maxElevationDeg}°).`
        : 'Notification alert removed.'
    );
  };

  const renderPassCard = ({ item, index }: { item: PassPrediction; index: number }) => {
    const isSelected = index === activePassIndex;
    const isScheduled = Boolean(scheduledPassIds[item.id]);

    const dateStr = new Date(item.aosTimestamp).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const aosTimeStr = new Date(item.aosTimestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const losTimeStr = new Date(item.losTimestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    let elColor = colors.warning;
    if (item.maxElevationDeg >= 60) elColor = colors.success;
    else if (item.maxElevationDeg < 25) elColor = colors.textMuted;

    return (
      <TouchableOpacity
        style={[styles.passCard, isSelected && styles.passCardActive]}
        onPress={() => setActivePassIndex(index)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTopRow}>
          <View>
            <Text style={styles.cardDate}>{dateStr}</Text>
            <Text style={styles.cardTime}>
              {aosTimeStr} — {losTimeStr} ({Math.round(item.durationSeconds / 60)} min)
            </Text>
          </View>

          <View style={styles.cardRightControls}>
            <View style={[styles.elevationBadge, { borderColor: elColor }]}>
              <Text style={[styles.elevationBadgeText, { color: elColor }]}>
                {item.maxElevationDeg}° MAX
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.reminderButton,
                isScheduled && { backgroundColor: colors.warning }
              ]}
              onPress={() => handleReminderToggle(item)}
            >
              <Ionicons
                name={isScheduled ? 'notifications' : 'notifications-outline'}
                size={16}
                color={isScheduled ? '#000000' : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardTrajectoryText}>
            AOS {item.aosAzimuthDeg}° → Peak {item.maxAzimuthDeg}° → LOS {item.losAzimuthDeg}°
          </Text>

          <View style={styles.visibilityPill}>
            <Ionicons
              name={item.isOpticallyVisible ? 'eye-outline' : 'radio-outline'}
              size={12}
              color={item.isOpticallyVisible ? colors.primary : colors.textMuted}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.visibilityText,
                { color: item.isOpticallyVisible ? colors.primary : colors.textMuted }
              ]}
            >
              {item.visibilityType}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Pass Predictions & Sky Chart
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {selectedSatellite?.name || 'Satellite'} • {observerLocation.label || 'Observer'}
          </Text>
        </View>

        {/* Min Elevation Filter Selector */}
        <View style={styles.thresholdSelector}>
          {[10, 20, 30].map((deg) => (
            <TouchableOpacity
              key={`mask_${deg}`}
              style={[
                styles.thresholdButton,
                minElevationDeg === deg && styles.thresholdButtonActive
              ]}
              onPress={() => setMinElevationDeg(deg)}
            >
              <Text
                style={[
                  styles.thresholdButtonText,
                  minElevationDeg === deg && { color: '#000000' }
                ]}
              >
                {deg}°
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sky Chart Polar Radar */}
        <SkyChart
          pass={activePass}
          currentLookAngles={lookAngles}
        />

        {/* Upcoming Passes List Header */}
        <View style={styles.listSectionHeader}>
          <Text style={styles.listSectionTitle}>
            Upcoming Passes ({upcomingPasses.length})
          </Text>
          <Text style={styles.listSectionSubtitle}>Tap a pass to inspect sky arc</Text>
        </View>

        {upcomingPasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="telescope-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Passes Detected</Text>
            <Text style={styles.emptySubtitle}>
              No passes above {minElevationDeg}° elevation threshold for the next 72 hours.
            </Text>
          </View>
        ) : (
          upcomingPasses.map((passItem, index) => (
            <View key={passItem.id}>
              {renderPassCard({ item: passItem, index })}
            </View>
          ))
        )}
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
  thresholdSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2
  },
  thresholdButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  thresholdButtonActive: {
    backgroundColor: colors.primary
  },
  thresholdButtonText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold'
  },
  scrollContent: {
    paddingBottom: 24
  },
  listSectionHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8
  },
  listSectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold'
  },
  listSectionSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1
  },
  passCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  passCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardDate: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold'
  },
  cardTime: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  cardRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  elevationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  elevationBadgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  reminderButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  cardTrajectoryText: {
    color: colors.textMuted,
    fontSize: 10.5
  },
  visibilityPill: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  visibilityText: {
    fontSize: 10.5,
    fontWeight: '600'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4
  }
});

