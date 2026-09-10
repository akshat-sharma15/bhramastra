export type CrowdStatus = "green" | "orange" | "red";

export interface Landmark {
  id: string;
  name: string;
  nameHi: string;
  lat: number;
  lng: number;
  nodeId: string;
}

export interface Zone {
  id: string;
  name: string;
  nameHi: string;
  lat: number;
  lng: number;
  radiusM: number;
  type: string;
  hour: number;
  occupancy: number;
  status: CrowdStatus;
}

export type PoiType = "parking" | "food" | "medical" | "toilet" | "auto";

export interface Poi {
  id: string;
  type: PoiType;
  name: string;
  nameHi: string;
  lat: number;
  lng: number;
  nodeId: string;
  capacity?: number;
  fillPercent?: number;
  status?: CrowdStatus;
  availableSpots?: number;
  distanceM?: number;
  etaMinutes?: number;
}

export interface RoutePathPoint {
  lat: number;
  lng: number;
  label: string;
}

export interface RouteResult {
  destination: Landmark;
  priority: string;
  hour: number;
  distanceM: number;
  etaMinutes: number;
  path: RoutePathPoint[];
  turns: string[];
  zonesUsed: string[];
  parking?: Poi;
}

export type RoutePriority = "fastest" | "crowd" | "parking";

export interface MissingReport {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastSeenLocationName: string;
  lat: number | null;
  lng: number | null;
  lastSeenTime: string;
  description: string;
  reporterContact: string;
  createdAt: string;
}

export interface FoundReport {
  id: string;
  age: number;
  gender: string;
  foundLocationName: string;
  lat: number | null;
  lng: number | null;
  foundTime: string;
  description: string;
  finderContact: string;
  createdAt: string;
}

export interface MatchResult {
  missing: MissingReport;
  candidates: { found: FoundReport; score: number }[];
}
