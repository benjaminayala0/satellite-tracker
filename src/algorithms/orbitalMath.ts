import * as satellite from 'satellite.js';
import { splitPolylineAtAntimeridian, type LatLonPoint } from './antimeridian.ts';
import type { GeodeticPosition, LookAngles, ObserverLocation, GroundTrackSegment } from '../types/satellite.ts';

const EARTH_RADIUS_KM = 6371.0;

export interface SatrecWrapper {
  satrec: satellite.SatRec;
  name?: string;
  noradId?: number;
}

/**
 * Initializes an SGP4/SDP4 satellite record from two-line element (TLE) strings.
 */
export function initSatrec(tleLine1: string, tleLine2: string): satellite.SatRec {
  return satellite.twoline2satrec(tleLine1.trim(), tleLine2.trim());
}

/**
 * Computes the real-time geodetic position (subsatellite point and altitude)
 * by propagating the SGP4 orbital model to the specified date.
 */
export function getGeodeticPosition(
  satrec: satellite.SatRec,
  date: Date = new Date()
): GeodeticPosition | null {
  const positionAndVelocity = satellite.propagate(satrec, date);

  if (!positionAndVelocity || !positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
    return null;
  }

  const gmst = satellite.gstime(date);
  const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
  const geodetic = satellite.eciToGeodetic(positionEci, gmst);

  const latDeg = satellite.degreesLat(geodetic.latitude);
  let lonDeg = satellite.degreesLong(geodetic.longitude);
  
  // Normalize longitude to [-180, 180]
  while (lonDeg > 180) lonDeg -= 360;
  while (lonDeg < -180) lonDeg += 360;

  let velocityKmh = 0;
  if (positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== 'boolean') {
    const v = positionAndVelocity.velocity as satellite.EciVec3<number>;
    const speedKmSec = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    velocityKmh = Math.round(speedKmSec * 3600);
  }

  return {
    latitude: Math.round(latDeg * 10000) / 10000,
    longitude: Math.round(lonDeg * 10000) / 10000,
    altitudeKm: Math.round(geodetic.height * 10) / 10,
    velocityKmh,
    timestamp: date.getTime()
  };
}

/**
 * Calculates topocentric look angles (Azimuth, Elevation and Slant Range)
 * from an observer on the Earth surface towards the satellite.
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function getLookAngles(
  satrec: satellite.SatRec,
  observer: ObserverLocation,
  date: Date = new Date()
): LookAngles | null {
  const positionAndVelocity = satellite.propagate(satrec, date);

  if (!positionAndVelocity || !positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
    return null;
  }

  const gmst = satellite.gstime(date);
  const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
  const positionEcf = satellite.eciToEcf(positionEci, gmst);

  const observerGeodetic: satellite.GeodeticLocation = {
    latitude: degreesToRadians(observer.latitude),
    longitude: degreesToRadians(observer.longitude),
    height: observer.altitudeMeters / 1000 // Convert meters to km
  };

  const lookAngles = satellite.ecfToLookAngles(observerGeodetic, positionEcf);

  let azDeg = radiansToDegrees(lookAngles.azimuth);
  if (azDeg < 0) azDeg += 360;

  const elDeg = radiansToDegrees(lookAngles.elevation);

  return {
    azimuthDeg: Math.round(azDeg * 100) / 100,
    elevationDeg: Math.round(elDeg * 100) / 100,
    rangeKm: Math.round(lookAngles.rangeSat * 10) / 10
  };
}

/**
 * Calculates the circular Earth ground footprint radius (in km)
 * based on satellite orbital height and minimum elevation mask angle.
 * ITU-R / Spacecraft telecom formula:
 *   cos(theta_min + gamma) = (Re / (Re + h)) * cos(theta_min)
 *   ground_radius = Re * gamma
 */
export function calculateFootprintRadiusKm(
  altitudeKm: number,
  minElevationDeg: number = 0
): number {
  if (altitudeKm <= 0) return 0;

  const thetaRad = satellite.degreesToRadians(minElevationDeg);
  const ratio = (EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitudeKm)) * Math.cos(thetaRad);

  if (ratio > 1) return 0;

  const gammaRad = Math.acos(ratio) - thetaRad;
  if (gammaRad <= 0) return 0;

  return Math.round(EARTH_RADIUS_KM * gammaRad);
}

/**
 * Generates past and future ground track trajectory segments (approx 1 full orbit),
 * with automatic antimeridian wrap resolution to prevent visual crossing lines.
 */
export function generateGroundTrackSegments(
  satrec: satellite.SatRec,
  centerDate: Date = new Date(),
  pastMinutes: number = 45,
  futureMinutes: number = 50,
  stepSeconds: number = 30
): GroundTrackSegment[] {
  const pastPoints: LatLonPoint[] = [];
  const futurePoints: LatLonPoint[] = [];

  const centerMs = centerDate.getTime();
  const pastStartMs = centerMs - pastMinutes * 60 * 1000;
  const futureEndMs = centerMs + futureMinutes * 60 * 1000;
  const stepMs = stepSeconds * 1000;

  // 1. Sample past orbit points
  for (let t = pastStartMs; t <= centerMs; t += stepMs) {
    const pos = getGeodeticPosition(satrec, new Date(t));
    if (pos) {
      pastPoints.push({ latitude: pos.latitude, longitude: pos.longitude });
    }
  }

  // 2. Sample future orbit points
  for (let t = centerMs; t <= futureEndMs; t += stepMs) {
    const pos = getGeodeticPosition(satrec, new Date(t));
    if (pos) {
      futurePoints.push({ latitude: pos.latitude, longitude: pos.longitude });
    }
  }

  const pastSegments = splitPolylineAtAntimeridian(pastPoints);
  const futureSegments = splitPolylineAtAntimeridian(futurePoints);

  const result: GroundTrackSegment[] = [];

  for (const seg of pastSegments) {
    result.push({ coordinates: seg, isPast: true });
  }

  for (const seg of futureSegments) {
    result.push({ coordinates: seg, isPast: false });
  }

  return result;
}
