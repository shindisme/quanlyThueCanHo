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

type MapboxFeatureCollection = {
  features?: {
    geometry?: {
      coordinates?: number[];
    };
  }[];
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
  "dong thap", "ha noi", "hanoi", "da nang", "can tho", "haiphong", "hai phong",
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

export type NearestBuildingResult<T> = {
  building: T;
  distanceKm: number;
  isWithinRange: boolean;
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
    const coords = await geocodeSearchText(queryText, token);
    if (coords) {
      buildingCoordsCache.set(cacheKey, coords);
      return coords;
    }
  }

  return null;
}

// Tìm tòa nhà gần nhất và kiểm tra bán kính giới hạn 15km
export async function findNearestBuildingAsync<T extends BuildingLocationCandidate>(
  location: Coordinates,
  buildings: T[],
  token?: string,
  maxDistanceKm: number = 15
): Promise<NearestBuildingResult<T> | null> {
  let nearest: { building: T; distanceKm: number } | null = null;

  for (const building of buildings) {
    const coords = await getBuildingCoordinatesDynamic(building, token);
    if (!coords) continue;

    const distanceKm = getDistanceKm(location, coords);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { building, distanceKm };
    }
  }

  if (!nearest) return null;

  return {
    building: nearest.building,
    distanceKm: Math.round(nearest.distanceKm * 10) / 10,
    isWithinRange: nearest.distanceKm <= maxDistanceKm,
  };
}

// Đồng bộ hóa tương thích ngược
export function findNearestBuilding<T extends BuildingLocationCandidate>(
  location: Coordinates,
  buildings: T[],
  maxDistanceKm: number = 15
): NearestBuildingResult<T> | null {
  let nearest: { building: T; distanceKm: number } | null = null;

  for (const building of buildings) {
    const coords: Coordinates | null =
      typeof building.latitude === "number" && typeof building.longitude === "number"
        ? { latitude: building.latitude, longitude: building.longitude }
        : buildingCoordsCache.get(normalizeLocationText(`${building.address || building.branch_name}, TP.HCM`)) || null;

    if (!coords) continue;

    const distanceKm = getDistanceKm(location, coords);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { building, distanceKm };
    }
  }

  if (!nearest) return null;

  return {
    building: nearest.building,
    distanceKm: Math.round(nearest.distanceKm * 10) / 10,
    isWithinRange: nearest.distanceKm <= maxDistanceKm,
  };
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
    return `Hệ thống hiện tại chỉ hỗ trợ tìm kiếm căn hộ tại khu vực Thành phố Hồ Chí Minh..`;
  }
  if (!isWithinRange && distanceKm) {
    return `Không tìm thấy căn hộ trực tiếp tại "${target}". Dưới đây là danh sách các căn hộ tại khu vực lân cận ở TP.HCM.`;
  }
  return `Không tìm thấy căn hộ trực tiếp tại "${target}". Dưới đây là danh sách các căn hộ tại khu vực lân cận ở TP.HCM.`;
}

function getFirstCoordinates(value: unknown): Coordinates | null {
  const coordinates = (value as MapboxFeatureCollection).features?.[0]?.geometry?.coordinates;
  const longitude = coordinates?.[0];
  const latitude = coordinates?.[1];

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return { latitude, longitude };
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

// Chuyển đổi tên vị trí tìm kiếm thành tọa độ (Latitude, Longitude) qua Mapbox Search Box API
export async function geocodeSearchText(
  query: string,
  token: string | undefined,
  fetcher: FetchLike = fetch
): Promise<Coordinates | null> {
  if (!hasMapboxToken(token)) return null;

  const searchText = getLocationSearchText(query);
  if (!searchText) return null;

  try {
    const commonParams = {
      country: "VN",
      language: "vi",
      limit: "1",
      proximity: HCMC_PROXIMITY,
      access_token: token,
    };

    const forwardResult = await requestJson(
      createSearchUrl("forward", {
        ...commonParams,
        q: searchText,
      }),
      fetcher
    );
    const forwardCoordinates = getFirstCoordinates(forwardResult);
    if (forwardCoordinates) return forwardCoordinates;

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

    return getFirstCoordinates(retrieveResult);
  } catch {
    return null;
  }
}
