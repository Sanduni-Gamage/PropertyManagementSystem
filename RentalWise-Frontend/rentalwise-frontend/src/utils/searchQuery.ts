
// src/utils/searchUrl.ts
import type { SearchFilters } from "../slices/searchSlice";

export function parseQueryParams(queryString: string): Partial<SearchFilters> {
  const params = new URLSearchParams(queryString);
  const getNum = (key: string) => {
    const val = params.get(key);
    return val !== null ? +val : null;
  };

  return {
    keyword: params.get("keyword") || "",
    regionId: getNum("regionId"),
    districtId: getNum("districtId"),
    suburbIds: params.get("suburbIds")?.split(",").map(Number) || [],
    propertyTypes: params.get("propertyTypes")?.split(",").map(Number) || [],
    propertyFeatures: getNum("propertyFeatures"),
    bedrooms: getNum("bedrooms"),
    bathrooms: getNum("bathrooms"),
    parkingSpaces: getNum("parkingSpaces"),
    minRent: getNum("minRent"),
    maxRent: getNum("maxRent"),
    petsAllowed:
      params.get("petsAllowed") === "true"
        ? true
        : params.get("petsAllowed") === "false"
        ? false
        : null,
    moveInDate: params.get("moveInDate") || null,
    page: getNum("page") ?? 1,
    pageSize: getNum("pageSize") ?? 10,
    sortBy: params.get("sortBy") || "latest",
    regionName: params.get("regionName") || null,
    districtName: params.get("districtName") || null,
    suburbNames: params.get("suburbNames")
      ? params.get("suburbNames")!.split(",")
      : null,
  };
}

export function serializeFilters(filters: Partial<SearchFilters>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, value.toString());
      }
    }
  });
  return params.toString();
}
