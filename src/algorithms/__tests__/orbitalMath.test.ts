import assert from 'node:assert/strict';
import {
  initSatrec,
  getGeodeticPosition,
  getLookAngles,
  calculateFootprintRadiusKm,
  generateGroundTrackSegments
} from '../orbitalMath.ts';

console.log('🧪 Starting Orbital Mechanics (SGP4) & Coordinate Transformation Tests...\n');

const ISS_TLE_1 = '1 25544U 98067A   26310.50000000  .00016717  00000-0  10270-3 0  9993';
const ISS_TLE_2 = '2 25544  51.6420 180.4560 0004560  85.1230 275.0120 15.49815024479901';

const BUENOS_AIRES_OBSERVER = {
  latitude: -34.6037,
  longitude: -58.3816,
  altitudeMeters: 25
};

// Test 1: SGP4 Satrec initialization and propagation to geodetic position
try {
  const satrec = initSatrec(ISS_TLE_1, ISS_TLE_2);
  assert.ok(satrec, 'Satrec must be successfully initialized');

  const now = new Date();
  const position = getGeodeticPosition(satrec, now);
  assert.ok(position, 'Geodetic position must not be null');

  assert.ok(position.latitude >= -90 && position.latitude <= 90, `Latitude out of range: ${position.latitude}`);
  assert.ok(position.longitude >= -180 && position.longitude <= 180, `Longitude out of range: ${position.longitude}`);
  assert.ok(position.altitudeKm >= 380 && position.altitudeKm <= 480, `ISS Altitude out of LEO range: ${position.altitudeKm} km`);
  assert.ok(position.velocityKmh >= 25000 && position.velocityKmh <= 30000, `ISS Velocity out of orbital range: ${position.velocityKmh} km/h`);

  console.log(`✅ Test 1 Passed: SGP4 Propagation (Lat: ${position.latitude}°, Lon: ${position.longitude}°, Alt: ${position.altitudeKm} km, Speed: ${position.velocityKmh} km/h)`);
} catch (err: any) {
  console.error('❌ Test 1 Failed:', err.message);
  process.exit(1);
}

// Test 2: Topocentric Look Angles (Azimuth, Elevation, Range)
try {
  const satrec = initSatrec(ISS_TLE_1, ISS_TLE_2);
  const now = new Date();
  const angles = getLookAngles(satrec, BUENOS_AIRES_OBSERVER, now);
  assert.ok(angles, 'Look angles must not be null');

  assert.ok(angles.azimuthDeg >= 0 && angles.azimuthDeg <= 360, `Azimuth out of range: ${angles.azimuthDeg}`);
  assert.ok(angles.elevationDeg >= -90 && angles.elevationDeg <= 90, `Elevation out of range: ${angles.elevationDeg}`);
  assert.ok(angles.rangeKm > 350, `Slant range should be greater than altitude: ${angles.rangeKm} km`);

  console.log(`✅ Test 2 Passed: Look Angles computed (Azimuth: ${angles.azimuthDeg}°, Elevation: ${angles.elevationDeg}°, Range: ${angles.rangeKm} km)`);
} catch (err: any) {
  console.error('❌ Test 2 Failed:', err.message);
  process.exit(1);
}

// Test 3: Footprint circular coverage radius calculation (ITU-R formula)
try {
  // At 420 km altitude and 0° horizon elevation, footprint radius is ~2250 km
  const radiusHorizon = calculateFootprintRadiusKm(420, 0);
  assert.ok(radiusHorizon > 2100 && radiusHorizon < 2400, `Footprint at 0° should be ~2250 km, got ${radiusHorizon}`);

  // At 10° minimum elevation mask, footprint shrinks to ~1390 km
  const radius10Deg = calculateFootprintRadiusKm(420, 10);
  assert.ok(radius10Deg < radiusHorizon, 'Footprint radius must decrease as min elevation angle increases');
  assert.ok(radius10Deg >= 1350 && radius10Deg <= 1450, `Footprint at 10° mask should be ~1390 km, got ${radius10Deg}`);

  console.log(`✅ Test 3 Passed: Circular Footprint Radius (0° Mask: ${radiusHorizon} km | 10° Mask: ${radius10Deg} km)`);
} catch (err: any) {
  console.error('❌ Test 3 Failed:', err.message);
  process.exit(1);
}

// Test 4: Ground Track generation with past and future segments
try {
  const satrec = initSatrec(ISS_TLE_1, ISS_TLE_2);
  const segments = generateGroundTrackSegments(satrec, new Date(), 45, 50, 60);

  assert.ok(segments.length >= 2, 'Ground track should contain both past and future segments');
  const pastSegs = segments.filter(s => s.isPast);
  const futureSegs = segments.filter(s => !s.isPast);

  assert.ok(pastSegs.length >= 1, 'Must have at least one past segment');
  assert.ok(futureSegs.length >= 1, 'Must have at least one future segment');

  // Verify coordinates in all segments are bounded
  for (const seg of segments) {
    for (const pt of seg.coordinates) {
      assert.ok(pt.latitude >= -90 && pt.latitude <= 90);
      assert.ok(pt.longitude >= -180 && pt.longitude <= 180);
    }
  }

  console.log(`✅ Test 4 Passed: Ground track compiled (${pastSegs.length} past segs, ${futureSegs.length} future segs, Antimeridian protected)`);
} catch (err: any) {
  console.error('❌ Test 4 Failed:', err.message);
  process.exit(1);
}

console.log('\n🎉 All SGP4 & Orbital Mechanics Tests Passed Successfully!\n');
