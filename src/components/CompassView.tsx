import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import Svg, { Circle, Line, Polygon, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors.ts';
import type { LookAngles } from '../types/satellite.ts';

interface CompassViewProps {
  targetAngles: LookAngles | null;
  satelliteName?: string;
}

export const CompassView: React.FC<CompassViewProps> = ({
  targetAngles,
  satelliteName = 'Satellite'
}) => {
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(true);

  useEffect(() => {
    let subscription: any = null;

    if (Platform.OS !== 'web') {
      Magnetometer.isAvailableAsync().then((avail) => {
        setSensorAvailable(avail);
        if (avail) {
          Magnetometer.setUpdateInterval(100);
          subscription = Magnetometer.addListener((data) => {
            let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
            if (angle < 0) angle += 360;
            setDeviceHeading(Math.round(angle));
          });
        }
      });
    }

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const size = Math.min(Dimensions.get('window').width - 48, 280);
  const center = size / 2;
  const radius = center - 24;

  const targetAz = targetAngles ? targetAngles.azimuthDeg : 0;
  const targetEl = targetAngles ? targetAngles.elevationDeg : 0;

  // Heading difference: positive = turn right, negative = turn left
  let headingDiff = targetAz - deviceHeading;
  while (headingDiff > 180) headingDiff -= 360;
  while (headingDiff < -180) headingDiff += 360;

  const isAligned = Math.abs(headingDiff) <= 6;
  const isAboveHorizon = targetEl >= 0;

  return (
    <View style={styles.container}>
      {/* Target Status Card */}
      <View style={styles.targetBanner}>
        <View style={styles.targetBannerLeft}>
          <Text style={styles.targetLabel}>TARGET BEACON</Text>
          <Text style={styles.targetName}>{satelliteName}</Text>
        </View>
        <View style={styles.targetMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Azimuth</Text>
            <Text style={styles.metricValue}>{targetAz.toFixed(0)}°</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Elevation</Text>
            <Text
              style={[
                styles.metricValue,
                { color: isAboveHorizon ? colors.success : colors.danger }
              ]}
            >
              {targetEl.toFixed(0)}°
            </Text>
          </View>
        </View>
      </View>

      {/* Rotating SVG Compass Dial */}
      <View style={styles.dialContainer}>
        <Svg width={size} height={size}>
          {/* Outer Housing */}
          <Circle cx={center} cy={center} r={radius} fill="#091322" stroke="#1A2D4A" strokeWidth="2" />
          <Circle cx={center} cy={center} r={radius - 8} fill="none" stroke="#122036" strokeWidth="1" strokeDasharray="3,3" />

          {/* Compass Rose Tick Marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = ((deg - deviceHeading) * Math.PI) / 180;
            const x1 = center + (radius - 12) * Math.sin(rad);
            const y1 = center - (radius - 12) * Math.cos(rad);
            const x2 = center + (radius - 4) * Math.sin(rad);
            const y2 = center - (radius - 4) * Math.cos(rad);
            return (
              <Line
                key={`tick_${deg}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={deg === 0 ? colors.accent : '#2C4468'}
                strokeWidth={deg % 90 === 0 ? 2 : 1}
              />
            );
          })}

          {/* Cardinal Directions relative to device heading */}
          {[
            { label: 'N', deg: 0, color: colors.accent },
            { label: 'E', deg: 90, color: colors.textSecondary },
            { label: 'S', deg: 180, color: colors.textSecondary },
            { label: 'W', deg: 270, color: colors.textSecondary }
          ].map((c) => {
            const rad = ((c.deg - deviceHeading) * Math.PI) / 180;
            const x = center + (radius - 20) * Math.sin(rad);
            const y = center - (radius - 20) * Math.cos(rad) + 4;
            return (
              <SvgText
                key={`cardinal_${c.label}`}
                x={x}
                y={y}
                fontSize="12"
                fill={c.color}
                fontWeight="bold"
                textAnchor="middle"
              >
                {c.label}
              </SvgText>
            );
          })}

          {/* Target Satellite Pointer Arrow */}
          <G
            rotation={headingDiff}
            origin={`${center}, ${center}`}
          >
            <Polygon
              points={`${center},${center - radius + 14} ${center - 8},${center - radius + 32} ${center + 8},${center - radius + 32}`}
              fill={isAligned ? colors.success : colors.primary}
            />
            <Line
              x1={center}
              y1={center - radius + 32}
              x2={center}
              y2={center - 20}
              stroke={isAligned ? colors.success : colors.primary}
              strokeWidth="2"
              strokeDasharray="4,2"
            />
          </G>

          {/* Center Hub Indicator */}
          <Circle
            cx={center}
            cy={center}
            r={16}
            fill={isAligned ? colors.success : colors.surfaceElevated}
            stroke={isAligned ? '#FFFFFF' : colors.primary}
            strokeWidth="2"
          />
          <Circle cx={center} cy={center} r={4} fill="#FFFFFF" />
        </Svg>
      </View>

      {/* Alignment Guidance Pill */}
      <View
        style={[
          styles.guidancePill,
          {
            backgroundColor: isAligned
              ? 'rgba(0, 230, 118, 0.15)'
              : 'rgba(0, 229, 255, 0.12)',
            borderColor: isAligned ? colors.success : colors.primary
          }
        ]}
      >
        <Ionicons
          name={isAligned ? 'checkmark-circle' : 'compass-outline'}
          size={18}
          color={isAligned ? colors.success : colors.primary}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.guidanceText,
            { color: isAligned ? colors.success : colors.primary }
          ]}
        >
          {isAligned
            ? `LOCKED ON AZIMUTH (${targetAz.toFixed(0)}°) — TILT TO ${targetEl.toFixed(0)}°`
            : headingDiff > 0
            ? `TURN RIGHT ${Math.abs(headingDiff).toFixed(0)}° TO ACQUIRE`
            : `TURN LEFT ${Math.abs(headingDiff).toFixed(0)}° TO ACQUIRE`}
        </Text>
      </View>

      {!sensorAvailable && Platform.OS !== 'web' && (
        <Text style={styles.sensorWarning}>
          Magnetometer hardware not detected. Using simulated heading orientation.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12
  },
  targetBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '92%',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12
  },
  targetBannerLeft: {
    flex: 1
  },
  targetLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  targetName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2
  },
  targetMetrics: {
    flexDirection: 'row',
    gap: 12
  },
  metricItem: {
    alignItems: 'center'
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 10
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold'
  },
  dialContainer: {
    marginVertical: 8
  },
  guidancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    marginTop: 12
  },
  guidanceText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  sensorWarning: {
    color: colors.warning,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20
  }
});

