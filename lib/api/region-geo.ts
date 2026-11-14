// Region centroids from /api/py/regions arrive as [lng, lat] (GeoJSON order, which
// is what the pipeline writes). Always go through this helper instead of indexing
// the tuple, so nobody mixes the order up. (Owner: Eleder; consumers: globe, tours.)
export function regionLatLng(region: { centroid: [number, number] | number[] }): {
  lat: number;
  lng: number;
} {
  const [lng, lat] = region.centroid;
  return { lat, lng };
}
