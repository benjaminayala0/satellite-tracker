import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors.ts';
import { useSatelliteStore } from '../../src/stores/satelliteStore.ts';
import { initSatrec, getGeodeticPosition } from '../../src/algorithms/orbitalMath.ts';

interface ValidationLogEntry {
  timestamp: string;
  source: string;
  localLat: number;
  localLon: number;
  remoteLat: number;
  remoteLon: number;
  errorKm: number;
}

export default function ValidationScreen() {
  const {
    satellites,
    validationTelemetry,
    validationErrorKm,
    isValidating,
    runCrossValidation
  } = useSatelliteStore();

  const [validationHistory, setValidationHistory] = useState<ValidationLogEntry[]>([]);

  useEffect(() => {
    // Initial validation check
    runCrossValidation();
  }, []);

  useEffect(() => {
    if (validationTelemetry && validationErrorKm !== null) {
      const issSat = satellites.find(s => s.noradId === 25544);
      if (issSat) {
        const satrec = initSatrec(issSat.tleLine1, issSat.tleLine2);
        const localPos = getGeodeticPosition(satrec, new Date(validationTelemetry.timestamp));
        if (localPos) {
          const entry: ValidationLogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            source: validationTelemetry.source,
            localLat: localPos.latitude,
            localLon: localPos.longitude,
            remoteLat: validationTelemetry.latitude,
            remoteLon: validationTelemetry.longitude,
            errorKm: validationErrorKm
          };

          setValidationHistory((prev) => [entry, ...prev.slice(0, 7)]);
        }
      }
    }
  }, [validationTelemetry, validationErrorKm]);

  const issSat = satellites.find(s => s.noradId === 25544);
  const localPos =
    issSat && validationTelemetry
      ? getGeodeticPosition(initSatrec(issSat.tleLine1, issSat.tleLine2), new Date(validationTelemetry.timestamp))
      : null;

  const latDelta =
    localPos && validationTelemetry
      ? Math.abs(localPos.latitude - validationTelemetry.latitude).toFixed(3)
      : '0.000';

  const lonDelta =
    localPos && validationTelemetry
      ? Math.abs(localPos.longitude - validationTelemetry.longitude).toFixed(3)
      : '0.000';

  const altDelta =
    localPos && validationTelemetry
      ? Math.abs(localPos.altitudeKm - validationTelemetry.altitudeKm).toFixed(1)
      : '0.0';

  let accuracyRating = 'EXCELLENT';
  let ratingColor = colors.success;

  if (validationErrorKm !== null) {
    if (validationErrorKm > 100) {
      accuracyRating = 'DEGRADED';
      ratingColor = colors.danger;
    } else if (validationErrorKm > 35) {
      accuracyRating = 'NOMINAL';
      ratingColor = colors.warning;
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Scientific Cross-Validation
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Local SGP4 Propagator vs WhereTheISS API Telemetry (NORAD 25544)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.runButton}
          onPress={() => runCrossValidation()}
          disabled={isValidating}
        >
          {isValidating ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Ionicons name="refresh" size={14} color="#000000" style={{ marginRight: 4 }} />
              <Text style={styles.runButtonText}>Verify</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Error Gauge Card */}
        <View style={styles.gaugeCard}>
          <Text style={styles.gaugeLabel}>OBSERVED GEODETIC POSITION ERROR</Text>
          <View style={styles.errorMetricRow}>
            <Text style={[styles.errorValue, { color: ratingColor }]}>
              {validationErrorKm !== null ? `${validationErrorKm.toFixed(1)}` : '---'}
            </Text>
            <Text style={[styles.errorUnit, { color: ratingColor }]}> km</Text>
          </View>

          <View style={[styles.ratingPill, { borderColor: ratingColor }]}>
            <View style={[styles.ratingDot, { backgroundColor: ratingColor }]} />
            <Text style={[styles.ratingText, { color: ratingColor }]}>
              {accuracyRating} CONVERGENCE (SGP4 WGS-84)
            </Text>
          </View>

          <Text style={styles.gaugeNote}>
            Calculated via Great-Circle Haversine Formula between client local SGP4/SDP4 mathematical
            propagation and independent ground telemetry anchor.
          </Text>
        </View>

        {/* Side-by-Side Comparison Table */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Comparative Telemetry Matrix</Text>

          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.2 }]}>Metric</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.4 }]}>Local SGP4</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.4 }]}>WhereTheISS</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>Delta</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.metricName, { flex: 1.2 }]}>Latitude</Text>
            <Text style={[styles.tableCell, { flex: 1.4 }]}>{localPos ? `${localPos.latitude.toFixed(3)}°` : '---'}</Text>
            <Text style={[styles.tableCell, { flex: 1.4 }]}>{validationTelemetry ? `${validationTelemetry.latitude.toFixed(3)}°` : '---'}</Text>
            <Text style={[styles.tableCell, styles.deltaCell, { flex: 1 }]}>{latDelta}°</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.metricName, { flex: 1.2 }]}>Longitude</Text>
            <Text style={[styles.tableCell, { flex: 1.4 }]}>{localPos ? `${localPos.longitude.toFixed(3)}°` : '---'}</Text>
            <Text style={[styles.tableCell, { flex: 1.4 }]}>{validationTelemetry ? `${validationTelemetry.longitude.toFixed(3)}°` : '---'}</Text>
            <Text style={[styles.tableCell, styles.deltaCell, { flex: 1 }]}>{lonDelta}°</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.metricName, { flex: 1.2 }]}>Altitude</Text>
            <Text style={[styles.tableCell, { flex: 1.4 }]}>{localPos ? `${localPos.altitudeKm} km` : '---'}</Text>
            <Text style={[styles.tableCell, { flex: 1.4 }]}>{validationTelemetry ? `${validationTelemetry.altitudeKm.toFixed(1)} km` : '---'}</Text>
            <Text style={[styles.tableCell, styles.deltaCell, { flex: 1 }]}>{altDelta} km</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.metricName, { flex: 1.2 }]}>Data Source</Text>
            <Text style={[styles.tableCell, { flex: 1.4, fontSize: 10, color: colors.primary }]}>CelesTrak TLE</Text>
            <Text style={[styles.tableCell, { flex: 1.4, fontSize: 10, color: colors.textSecondary }]}>REST Gateway</Text>
            <Text style={[styles.tableCell, styles.deltaCell, { flex: 1 }]}>WGS-84</Text>
          </View>
        </View>

        {/* Verification History Log */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Validation Audit Log ({validationHistory.length})</Text>
          <Text style={styles.historySubtitle}>Documented verification runs for deliverable report</Text>

          {validationHistory.map((entry, idx) => (
            <View key={`log_${idx}`} style={styles.historyItem}>
              <View style={styles.historyTopRow}>
                <Text style={styles.historyTime}>{entry.timestamp}</Text>
                <Text
                  style={[
                    styles.historyError,
                    { color: entry.errorKm < 35 ? colors.success : colors.warning }
                  ]}
                >
                  Δ {entry.errorKm.toFixed(2)} km
                </Text>
              </View>
              <Text style={styles.historyDetails}>
                Local: ({entry.localLat.toFixed(2)}°, {entry.localLon.toFixed(2)}°) • Remote: ({entry.remoteLat.toFixed(2)}°, {entry.remoteLon.toFixed(2)}°)
              </Text>
            </View>
          ))}
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
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 2
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  runButtonText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold'
  },
  scrollContent: {
    paddingBottom: 24
  },
  gaugeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  gaugeLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8
  },
  errorMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4
  },
  errorValue: {
    fontSize: 44,
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  errorUnit: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2
  },
  ratingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  gaugeNote: {
    color: colors.textMuted,
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 10
  },
  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  tableTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#121F33'
  },
  tableCell: {
    fontSize: 11,
    color: colors.textPrimary
  },
  tableHeaderCell: {
    color: colors.textMuted,
    fontWeight: 'bold',
    fontSize: 10
  },
  metricName: {
    color: colors.textSecondary,
    fontWeight: '600'
  },
  deltaCell: {
    color: colors.warning,
    fontWeight: 'bold'
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  historyTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold'
  },
  historySubtitle: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginBottom: 8
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#121F33'
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  historyTime: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  historyError: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  historyDetails: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 2
  }
});

