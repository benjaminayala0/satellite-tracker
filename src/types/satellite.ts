export type ConstellationGroup = 
  | 'ALL'
  | 'STARLINK'
  | 'STATIONS'
  | 'SCIENCE'
  | 'NAVIGATION'
  | 'WEATHER';

export interface Satellite {
  noradId: number;
  name: string;
  intlDesig?: string;
  tleLine1: string;
  tleLine2: string;
  constellation: ConstellationGroup;
  source: 'CELESTRAK' | 'SPACETRACK' | 'N2YO' | 'LOCAL';
  updatedAt: number;
  epochDate?: string;
  periodMinutes?: number;
}

export interface GeodeticPosition {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmh: number;
  timestamp: number;
}

export interface LookAngles {
  azimuthDeg: number;
  elevationDeg: number;
  rangeKm: number;
}

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  label?: string;
}

export interface SkyPoint {
  azimuthDeg: number;
  elevationDeg: number;
  timestamp: number;
}

export interface PassPrediction {
  id: string;
  noradId: number;
  satelliteName: string;
  aosTimestamp: number;
  aosAzimuthDeg: number;
  maxTimestamp: number;
  maxElevationDeg: number;
  maxAzimuthDeg: number;
  losTimestamp: number;
  losAzimuthDeg: number;
  durationSeconds: number;
  isOpticallyVisible: boolean;
  visibilityType: 'VISIBLE' | 'DAYLIGHT' | 'ECLIPSED' | 'RADIO';
  skyTrack: SkyPoint[];
}

export interface GroundTrackSegment {
  coordinates: Array<{ latitude: number; longitude: number }>;
  isPast: boolean;
}

export interface FootprintData {
  centerLat: number;
  centerLon: number;
  radiusKm: number;
  minElevationDeg: number;
}

