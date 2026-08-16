export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type BuildingLocationCandidate = {
  id: number;
  branch_name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

type MapboxContextEntry = {
  name?: string;
  region_code?: string;
  region_code_full?: string;
};

type MapboxFeature = {
  geometry?: {
    coordinates?: number[];
  };
  properties?: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
    context?: Record<string, MapboxContextEntry | undefined>;
  };
};

type MapboxFeatureCollection = {
  features?: MapboxFeature[];
};

type MapboxSuggestResponse = {
  suggestions?: {
    mapbox_id?: string;
  }[];
};

type FetchLike = (input: string) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

// Tọa độ trung tâm TP.HCM
const HCMC_PROXIMITY = "106.700981,10.776889";
const HCMC_REGION_CODES = new Set(["vn sg", "sg"]);

const buildingCoordsCache = new Map<string, Coordinates>();

// Chuẩn hóa chuỗi văn bản loại bỏ dấu và ký tự đặc biệt
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

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

// Ranh giới địa lý TP.HCM
export function isCoordinatesInHCMC(coords: Coordinates): boolean {
  const { latitude, longitude } = coords;
  return (
    latitude >= 10.35 &&
    latitude <= 11.20 &&
    longitude >= 106.35 &&
    longitude <= 107.10
  );
}

// Từ khóa các tỉnh/thành phố ngoài TP.HCM
const NON_HCMC_KEYWORDS = [
  "sa dec", "dong thap", "ha noi", "hanoi", "da nang", "can tho", "haiphong", "hai phong",
  "nha trang", "da lat", "dalat", "phu quoc", "vung tau", "ba ria",
  "binh duong", "dong nai", "bien hoa", "long an", "tien giang",
  "ben tre", "vinh long", "tra vinh", "an giang", "kien giang",
  "ca mau", "bac lieu", "soc trang", "hau giang", "phan thiet",
  "quy nhon", "hue", "quang nam", "quang ngai", "thanh hoa",
  "nghe an", "ha tinh", "quang binh", "quang tri", "ninh binh",
  "nam dinh", "thai binh", "hung yen", "hai duong", "bac ninh",
  "bac giang", "vinh phuc", "phu tho", "thai nguyen", "tuyen quang",
  "lao cai", "yen bai", "son la", "dien bien", "lai chau", "ha giang",
  "cao bang", "lang son", "quang ninh"
];

export function isNonHCMCQuery(query: string): boolean {
  const normalized = normalizeLocationText(query);
  const explicitlyInHCMC = [
    "ho chi minh",
    "hcmc",
    "tp hcm",
    "sai gon",
    "saigon",
  ].some((keyword) => normalized.includes(keyword));

  if (explicitlyInHCMC) return false;
  return NON_HCMC_KEYWORDS.some((kw) => normalized.includes(kw));
}

// Tính khoảng cách theo công thức Haversine 
export function getDistanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Kiểm tra xem Mapbox Access Token có hợp lệ không
export function hasMapboxToken(token: string | undefined): token is string {
  return typeof token === "string" && token.trim().startsWith("pk.");
}

// Làm sạch chuỗi từ khóa tìm kiếm vị trí
export function getLocationSearchText(query: string): string {
  return query
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(
      /\b(căn hộ|can ho|phòng|phong|cho thuê|cho thue|tìm|tim|gần|gan|ở|o|khu vực|khu vuc)\b/gi,
      " "
    )
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
  isInHCMC: boolean;
};

// Giải mã động địa chỉ tòa nhà qua Mapbox API
export async function getBuildingCoordinatesDynamic<T extends BuildingLocationCandidate>(
  building: T,
  token?: string
): Promise<Coordinates | null> {
  if (typeof building.latitude === "number" && typeof building.longitude === "number") {
    return { latitude: building.latitude, longitude: building.longitude };
  }

  const queryText = `${building.address || building.branch_name}, TP.HCM`;
  const cacheKey = normalizeLocationText(queryText);
  if (buildingCoordsCache.has(cacheKey)) {
    return buildingCoordsCache.get(cacheKey)!;
  }

  if (hasMapboxToken(token)) {
    const result = await geocodeLocationSearch(queryText, token);
    if (result?.isInHCMC) {
      buildingCoordsCache.set(cacheKey, result.coordinates);
      return result.coordinates;
    }
  }

  return null;
}

