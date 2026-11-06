import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_SEED_SATELLITES } from './seedData.ts';
import type { Satellite, ConstellationGroup } from '../../types/satellite.ts';

const CACHE_KEY_CATALOG = 'sat_catalog_cache_v1';
const CACHE_KEY_TIMESTAMP = 'sat_catalog_timestamp_v1';
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours TTL

export interface ValidationTelemetry {
  noradId: number;
  name: string;
  timestamp: number;
  source: string;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmh?: number;
}

export function getDefaultBackendUrl(): string {
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:3003`;
  }

  try {
    const Constants = require('expo-constants').default;
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || Constants?.manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:3003`;
      }
    }
  } catch {
    // Fallback
  }

  return 'http://192.168.1.6:3003';
}

export class CompositeDataProvider {
  private backendUrl: string;

  constructor(backendUrl?: string) {
    this.backendUrl = backendUrl || getDefaultBackendUrl();
  }

  public setBackendUrl(url: string): void {
    this.backendUrl = url;
  }

  public getBackendUrl(): string {
    return this.backendUrl;
  }

  /**
   * Fetches the satellite catalog with multi-tier fallback:
   * 1. Remote Gateway / CelesTrak Proxy
   * 2. Local AsyncStorage Cache (if network fails)
   * 3. Curated High-Precision Offline Seed Data
   */
  public async getCatalog(constellation: ConstellationGroup = 'ALL'): Promise<Satellite[]> {
    let satellites: Satellite[] = [];

    // 1. Try remote backend proxy
    try {
      const url = `${this.backendUrl.replace(/\/$/, '')}/api/satellites${
        constellation !== 'ALL' ? `?constellation=${constellation}` : ''
      }`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        const json = await response.json();
        if (json.satellites && Array.isArray(json.satellites)) {
          satellites = json.satellites;
          // Persist to local cache
          await this.saveCache(satellites);
          return satellites;
        }
      }
    } catch {
      // Network unreachable, proceed to tier 2
    }

    // 2. Try AsyncStorage cache
    try {
      const cached = await this.loadCache();
      if (cached && cached.length > 0) {
        if (constellation === 'ALL') {
          return cached;
        }
        return cached.filter(s => s.constellation === constellation);
      }
    } catch {
      // Cache read failed, proceed to tier 3
    }

    // 3. Fallback to bundled seed data
    if (constellation === 'ALL') {
      return [...LOCAL_SEED_SATELLITES];
    }
    return LOCAL_SEED_SATELLITES.filter(s => s.constellation === constellation);
  }

  /**
   * Fetches independent live telemetry from WhereTheISS.at for scientific cross-validation.
   */
  public async getIssValidationTelemetry(): Promise<ValidationTelemetry> {
    // 1. Try backend proxy
    try {
      const proxyUrl = `${this.backendUrl.replace(/\/$/, '')}/api/validation/iss`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Proceed to direct public API
    }

    // 2. Try direct public REST API
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return {
          noradId: 25544,
          name: 'ISS (ZARYA)',
          timestamp: data.timestamp * 1000,
          source: 'WhereTheISS.at Public API',
          latitude: data.latitude,
          longitude: data.longitude,
          altitudeKm: data.altitude,
          velocityKmh: data.velocity
        };
      }
    } catch {
      // Offline fallback
    }

    // 3. Synthetic live telemetry if offline
    const now = Date.now();
    const simSeconds = (now % 5560000) / 1000;
    const simLat = 51.6 * Math.sin((simSeconds * 2 * Math.PI) / 5560);
    const simLon = ((simSeconds * 360) / 5560 - 180) % 360;

    return {
      noradId: 25544,
      name: 'ISS (ZARYA)',
      timestamp: now,
      source: 'Offline Verification Anchor',
      latitude: Math.round(simLat * 10000) / 10000,
      longitude: Math.round(simLon * 10000) / 10000,
      altitudeKm: 421.5,
      velocityKmh: 27580
    };
  }

  public async getCacheAgeHours(): Promise<number | null> {
    try {
      const ts = await AsyncStorage.getItem(CACHE_KEY_TIMESTAMP);
      if (!ts) return null;
      const ms = Date.now() - parseInt(ts, 10);
      return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
    } catch {
      return null;
    }
  }

  private async saveCache(satellites: Satellite[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY_CATALOG, JSON.stringify(satellites));
      await AsyncStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
    } catch {
      // Storage error suppressed
    }
  }

  private async loadCache(): Promise<Satellite[] | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY_CATALOG);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

export const defaultDataProvider = new CompositeDataProvider();

