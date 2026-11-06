import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, {
  Circle,
  Line,
  Polyline,
  G,
  Text as SvgText
} from 'react-native-svg';
import { colors } from '../theme/colors.ts';
import type { PassPrediction, LookAngles } from '../types/satellite.ts';

interface SkyChartProps {
  pass: PassPrediction | null;
  currentLookAngles?: LookAngles | null;
  size?: number;
}

export const SkyChart: React.FC<SkyChartProps> = ({
  pass,
  currentLookAngles,
  size
}) => {
  const chartSize = size || Math.min(Dimensions.get('window').width - 48, 320);
  const center = chartSize / 2;
  const radius = center - 24; // Margin for cardinal labels

  // Converts Azimuth (0-360°) and Elevation (0-90°) to SVG Cartesian Coordinates
  const polarToCartesian = (azDeg: number, elDeg: number) => {
    // Clamp elevation to [0, 90] for radar projection
    const clampedEl = Math.max(0, Math.min(90, elDeg));
    // r = 0 at zenith (90°), r = radius at horizon (0°)
    const r = radius * ((90 - clampedEl) / 90);
    const azRad = (azDeg * Math.PI) / 180;

    const x = center + r * Math.sin(azRad);
    const y = center - r * Math.cos(azRad);

    return { x, y };
  };

  // Convert sky track points to SVG polyline string
  const trackPointsString = pass
    ? pass.skyTrack
        .map((pt) => {
          const { x, y } = polarToCartesian(pt.azimuthDeg, pt.elevationDeg);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ')
    : '';

  const aosPos = pass ? polarToCartesian(pass.aosAzimuthDeg, 10) : null;
  const maxPos = pass ? polarToCartesian(pass.maxAzimuthDeg, pass.maxElevationDeg) : null;
  const losPos = pass ? polarToCartesian(pass.losAzimuthDeg, 10) : null;

  const currentSatPos =
    currentLookAngles && currentLookAngles.elevationDeg >= 0
      ? polarToCartesian(currentLookAngles.azimuthDeg, currentLookAngles.elevationDeg)
      : null;

  return (
    <View style={styles.container}>
      <Svg width={chartSize} height={chartSize}>
        {/* Background Radar Dome */}
        <Circle cx={center} cy={center} r={radius} fill="#091224" />

        {/* Concentric Elevation Circles (30°, 60°) */}
        <Circle
          cx={center}
          cy={center}
          r={radius * (60 / 90)} // 30° elevation ring
          fill="none"
          stroke="#172740"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius * (30 / 90)} // 60° elevation ring
          fill="none"
          stroke="#172740"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Outer Horizon Rim (0° elevation) */}
        <Circle cx={center} cy={center} r={radius} fill="none" stroke="#253D66" strokeWidth="1.5" />

        {/* Zenith Center Point (90° elevation) */}
        <Circle cx={center} cy={center} r={2} fill={colors.skyCardinal} />

        {/* Azimuth Axis Crosshairs (N-S, E-W) */}
        <Line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="#172740" strokeWidth="1" />
        <Line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="#172740" strokeWidth="1" />

        {/* Elevation Ring Labels */}
        <SvgText x={center + 4} y={center - radius * (30 / 90) + 12} fontSize="8" fill="#4B638A">
          60°
        </SvgText>
        <SvgText x={center + 4} y={center - radius * (60 / 90) + 12} fontSize="8" fill="#4B638A">
          30°
        </SvgText>

        {/* Cardinal Direction Indicators */}
        <SvgText x={center} y={center - radius - 8} fontSize="11" fill={colors.primary} fontWeight="bold" textAnchor="middle">
          N (0°)
        </SvgText>
        <SvgText x={center + radius + 14} y={center + 4} fontSize="11" fill={colors.textSecondary} fontWeight="bold" textAnchor="middle">
          E (90°)
        </SvgText>
        <SvgText x={center} y={center + radius + 16} fontSize="11" fill={colors.textSecondary} fontWeight="bold" textAnchor="middle">
          S (180°)
        </SvgText>
        <SvgText x={center - radius - 14} y={center + 4} fontSize="11" fill={colors.textSecondary} fontWeight="bold" textAnchor="middle">
          W (270°)
        </SvgText>

        {/* Pass Trajectory Polyline Arc */}
        {trackPointsString.length > 0 && (
          <Polyline
            points={trackPointsString}
            fill="none"
            stroke={colors.skyTrack}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Key Pass Waypoints */}
        {aosPos && (
          <G>
            <Circle cx={aosPos.x} cy={aosPos.y} r={4.5} fill={colors.success} />
            <SvgText x={aosPos.x} y={aosPos.y - 7} fontSize="9" fill={colors.success} fontWeight="bold" textAnchor="middle">
              AOS
            </SvgText>
          </G>
        )}

        {maxPos && (
          <G>
            <Circle cx={maxPos.x} cy={maxPos.y} r={6} fill={colors.accent} />
            <Circle cx={maxPos.x} cy={maxPos.y} r={2} fill="#FFFFFF" />
            <SvgText x={maxPos.x} y={maxPos.y - 9} fontSize="10" fill={colors.accent} fontWeight="bold" textAnchor="middle">
              {pass?.maxElevationDeg}° MAX
            </SvgText>
          </G>
        )}

        {losPos && (
          <G>
            <Circle cx={losPos.x} cy={losPos.y} r={4.5} fill={colors.danger} />
            <SvgText x={losPos.x} y={losPos.y + 14} fontSize="9" fill={colors.danger} fontWeight="bold" textAnchor="middle">
              LOS
            </SvgText>
          </G>
        )}

        {/* Current Satellite Live Position (if visible above horizon) */}
        {currentSatPos && (
          <G>
            <Circle cx={currentSatPos.x} cy={currentSatPos.y} r={8} fill={colors.primaryGlow} />
            <Circle cx={currentSatPos.x} cy={currentSatPos.y} r={4.5} fill={colors.primary} />
            <SvgText x={currentSatPos.x} y={currentSatPos.y + 14} fontSize="9" fill={colors.primary} fontWeight="bold" textAnchor="middle">
              LIVE
            </SvgText>
          </G>
        )}
      </Svg>

      {/* Chart Footer Info */}
      {pass && (
        <View style={styles.chartDetails}>
          <Text style={styles.chartTitle}>Pass Sky Arc: {pass.satelliteName}</Text>
          <Text style={styles.chartSubtitle}>
            AOS: {new Date(pass.aosTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({pass.aosAzimuthDeg}°) → Peak: {pass.maxElevationDeg}° → LOS: ({pass.losAzimuthDeg}°)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  chartDetails: {
    marginTop: 8,
    alignItems: 'center'
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold'
  },
  chartSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2
  }
});

