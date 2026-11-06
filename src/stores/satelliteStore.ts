import { create } from 'zustand';
import { defaultDataProvider, ValidationTelemetry } from '../services/data/dataProvider.ts';
import {
  initSatrec,
  getGeodeticPosition,
  getLookAngles,
  calculateFootprintRadiusKm,
  generateGroundTrackSegments
} from '../algorithms/orbitalMath.ts';
import { predictSatellitePasses } from '../algorithms/passPrediction.ts';
import { calculateHaversineDistanceKm } from '../../backend/src/utils/geoMath.ts';
import { PassNotifier } from '../services/notifications/passNotifier.ts';
import type {
  Satellite,
  ConstellationGroup,
  GeodeticPosition,
  LookAngles,
  ObserverLocation,
  PassPrediction,
  GroundTrackSegment
} from '../types/satellite.ts';

interface StarlinkPoint {
  noradId: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface SatelliteStoreState {
  satellites: Satellite[];
  selectedSatellite: Satellite | null;
  constellationFilter: ConstellationGroup;
  searchQuery: string;
  
  // Ground observer
  observerLocation: ObserverLocation;
  minElevationDeg: number;

  // Real-time orbital metrics (updated every tick)
  currentPosition: GeodeticPosition | null;
  lookAngles: LookAngles | null;
  groundTrackSegments: GroundTrackSegment[];
  footprintRadiusKm: number;

  // Predictions and passes
  upcomingPasses: PassPrediction[];
  scheduledPassIds: Record<string, string>; // passId -> notificationId

  // Constellation swarm layer (Starlink)
  isStarlinkLayerActive: boolean;
  starlinkSwarmPositions: StarlinkPoint[];

  // Scientific validation module
  validationTelemetry: ValidationTelemetry | null;
  validationErrorKm: number | null;
  isValidating: boolean;

  isLoading: boolean;
  error: string | null;

  // Actions
  loadCatalog: () => Promise<void>;
  selectSatellite: (satellite: Satellite) => void;
  setConstellationFilter: (filter: ConstellationGroup) => void;
  setSearchQuery: (query: string) => void;
  setObserverLocation: (loc: ObserverLocation) => void;
  setMinElevationDeg: (deg: number) => void;
  toggleStarlinkLayer: () => void;
  tickRealtime: () => void;
  runCrossValidation: () => Promise<void>;
  togglePassReminder: (pass: PassPrediction) => Promise<boolean>;
}

const DEFAULT_OBSERVER: ObserverLocation = {
  latitude: -34.6037,
  longitude: -58.3816,
  altitudeMeters: 25,
  label: 'Buenos Aires, Argentina'
};

export const useSatelliteStore = create<SatelliteStoreState>((set, get) => ({
  satellites: [],
  selectedSatellite: null,
  constellationFilter: 'ALL',
  searchQuery: '',
  
  observerLocation: DEFAULT_OBSERVER,
  minElevationDeg: 10,

  currentPosition: null,
  lookAngles: null,
  groundTrackSegments: [],
  footprintRadiusKm: 0,

  upcomingPasses: [],
  scheduledPassIds: {},

  isStarlinkLayerActive: true,
  starlinkSwarmPositions: [],

  validationTelemetry: null,
  validationErrorKm: null,
  isValidating: false,

  isLoading: false,
  error: null,

  loadCatalog: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await defaultDataProvider.getCatalog(get().constellationFilter);
      const currentSelected = get().selectedSatellite;
      
      // Default to ISS (NORAD 25544) if nothing is selected
      let selected = currentSelected;
      if (!selected && list.length > 0) {
        selected = list.find(s => s.noradId === 25544) || list[0];
      }

      set({ satellites: list, selectedSatellite: selected, isLoading: false });
      
      // Compute initial tracking for selected
      if (selected) {
        get().selectSatellite(selected);
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectSatellite: (satellite: Satellite) => {
    set({ selectedSatellite: satellite });

    const satrec = initSatrec(satellite.tleLine1, satellite.tleLine2);
    const now = new Date();

    const currentPosition = getGeodeticPosition(satrec, now);
    const lookAngles = getLookAngles(satrec, get().observerLocation, now);
    const footprintRadiusKm = currentPosition
      ? calculateFootprintRadiusKm(currentPosition.altitudeKm, get().minElevationDeg)
      : 0;

    const groundTrackSegments = generateGroundTrackSegments(
      satrec,
      now,
      45, // 45 min past
      50, // 50 min future
      45  // 45s step
    );

    const upcomingPasses = predictSatellitePasses(
      satrec,
      satellite.name,
      satellite.noradId,
      get().observerLocation,
      now,
      3,
      get().minElevationDeg
    );

    set({
      currentPosition,
      lookAngles,
      footprintRadiusKm,
      groundTrackSegments,
      upcomingPasses
    });
  },

  setConstellationFilter: (filter: ConstellationGroup) => {
    set({ constellationFilter: filter });
    get().loadCatalog();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setObserverLocation: (loc: ObserverLocation) => {
    set({ observerLocation: loc });
    if (get().selectedSatellite) {
      get().selectSatellite(get().selectedSatellite!);
    }
  },

  setMinElevationDeg: (deg: number) => {
    set({ minElevationDeg: deg });
    if (get().selectedSatellite) {
      get().selectSatellite(get().selectedSatellite!);
    }
  },

  toggleStarlinkLayer: () => {
    set(state => ({ isStarlinkLayerActive: !state.isStarlinkLayerActive }));
  },

  tickRealtime: () => {
    const { selectedSatellite, observerLocation, minElevationDeg, isStarlinkLayerActive, satellites } = get();
    const now = new Date();

    if (selectedSatellite) {
      const satrec = initSatrec(selectedSatellite.tleLine1, selectedSatellite.tleLine2);
      const currentPosition = getGeodeticPosition(satrec, now);
      const lookAngles = getLookAngles(satrec, observerLocation, now);
      const footprintRadiusKm = currentPosition
        ? calculateFootprintRadiusKm(currentPosition.altitudeKm, minElevationDeg)
        : 0;

      set({ currentPosition, lookAngles, footprintRadiusKm });
    }

    // Update Starlink swarm positions if layer is enabled
    if (isStarlinkLayerActive) {
      const starlinks = satellites.filter(s => s.constellation === 'STARLINK');
      const swarm: StarlinkPoint[] = [];

      for (const st of starlinks) {
        try {
          const srec = initSatrec(st.tleLine1, st.tleLine2);
          const pos = getGeodeticPosition(srec, now);
          if (pos) {
            swarm.push({
              noradId: st.noradId,
              name: st.name,
              latitude: pos.latitude,
              longitude: pos.longitude
            });
          }
        } catch {
          // ignore single sat error
        }
      }

      set({ starlinkSwarmPositions: swarm });
    }
  },

  runCrossValidation: async () => {
    set({ isValidating: true });
    try {
      const liveTelemetry = await defaultDataProvider.getIssValidationTelemetry();
      
      // Calculate local SGP4 position for the exact telemetry timestamp
      const issSatellite = get().satellites.find(s => s.noradId === 25544) || get().selectedSatellite;
      if (issSatellite) {
        const satrec = initSatrec(issSatellite.tleLine1, issSatellite.tleLine2);
        const localPos = getGeodeticPosition(satrec, new Date(liveTelemetry.timestamp));

        if (localPos) {
          const errorKm = calculateHaversineDistanceKm(
            localPos.latitude,
            localPos.longitude,
            liveTelemetry.latitude,
            liveTelemetry.longitude
          );

          set({
            validationTelemetry: liveTelemetry,
            validationErrorKm: errorKm,
            isValidating: false
          });
          return;
        }
      }

      set({ validationTelemetry: liveTelemetry, validationErrorKm: null, isValidating: false });
    } catch {
      set({ isValidating: false });
    }
  },

  togglePassReminder: async (pass: PassPrediction) => {
    const { scheduledPassIds } = get();
    const existingNotificationId = scheduledPassIds[pass.id];

    if (existingNotificationId) {
      await PassNotifier.cancelNotification(existingNotificationId);
      const updated = { ...scheduledPassIds };
      delete updated[pass.id];
      set({ scheduledPassIds: updated });
      return false;
    } else {
      await PassNotifier.requestPermissions();
      const notificationId = await PassNotifier.schedulePassNotification(pass, 5);
      if (notificationId) {
        set({
          scheduledPassIds: {
            ...scheduledPassIds,
            [pass.id]: notificationId
          }
        });
        return true;
      }
      return false;
    }
  }
}));

