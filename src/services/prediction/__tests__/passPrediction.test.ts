import assert from 'node:assert/strict';
import { initSatrec } from '../../../algorithms/orbitalMath.ts';
import { predictSatellitePasses, estimateSolarElevationDeg } from '../../../algorithms/passPrediction.ts';

console.log('🧪 Starting Satellite Pass Prediction & Visibility Tests...\n');

const ISS_TLE_1 = '1 25544U 98067A   26310.50000000  .00016717  00000-0  10270-3 0  9993';
const ISS_TLE_2 = '2 25544  51.6420 180.4560 0004560  85.1230 275.0120 15.49815024479901';

const BUENOS_AIRES_OBSERVER = {
  latitude: -34.6037,
  longitude: -58.3816,
  altitudeMeters: 25
};

// Test 1: Solar elevation estimation
try {
  // Solar noon at 0° lon: Date with UTC 12:00 at Equator
  const noonDate = new Date(Date.UTC(2026, 2, 21, 12, 0, 0)); // Equinox noon
  const solarNoon = estimateSolarElevationDeg(0, 0, noonDate);
  assert.ok(solarNoon > 80, `Solar noon elevation at equinox should be near 90°, got ${solarNoon}°`);

  // Midnight at 0° lon: UTC 00:00
  const midnightDate = new Date(Date.UTC(2026, 2, 21, 0, 0, 0));
  const solarMidnight = estimateSolarElevationDeg(0, 0, midnightDate);
  assert.ok(solarMidnight < -60, `Solar midnight should be deeply negative, got ${solarMidnight}°`);

  console.log(`✅ Test 1 Passed: Solar Elevation Estimator (Noon: ${solarNoon.toFixed(1)}° | Midnight: ${solarMidnight.toFixed(1)}°)`);
} catch (err: any) {
  console.error('❌ Test 1 Failed:', err.message);
  process.exit(1);
}

// Test 2: Predict upcoming ISS passes over Buenos Aires
try {
  const satrec = initSatrec(ISS_TLE_1, ISS_TLE_2);
  const now = new Date();
  
  // Predict over next 3 days with 10° threshold
  const passes = predictSatellitePasses(
    satrec,
    'ISS (ZARYA)',
    25544,
    BUENOS_AIRES_OBSERVER,
    now,
    3,
    10
  );

  assert.ok(passes.length >= 1, 'Should find at least 1 ISS pass over 3 days for Buenos Aires (-34.6° lat)');

  const firstPass = passes[0];
  assert.ok(firstPass.aosTimestamp <= firstPass.maxTimestamp, 'AOS must precede Max Elevation');
  assert.ok(firstPass.maxTimestamp <= firstPass.losTimestamp, 'Max Elevation must precede LOS');
  assert.ok(firstPass.maxElevationDeg >= 10, 'Max elevation must exceed threshold');
  assert.ok(firstPass.durationSeconds > 60 && firstPass.durationSeconds < 900, `Duration in expected LEO range (1-15 min): ${firstPass.durationSeconds}s`);
  assert.ok(firstPass.skyTrack.length > 0, 'Sky track points must be populated for sky chart');

  console.log(`✅ Test 2 Passed: Found ${passes.length} upcoming passes for ISS. First pass: Max El ${firstPass.maxElevationDeg}° at ${new Date(firstPass.maxTimestamp).toLocaleTimeString()}, duration: ${Math.round(firstPass.durationSeconds / 60)} min`);
} catch (err: any) {
  console.error('❌ Test 2 Failed:', err.message);
  process.exit(1);
}

console.log('\n🎉 All Pass Prediction Tests Passed Successfully!\n');

