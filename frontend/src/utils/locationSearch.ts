export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type BuildingLocationCandidate = {
  id: number;
  branch_name: string;
};

type BranchLocation = Coordinates & {
  aliases: string[];
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

const HCMC_PROXIMITY = "106.700981,10.776889";
const HCMC_BBOX = "106.45,10.6,107.05,11.05";

const BRANCH_LOCATIONS: BranchLocation[] = [
  {
    latitude: 10.776889,
    longitude: 106.700981,
    aliases: ["Quận 1", "Q1", "Q.1", "District 1"],
  },
  {
    latitude: 10.7292,
    longitude: 106.7219,
    aliases: ["Quận 7", "Q7", "Q.7", "District 7"],
  },
  {
    latitude: 10.738,
    longitude: 106.678,
    aliases: ["Quận 8", "Q8", "Q.8", "District 8"],
  },
  {
    latitude: 10.7945,
    longitude: 106.722,
    aliases: ["Bình Thạnh", "Binh Thanh"],
  },
  {
    latitude: 10.842,
    longitude: 106.83,
    aliases: ["Thủ Đức", "Thu Duc", "Quận 9", "Q9", "Q.9"],
  },
];

function normalizeLocationText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(value: string): string {
  return normalizeLocationText(value).replace(/\s+/g, "");
}

function getBranchLocation(branchName: string): BranchLocation | null {
  const normalizedBranch = normalizeLocationText(branchName);
  const compactBranch = compact(branchName);

  return BRANCH_LOCATIONS.find((location) =>
    location.aliases.some((alias) => {
      const normalizedAlias = normalizeLocationText(alias);
      return (
        normalizedBranch.includes(normalizedAlias) ||
        compactBranch.includes(compact(alias))
      );
    })
  ) ?? null;
}

function toRadians(value: number): number {
  return value * Math.PI / 180;
}

function getDistanceKm(from: Coordinates, to: Coordinates): number {
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

export function hasMapboxToken(token: string | undefined): token is string {
  return typeof token === "string" && token.trim().startsWith("pk.");
}

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

export function findNearestBuilding<T extends BuildingLocationCandidate>(
  location: Coordinates,
  buildings: T[]
): T | null {
  let nearest: { building: T; distanceKm: number } | null = null;

  for (const building of buildings) {
    const branchLocation = getBranchLocation(building.branch_name);
    if (!branchLocation) continue;

    const distanceKm = getDistanceKm(location, branchLocation);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { building, distanceKm };
    }
  }

  return nearest?.building ?? null;
}

export function getLocationSuggestionMessage(search: string): string {
  const target = search.trim();
  return `Không có căn hộ nào ở khu vực ${target}, đây là danh sách các căn hộ ở khu vực gần ${target}.`;
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
      bbox: HCMC_BBOX,
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
