import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, {
  Rect,
  Path,
  Line,
  Circle,
  Polyline,
  G,
  Text as SvgText
} from 'react-native-svg';
import { colors } from '../theme/colors.ts';
import type {
  GeodeticPosition,
  GroundTrackSegment,
  ObserverLocation
} from '../types/satellite.ts';

interface StarlinkPoint {
  noradId: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface WorldMapProps {
  currentPosition: GeodeticPosition | null;
  satelliteName?: string;
  groundTrackSegments: GroundTrackSegment[];
  footprintRadiusKm: number;
  observerLocation: ObserverLocation;
  starlinkSwarm?: StarlinkPoint[];
  isStarlinkActive?: boolean;
}

// Simplified world coastline vector paths for equirectangular 360x180 aspect ratio
const WORLD_LANDMASS_PATHS = [
  // South America
  'M 105,100 Q 115,105 125,120 Q 130,140 120,165 Q 112,170 108,160 Q 100,135 98,115 Z',
  // North America
  'M 40,30 Q 70,25 95,35 Q 105,50 95,75 Q 85,85 75,70 Q 55,75 45,55 Z',
  // Europe
  'M 175,40 Q 195,35 210,45 Q 205,60 190,65 Q 175,60 175,40 Z',
  // Africa
  'M 170,70 Q 200,68 215,85 Q 220,115 195,145 Q 180,140 170,110 Q 165,85 170,70 Z',
  // Asia
  'M 215,35 Q 260,25 310,40 Q 320,70 295,95 Q 260,85 240,75 Q 215,55 215,35 Z',
  // Australia
  'M 290,120 Q 320,115 325,135 Q 315,155 295,150 Q 285,135 290,120 Z'
];

export const WorldMap: React.FC<WorldMapProps> = ({
  currentPosition,
  satelliteName = 'Satellite',
  groundTrackSegments,
  footprintRadiusKm,
  observerLocation,
  starlinkSwarm = [],
  isStarlinkActive = true
}) => {
  const mapWidth = Dimensions.get('window').width - 24;
  const mapHeight = Math.round(mapWidth * 0.55); // ~16:9 ratio

  // Coordinate projection mapping: Lat [-90, 90] -> Y [H, 0], Lon [-180, 180] -> X [0, W]
  const projectX = (lon: number): number => {
    return ((lon + 180) / 360) * mapWidth;
  };

  const projectY = (lat: number): number => {
    return ((90 - lat) / 180) * mapHeight;
  };

  // Convert km radius to SVG pixel dimensions
  // Earth circumference at equator ≈ 40075 km
  const kmToPixelX = (radiusKm: number, lat: number): number => {
    const latCos = Math.max(0.15, Math.cos((lat * Math.PI) / 180));
    return (radiusKm / 40075) * mapWidth * 2;
  };

  const kmToPixelY = (radiusKm: number): number => {
    return (radiusKm / 20004) * mapHeight;
  };

  const satX = currentPosition ? projectX(currentPosition.longitude) : mapWidth / 2;
  const satY = currentPosition ? projectY(currentPosition.latitude) : mapHeight / 2;

  const obsX = projectX(observerLocation.longitude);
  const obsY = projectY(observerLocation.latitude);

  const footprintRx = currentPosition ? kmToPixelX(footprintRadiusKm, currentPosition.latitude) : 0;
  const footprintRy = kmToPixelY(footprintRadiusKm);

  return (
    <View style={styles.container}>
      <Svg width={mapWidth} height={mapHeight} style={styles.svgMap}>
        {/* Ocean Background */}
        <Rect x="0" y="0" width={mapWidth} height={mapHeight} fill="#091122" rx={10} />

        {/* Latitude & Longitude Graticule */}
        <G stroke="#17243C" strokeWidth="1" strokeDasharray="3,3">
          {/* Equator */}
          <Line x1="0" y1={mapHeight / 2} x2={mapWidth} y2={mapHeight / 2} stroke="#1F3354" strokeWidth="1.2" />
          {/* Tropics (+23.5°, -23.5°) */}
          <Line x1="0" y1={projectY(23.5)} x2={mapWidth} y2={projectY(23.5)} />
          <Line x1="0" y1={projectY(-23.5)} x2={mapWidth} y2={projectY(-23.5)} />
          {/* Prime Meridian (0°) */}
          <Line x1={mapWidth / 2} y1="0" x2={mapWidth / 2} y2={mapHeight} stroke="#1F3354" strokeWidth="1.2" />
          {/* ±60°, ±120° Meridians */}
          <Line x1={projectX(-120)} y1="0" x2={projectX(-120)} y2={mapHeight} />
          <Line x1={projectX(-60)} y1="0" x2={projectX(-60)} y2={mapHeight} />
          <Line x1={projectX(60)} y1="0" x2={projectX(60)} y2={mapHeight} />
          <Line x1={projectX(120)} y1="0" x2={projectX(120)} y2={mapHeight} />
        </G>

        {/* Continents & Landmasses */}
        <G scale={mapWidth / 360} fill="#132038" stroke="#1D3050" strokeWidth="0.8">
          {WORLD_LANDMASS_PATHS.map((d, index) => (
            <Path key={`land_${index}`} d={d} />
          ))}
        </G>

        {/* Starlink Swarm Constellation Layer */}
        {isStarlinkActive &&
          starlinkSwarm.map((st) => (
            <Circle
              key={`st_${st.noradId}`}
              cx={projectX(st.longitude)}
              cy={projectY(st.latitude)}
              r={1.8}
              fill={colors.starlinkDot}
              opacity={0.7}
            />
          ))}

        {/* Ground Track Segments (Past: Dim Gray, Future: Electric Cyan) */}
        {groundTrackSegments.map((seg, segIdx) => {
          const pointsString = seg.coordinates
            .map((pt) => `${projectX(pt.longitude)},${projectY(pt.latitude)}`)
            .join(' ');

          return (
            <Polyline
              key={`track_seg_${segIdx}`}
              points={pointsString}
              fill="none"
              stroke={seg.isPast ? colors.orbitPast : colors.orbitFuture}
              strokeWidth={seg.isPast ? 1.5 : 2.2}
              strokeDasharray={seg.isPast ? '3,3' : undefined}
              strokeOpacity={seg.isPast ? 0.6 : 0.9}
            />
          );
        })}

        {/* Satellite Footprint Area (Coverage Circle/Ellipse) */}
        {currentPosition && footprintRx > 0 && (
          <G>
            <Circle
              cx={satX}
              cy={satY}
              r={Math.min(footprintRx, mapWidth * 0.45)}
              fill={colors.footprintFill}
              stroke={colors.footprintStroke}
              strokeWidth={1.2}
              strokeDasharray="4,4"
            />
          </G>
        )}

        {/* Observer Ground Station Marker (Green Crosshair) */}
        <G>
          <Circle cx={obsX} cy={obsY} r={4.5} fill={colors.userLocation} opacity={0.9} />
          <Circle cx={obsX} cy={obsY} r={9} fill="none" stroke={colors.userLocation} strokeWidth={1} opacity={0.5} />
          <SvgText
            x={obsX + 8}
            y={obsY - 4}
            fontSize="9"
            fill={colors.userLocation}
            fontWeight="bold"
          >
            OBSERVER
          </SvgText>
        </G>

        {/* Satellite Live Position Marker (Pulsing Cyan Icon) */}
        {currentPosition && (
          <G>
            <Circle cx={satX} cy={satY} r={14} fill={colors.primaryGlow} />
            <Circle cx={satX} cy={satY} r={5.5} fill={colors.primary} />
            <Circle cx={satX} cy={satY} r={2} fill="#FFFFFF" />
            <SvgText
              x={satX}
              y={satY - 10}
              fontSize="10"
              fill={colors.primary}
              fontWeight="bold"
              textAnchor="middle"
            >
              {satelliteName}
            </SvgText>
          </G>
        )}
      </Svg>

      {/* Map Legend Footer */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Satellite</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.orbitFuture }]} />
          <Text style={styles.legendText}>Future Orbit</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.orbitPast, borderStyle: 'dashed' }]} />
          <Text style={styles.legendText}>Past Orbit</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.userLocation }]} />
          <Text style={styles.legendText}>Observer</Text>
        </View>
        {isStarlinkActive && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.starlinkDot }]} />
            <Text style={styles.legendText}>Starlink Swarm</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 8,
    marginHorizontal: 12,
    marginVertical: 8
  },
  svgMap: {
    borderRadius: 8
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 2
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4
  },
  legendLine: {
    width: 14,
    height: 2,
    marginRight: 4
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '500'
  }
});

