export interface LatLonPoint {
  latitude: number;
  longitude: number;
}

/**
 * Splits a list of geographic coordinates into separate continuous polyline segments
 * whenever the path crosses the 180° Antimeridian (International Date Line).
 * 
 * Standard map renderers produce an erroneous horizontal line crossing the entire
 * map width when connecting a point at +179.9° to -179.9°. This function detects
 * jumps where |lon2 - lon1| > 180° and splits the polyline, interpolating the
 * exact intersection point at ±180° for seamless border rendering.
 */
export function splitPolylineAtAntimeridian(points: LatLonPoint[]): LatLonPoint[][] {
  if (points.length <= 1) {
    return points.length === 1 ? [[...points]] : [];
  }

  const segments: LatLonPoint[][] = [];
  let currentSegment: LatLonPoint[] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const lonDiff = p2.longitude - p1.longitude;

    // Check if the longitude jump crosses the antimeridian (> 180 degrees)
    if (Math.abs(lonDiff) > 180) {
      // Crossing from positive (East) to negative (West) or vice-versa
      const goingEast = lonDiff < 0; // e.g. +179° -> -179° (diff = -358°)
      const sign1 = p1.longitude >= 0 ? 1 : -1;
      const sign2 = p2.longitude >= 0 ? 1 : -1;

      // Distance to boundary for both points
      const dist1 = 180 - Math.abs(p1.longitude);
      const dist2 = 180 - Math.abs(p2.longitude);
      const totalDist = dist1 + dist2;

      // Linear interpolation fraction for latitude at 180° crossing
      const ratio = totalDist > 0 ? dist1 / totalDist : 0.5;
      const boundaryLat = p1.latitude + (p2.latitude - p1.latitude) * ratio;

      // Finish current segment at the edge of the world
      currentSegment.push({
        latitude: boundaryLat,
        longitude: sign1 * 180
      });
      segments.push(currentSegment);

      // Start new segment from the opposite edge of the world
      currentSegment = [
        {
          latitude: boundaryLat,
          longitude: sign2 * 180
        }
      ];
    }

    currentSegment.push(p2);
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

