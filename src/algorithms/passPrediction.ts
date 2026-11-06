import * as satellite from 'satellite.js';
import { getLookAngles } from './orbitalMath.ts';
import type { ObserverLocation, PassPrediction, SkyPoint } from '../types/satellite.ts';

/**
 * Predicts upcoming satellite pass windows over a ground observer location.
 * Uses a refined two-phase algorithm (coarse 60s scan -> fine 1s refinement)
 * to locate exact AOS, Max Elevation, and LOS without locking the JS runtime.
 */
export function predictSatellitePasses(
  satrec: satellite.SatRec,
  satelliteName: string,
  noradId: number,
  observer: ObserverLocation,
  startDate: Date = new Date(),
  daysAhead: number = 2,
  minElevationDeg: number = 10
): PassPrediction[] {
  const passes: PassPrediction[] = [];
  const startMs = startDate.getTime();
  const endMs = startMs + daysAhead * 24 * 60 * 60 * 1000;

  const COARSE_STEP_MS = 60 * 1000; // 60 seconds coarse stepping
  let currentMs = startMs;

  let inCandidatePass = false;
  let candidateStartMs = 0;

  while (currentMs < endMs) {
    const angles = getLookAngles(satrec, observer, new Date(currentMs));
    const el = angles ? angles.elevationDeg : -90;

    if (!inCandidatePass && el > 0) {
      // Potential rising pass detected
      inCandidatePass = true;
      candidateStartMs = Math.max(startMs, currentMs - COARSE_STEP_MS);
    } else if (inCandidatePass && el <= 0) {
      // Satellite dipped below horizon: refine candidate window
      const candidateEndMs = currentMs;
      inCandidatePass = false;

      const refinedPass = refinePassWindow(
        satrec,
        satelliteName,
        noradId,
        observer,
        candidateStartMs,
        candidateEndMs,
        minElevationDeg
      );

      if (refinedPass && refinedPass.maxElevationDeg >= minElevationDeg) {
        passes.push(refinedPass);
        // Limit to at most 10 upcoming passes for mobile performance
        if (passes.length >= 10) break;
      }
    }

    currentMs += COARSE_STEP_MS;
  }

  return passes;
}

/**
 * Refines a coarse pass candidate window using fine-grained 5-second sampling
 * and determines optical illumination conditions.
 */
function refinePassWindow(
  satrec: satellite.SatRec,
  satelliteName: string,
  noradId: number,
  observer: ObserverLocation,
  startMs: number,
  endMs: number,
  minElevationDeg: number
): PassPrediction | null {
  const FINE_STEP_MS = 5 * 1000; // 5-second fine sampling
  let aosMs: number | null = null;
  let aosAz = 0;
  let losMs: number | null = null;
  let losAz = 0;

  let maxEl = -90;
  let maxMs = startMs;
  let maxAz = 0;

  const skyTrack: SkyPoint[] = [];

  for (let t = startMs; t <= endMs; t += FINE_STEP_MS) {
    const date = new Date(t);
    const angles = getLookAngles(satrec, observer, date);
    if (!angles) continue;

    const el = angles.elevationDeg;
    const az = angles.azimuthDeg;

    // Track maximum elevation
    if (el > maxEl) {
      maxEl = el;
      maxMs = t;
      maxAz = az;
    }

    // Detect AOS (rising above min elevation threshold)
    if (el >= minElevationDeg && aosMs === null) {
      aosMs = t;
      aosAz = az;
    }

    // Record sky track points while above horizon
    if (el >= 0) {
      skyTrack.push({
        azimuthDeg: az,
        elevationDeg: el,
        timestamp: t
      });
    }

    // Detect LOS (falling below min elevation threshold after passing peak)
    if (aosMs !== null && el < minElevationDeg && losMs === null && t > maxMs) {
      losMs = t;
      losAz = az;
    }
  }

  // If pass didn't reach minElevation, discard
  if (maxEl < minElevationDeg || aosMs === null) {
    return null;
  }

  // If LOS was not caught inside window, set to last recorded sample
  if (losMs === null) {
    losMs = endMs;
    const endAngles = getLookAngles(satrec, observer, new Date(endMs));
    losAz = endAngles ? endAngles.azimuthDeg : maxAz;
  }

  const durationSeconds = Math.max(1, Math.round((losMs - aosMs) / 1000));

  // Determine optical visibility
  const sunElevation = estimateSolarElevationDeg(observer.latitude, observer.longitude, new Date(maxMs));
  let isOpticallyVisible = false;
  let visibilityType: 'VISIBLE' | 'DAYLIGHT' | 'ECLIPSED' | 'RADIO' = 'RADIO';

  if (sunElevation > -0.83) {
    // Sun is above horizon (daylight)
    visibilityType = 'DAYLIGHT';
  } else if (sunElevation < -6.0) {
    // Civil twilight or night for observer
    // Starlink and ISS at 400-550 km remain illuminated even when ground is dark
    visibilityType = 'VISIBLE';
    isOpticallyVisible = true;
  } else {
    visibilityType = 'VISIBLE';
    isOpticallyVisible = true;
  }

  return {
    id: `pass_${noradId}_${aosMs}`,
    noradId,
    satelliteName,
    aosTimestamp: aosMs,
    aosAzimuthDeg: Math.round(aosAz),
    maxTimestamp: maxMs,
    maxElevationDeg: Math.round(maxEl * 10) / 10,
    maxAzimuthDeg: Math.round(maxAz),
    losTimestamp: losMs,
    losAzimuthDeg: Math.round(losAz),
    durationSeconds,
    isOpticallyVisible,
    visibilityType,
    skyTrack
  };
}

/**
 * Fast approximate calculation of the Sun's elevation angle
 * from an observer's latitude, longitude and UTC date.
 */
export function estimateSolarElevationDeg(latDeg: number, lonDeg: number, date: Date): number {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getUTCFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Solar declination (degrees)
  const declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  
  // Solar hour angle (degrees)
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const solarTime = utcHours + lonDeg / 15;
  const hourAngle = (solarTime - 12) * 15;

  const latRad = (latDeg * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  const haRad = (hourAngle * Math.PI) / 180;

  // Solar elevation: sin(h) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(ha)
  const sinElevation = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinElevation)));

  return (elevationRad * 180) / Math.PI;
}

