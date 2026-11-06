import assert from 'node:assert/strict';
import { calculateHaversineDistanceKm } from '../utils/geoMath.js';
import { SEED_SATELLITES } from '../data/seedSatellites.js';

console.log('🧪 Starting Satellite Tracker Backend Unit Tests...\n');

// Test 1: Seed catalog structure and NORAD IDs
try {
  assert.ok(SEED_SATELLITES.length >= 10, 'Catalog must contain at least 10 satellites');
  const iss = SEED_SATELLITES.find(s => s.noradId === 25544);
  assert.ok(iss, 'ISS must be present in seed catalog');
  assert.equal(iss?.name, 'ISS (ZARYA)');
  assert.equal(iss?.constellation, 'STATIONS');
  assert.ok(iss?.tleLine1.startsWith('1 25544'));
  assert.ok(iss?.tleLine2.startsWith('2 25544'));

  const starlink = SEED_SATELLITES.filter(s => s.constellation === 'STARLINK');
  assert.ok(starlink.length >= 10, 'Must contain Starlink constellation subset');

  console.log(`✅ Test 1 Passed: Seed catalog validated (${SEED_SATELLITES.length} objects, ${starlink.length} Starlink)`);
} catch (err: any) {
  console.error('❌ Test 1 Failed:', err.message);
  process.exit(1);
}

// Test 2: Haversine distance calculation
try {
  // Buenos Aires (-34.6037, -58.3816) to Cordoba (-31.4201, -64.1888) ≈ 647 km
  const distance = calculateHaversineDistanceKm(-34.6037, -58.3816, -31.4201, -64.1888);
  assert.ok(distance > 600 && distance < 700, `Distance should be ~647 km, got ${distance}`);

  // Distance to self must be 0
  const zeroDist = calculateHaversineDistanceKm(-34.6037, -58.3816, -34.6037, -58.3816);
  assert.equal(zeroDist, 0);

  console.log(`✅ Test 2 Passed: Haversine distance calculation accurate (${distance} km)`);
} catch (err: any) {
  console.error('❌ Test 2 Failed:', err.message);
  process.exit(1);
}

console.log('\n🎉 All Satellite Tracker Backend Tests Passed Successfully!\n');
