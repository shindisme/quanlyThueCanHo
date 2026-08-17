export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type BuildingLocationCandidate = {
  id: number;
  branch_name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type MapboxFeature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
  };
};

type MapboxFeatureCollection = { features?: MapboxFeature[] };

type FetchLike = (input: string) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

type ServiceBounds = {
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
};

const locationConfig = {
  country: import.meta.env.VITE_LOCATION_COUNTRY?.trim(),
  language: import.meta.env.VITE_LOCATION_LANGUAGE?.trim(),
  context: import.meta.env.VITE_LOCATION_CONTEXT?.trim(),
  bbox: import.meta.env.VITE_LOCATION_BBOX?.trim(),
  proximity: import.meta.env.VITE_LOCATION_PROXIMITY?.trim(),
};

function parseServiceBounds(value: string | undefined): ServiceBounds | null {
  if (!value) return null;

  const values = value.split(",").map(Number);
  if (values.length !== 4 || values.some((item) => !Number.isFinite(item))) {
    return null;
  }

  const [minLongitude, minLatitude, maxLongitude, maxLatitude] = values;
  if (minLongitude >= maxLongitude || minLatitude >= maxLatitude) return null;

  return { minLongitude, minLatitude, maxLongitude, maxLatitude };
}

const serviceBounds = parseServiceBounds(locationConfig.bbox);

export function normalizeLocationText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isCoordinatesInServiceArea(coords: Coordinates): boolean {
  if (!serviceBounds) return true;

  return (
    coords.latitude >= serviceBounds.minLatitude
    && coords.latitude <= serviceBounds.maxLatitude
    && coords.longitude >= serviceBounds.minLongitude
    && coords.longitude <= serviceBounds.maxLongitude
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function hasMapboxToken(token: string | undefined): token is string {
  return typeof token === "string" && token.trim().startsWith("pk.");
}

export function getLocationSearchText(query: string): string {
  return query
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export type BuildingDistanceResult<T> = {
  building: T;
  distanceKm: number;
};

export type GeocodedLocation = {
  coordinates: Coordinates;
  fullAddress: string;
  isInServiceArea: boolean;
};

function getBuildingCoordinates<T extends BuildingLocationCandidate>(
  building: T
): Coordinates | null {
  if (typeof building.latitude !== "number" || typeof building.longitude !== "number") {
    return null;
  }

  return { latitude: building.latitude, longitude: building.longitude };
}

export async function findBuildingsWithinRadiusAsync<T extends BuildingLocationCandidate>(
  location: Coordinates,
  buildings: T[],
  maxDistanceKm?: number
): Promise<BuildingDistanceResult<T>[]> {
  return buildings
    .map((building) => {
      const coordinates = getBuildingCoordinates(building);
      if (!coordinates || !isCoordinatesInServiceArea(coordinates)) return null;

      const distanceKm = getDistanceKm(location, coordinates);
      if (maxDistanceKm !== undefined && distanceKm > maxDistanceKm) return null;

      return { building, distanceKm };
    })
    .filter((result): result is BuildingDistanceResult<T> => result !== null)
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

export async function findNearestBuildingAsync<T extends BuildingLocationCandidate>(
  location: Coordinates,
  buildings: T[],
  maxDistanceKm?: number
): Promise<BuildingDistanceResult<T> | null> {
  const buildingsByDistance = await findBuildingsWithinRadiusAsync(
    location,
    buildings,
    maxDistanceKm
  );

  return buildingsByDistance[0] ?? null;
}

type LocationSuggestionMessageOptions = {
  nearestBranchName?: string;
  isOutsideServiceArea?: boolean;
  isUnresolved?: boolean;
};

export function getLocationSuggestionMessage(
  search: string,
  options: LocationSuggestionMessageOptions = {}
): string {
  const target = search.trim();

  if (options.isOutsideServiceArea) {
    return `Vị trí "${target}" nằm ngoài phạm vi phục vụ hiện tại của YuKi House.`;
  }
  if (options.isUnresolved) {
    return `Không thể xác định vị trí "${target}". Vui lòng nhập thêm tên đường hoặc khu vực.`;
  }
  if (!options.nearestBranchName) {
    return `Không tìm thấy chi nhánh YuKi House nào trong bán kính 15km từ địa chỉ "${target}".`;
  }

  return `Không có căn hộ khớp chính xác địa chỉ "${target}". Đang hiển thị căn hộ thuộc chi nhánh gần nhất "${options.nearestBranchName}".`;
}

function getFeatureCoordinates(feature: MapboxFeature | undefined): Coordinates | null {
  const longitude = feature?.geometry?.coordinates?.[0];
  const latitude = feature?.geometry?.coordinates?.[1];

  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return { latitude, longitude };
}

function createGeocodingUrl(params: Record<string, string>): string {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

async function requestJson(url: string, fetcher: FetchLike): Promise<unknown | null> {
  const response = await fetcher(url);
  return response.ok ? response.json() : null;
}

function getGeocodingQueries(searchText: string): string[] {
  const queries = [
    searchText,
    locationConfig.context ? `${searchText}, ${locationConfig.context}` : "",
  ];

  return queries.filter(
    (query, index) => query.length > 0 && queries.indexOf(query) === index
  );
}

async function findMapboxFeature(
  searchText: string,
  token: string,
  fetcher: FetchLike,
  permanent: boolean
): Promise<MapboxFeature | null> {
  for (const query of getGeocodingQueries(searchText)) {
    const params: Record<string, string> = {
      q: query,
      access_token: token,
      ...(locationConfig.country ? { country: locationConfig.country } : {}),
      ...(locationConfig.language ? { language: locationConfig.language } : {}),
      ...(locationConfig.bbox ? { bbox: locationConfig.bbox } : {}),
      ...(locationConfig.proximity ? { proximity: locationConfig.proximity } : {}),
      ...(permanent ? { permanent: "true" } : {}),
    };

    const result = await requestJson(createGeocodingUrl(params), fetcher);
    const features = (result as MapboxFeatureCollection | null)?.features ?? [];
    const feature = features.find((item) => {
      const coordinates = getFeatureCoordinates(item);
      return coordinates !== null && isCoordinatesInServiceArea(coordinates);
    });

    if (feature) return feature;
  }

  return null;
}

async function geocode(
  query: string,
  token: string | undefined,
  fetcher: FetchLike,
  permanent: boolean
): Promise<GeocodedLocation | null> {
  const searchText = getLocationSearchText(query);
  if (!searchText || !hasMapboxToken(token)) return null;

  try {
    const feature = await findMapboxFeature(searchText, token, fetcher, permanent);
    const coordinates = getFeatureCoordinates(feature ?? undefined);
    if (!feature || !coordinates) return null;

    return {
      coordinates,
      fullAddress: feature.properties?.full_address
        ?? feature.properties?.place_formatted
        ?? feature.properties?.name
        ?? searchText,
      isInServiceArea: isCoordinatesInServiceArea(coordinates),
    };
  } catch {
    return null;
  }
}

export function geocodeLocationSearch(
  query: string,
  token: string | undefined,
  fetcher: FetchLike = fetch
): Promise<GeocodedLocation | null> {
  return geocode(query, token, fetcher, false);
}

export function geocodeBuildingAddress(
  address: string,
  token: string | undefined,
  fetcher: FetchLike = fetch
): Promise<GeocodedLocation | null> {
  return geocode(address, token, fetcher, true);
}
