export type ConstellationType = 
  | 'STARLINK'
  | 'STATIONS'
  | 'SCIENCE'
  | 'NAVIGATION'
  | 'WEATHER'
  | 'OTHER';

export type DataSource = 'CELESTRAK' | 'SPACETRACK' | 'N2YO' | 'LOCAL';

export interface SatelliteRecord {
  noradId: number;
  name: string;
  intlDesig?: string;
  tleLine1: string;
  tleLine2: string;
  constellation: ConstellationType;
  source: DataSource;
  updatedAt: number;
  epochTimestamp?: number;
}

export interface ValidationTelemetry {
  noradId: number;
  name: string;
  timestamp: number;
  source: string;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmh?: number;
}

export interface ObservationPoint {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
}

export interface PassWindow {
  satelliteId: number;
  satelliteName: string;
  aosTimestamp: number;
  aosAzimuth: number;
  maxTimestamp: number;
  maxElevation: number;
  maxAzimuth: number;
  losTimestamp: number;
  losAzimuth: number;
  durationSeconds: number;
  isOpticallyVisible: boolean;
}

