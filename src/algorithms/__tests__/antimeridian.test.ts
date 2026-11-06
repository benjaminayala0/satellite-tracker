import assert from 'node:assert/strict';
import { splitPolylineAtAntimeridian } from '../antimeridian.ts';

console.log('🧪 Starting Antimeridian Polyline Segmenter Tests...\n');

// Test 1: Polyline within same hemisphere does not split
try {
  const points = [
    { latitude: -34.6, longitude: -58.4 },
    { latitude: -31.4, longitude: -64.2 },
    { latitude: -32.9, longitude: -60.6 }
  ];

  const segments = splitPolylineAtAntimeridian(points);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].length, 3);
  console.log('✅ Test 1 Passed: Continuous non-crossing trajectory preserved');
} catch (err: any) {
  console.error('❌ Test 1 Failed:', err.message);
  process.exit(1);
}

// Test 2: Crossing East to West across +179° to -179°
try {
  const points = [
    { latitude: 10, longitude: 175 },
    { latitude: 20, longitude: -175 }
  ];

  const segments = splitPolylineAtAntimeridian(points);
  assert.equal(segments.length, 2, 'Must split into exactly 2 segments');

  // Segment 1 ends at +180°
  const seg1Last = segments[0][segments[0].length - 1];
  assert.equal(seg1Last.longitude, 180);
  assert.equal(seg1Last.latitude, 15); // Exactly halfway between 10 and 20

  // Segment 2 starts at -180°
  const seg2First = segments[1][0];
  assert.equal(seg2First.longitude, -180);
  assert.equal(seg2First.latitude, 15);

  console.log('✅ Test 2 Passed: Single Antimeridian crossing splits seamlessly at ±180°');
} catch (err: any) {
  console.error('❌ Test 2 Failed:', err.message);
  process.exit(1);
}

// Test 3: Full orbit with two crossings
try {
  const points = [
    { latitude: 0, longitude: 170 },
    { latitude: 10, longitude: -170 },
    { latitude: 20, longitude: -100 },
    { latitude: 30, longitude: 0 },
    { latitude: 40, longitude: 100 },
    { latitude: 50, longitude: 175 },
    { latitude: 60, longitude: -175 }
  ];

  const segments = splitPolylineAtAntimeridian(points);
  assert.equal(segments.length, 3, 'Must split into 3 segments for 2 crossings');

  // Validate no segment has an internal jump > 180°
  for (const seg of segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      const diff = Math.abs(seg[i + 1].longitude - seg[i].longitude);
      assert.ok(diff <= 180, `Segment internal jump must be <= 180, found ${diff}`);
    }
  }

  console.log('✅ Test 3 Passed: Multi-crossing orbit produces clean bounded segments without wrap lines');
} catch (err: any) {
  console.error('❌ Test 3 Failed:', err.message);
  process.exit(1);
}

console.log('\n🎉 All Antimeridian Algorithm Tests Passed Successfully!\n');