export async function findBuildingsWithinRadiusAsync<T extends BuildingLocationCandidate>(
  location: Coordinates,
  buildings: T[],
  token?: string,
  maxDistanceKm: number = 15
): Promise<BuildingDistanceResult<T>[]> {
  const results = await Promise.all(
    buildings.map(async (building) => {
      const coordinates = await getBuildingCoordinatesDynamic(building, token);
      if (!coordinates || !isCoordinatesInHCMC(coordinates)) return null;

      const distanceKm = getDistanceKm(location, coordinates);
      if (distanceKm > maxDistanceKm) return null;

      return {
        building,
        distanceKm: Math.round(distanceKm * 10) / 10,
      };
    })
  );

  return results
    .filter((result): result is BuildingDistanceResult<T> => result !== null)
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

// Tạo câu thông báo gợi ý khu vực với giới hạn TP.HCM
export function getLocationSuggestionMessage(
  search: string,
  distanceKm?: number,
  isWithinRange: boolean = true,
  isOutsideHCMC: boolean = false
): string {
  const target = search.trim();
  if (isOutsideHCMC) {
    return `YuKi House hiện chỉ có căn hộ tại Thành phố Hồ Chí Minh. Vị trí "${target}" nằm ngoài phạm vi phục vụ.`;
  }
  if (!isWithinRange) {
    return `Không tìm thấy căn hộ tại "${target}" hoặc trong bán kính 15 km.`;
  }
  const nearestText = typeof distanceKm === "number"
    ? ` Chi nhánh gần nhất cách khoảng ${distanceKm} km.`
    : "";
  return `Không có căn hộ khớp chính xác địa chỉ "${target}". Đang hiển thị các căn hộ trong bán kính 15 km.${nearestText}`;
}

function getFeatureCoordinates(feature: MapboxFeature | undefined): Coordinates | null {
  const coordinates = feature?.geometry?.coordinates;
  const longitude = coordinates?.[0];
  const latitude = coordinates?.[1];

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return { latitude, longitude };
}

function getFeatureFullText(feature: MapboxFeature): string {
  const properties = feature.properties;
  const contextNames = Object.values(properties?.context ?? {})
    .map((entry) => entry?.name ?? "")
    .filter(Boolean);

  return [
    properties?.name,
    properties?.full_address,
    properties?.place_formatted,
    ...contextNames,
  ].filter(Boolean).join(" ");
}

function isFeatureInHCMC(feature: MapboxFeature, coordinates: Coordinates): boolean {
  if (!isCoordinatesInHCMC(coordinates)) return false;

  const context = feature.properties?.context ?? {};
  const hasHCMCRegionCode = Object.values(context).some((entry) => {
    const code = normalizeLocationText(entry?.region_code_full ?? entry?.region_code ?? "");
    return HCMC_REGION_CODES.has(code);
  });
  if (hasHCMCRegionCode) return true;

  const locationText = normalizeLocationText(getFeatureFullText(feature));
  return [
    "ho chi minh",
    "thanh pho ho chi minh",
    "hcmc",
    "tp hcm",
    "sai gon",
    "saigon",
  ].some((name) => locationText.includes(name));
}

function createSearchUrl(path: string, params: Record<string, string>): string {
  const url = new URL(`https://api.mapbox.com/search/searchbox/v1/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function requestJson(url: string, fetcher: FetchLike): Promise<unknown | null> {
  const response = await fetcher(url);
  if (!response.ok) return null;
  return response.json();
}

async function findMapboxFeature(
  searchText: string,
  token: string,
  fetcher: FetchLike
): Promise<MapboxFeature | null> {
  const commonParams = {
    country: "VN",
    language: "vi",
    limit: "1",
    proximity: HCMC_PROXIMITY,
    access_token: token,
  };

  const forwardResult = await requestJson(
    createSearchUrl("forward", { ...commonParams, q: searchText }),
    fetcher
  );
  const forwardFeature = (forwardResult as MapboxFeatureCollection | null)?.features?.[0];
  if (getFeatureCoordinates(forwardFeature)) return forwardFeature ?? null;

  const sessionToken = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  const suggestResult = await requestJson(
    createSearchUrl("suggest", {
      ...commonParams,
      q: searchText,
      session_token: sessionToken,
    }),
    fetcher
  );
  const mapboxId = (suggestResult as MapboxSuggestResponse | null)
    ?.suggestions?.[0]?.mapbox_id;
  if (!mapboxId) return null;

  const retrieveResult = await requestJson(
    createSearchUrl(`retrieve/${encodeURIComponent(mapboxId)}`, {
      access_token: token,
      session_token: sessionToken,
    }),
    fetcher
  );

  return (retrieveResult as MapboxFeatureCollection | null)?.features?.[0] ?? null;
}

export async function geocodeLocationSearch(
  query: string,
  token: string | undefined,
  fetcher: FetchLike = fetch
): Promise<GeocodedLocation | null> {
  if (!hasMapboxToken(token)) return null;

  const searchText = getLocationSearchText(query);
  if (!searchText) return null;

  try {
    const feature = await findMapboxFeature(searchText, token, fetcher);
    const coordinates = getFeatureCoordinates(feature ?? undefined);
    if (!feature || !coordinates) return null;

    return {
      coordinates,
      fullAddress: feature.properties?.full_address
        ?? feature.properties?.place_formatted
        ?? feature.properties?.name
        ?? searchText,
      isInHCMC: isFeatureInHCMC(feature, coordinates),
    };
  } catch {
    return null;
  }
}
