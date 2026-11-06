import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors.ts';
import { useSatelliteStore } from '../../src/stores/satelliteStore.ts';
import type { Satellite, ConstellationGroup } from '../../src/types/satellite.ts';

const CONSTELLATIONS: Array<{ key: ConstellationGroup; label: string }> = [
  { key: 'ALL', label: 'All Satellites' },
  { key: 'STARLINK', label: 'Starlink Swarm' },
  { key: 'STATIONS', label: 'Space Stations' },
  { key: 'SCIENCE', label: 'Science / Observatories' },
  { key: 'NAVIGATION', label: 'GPS / Navigation' },
  { key: 'WEATHER', label: 'NOAA Weather' }
];

export default function CatalogScreen() {
  const router = useRouter();
  const {
    satellites,
    selectedSatellite,
    selectSatellite,
    constellationFilter,
    setConstellationFilter,
    searchQuery,
    setSearchQuery,
    loadCatalog,
    isLoading
  } = useSatelliteStore();

  const [expandedNoradId, setExpandedNoradId] = useState<number | null>(null);

  // Filtered list
  const filteredList = satellites.filter((sat) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      sat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sat.noradId.toString().includes(searchQuery.trim()) ||
      (sat.intlDesig && sat.intlDesig.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const getAgeInHours = (updatedAt: number): number => {
    return Math.round(((Date.now() - updatedAt) / (1000 * 60 * 60)) * 10) / 10;
  };

  const renderSatelliteCard = ({ item }: { item: Satellite }) => {
    const isSelected = selectedSatellite?.noradId === item.noradId;
    const isExpanded = expandedNoradId === item.noradId;
    const ageHours = getAgeInHours(item.updatedAt);
    const isStale = ageHours > 24;

    let badgeColor = colors.primary;
    if (item.constellation === 'STARLINK') badgeColor = colors.starlinkDot;
    else if (item.constellation === 'STATIONS') badgeColor = colors.accent;
    else if (item.constellation === 'NAVIGATION') badgeColor = colors.warning;
    else if (item.constellation === 'WEATHER') badgeColor = colors.info;

    return (
      <View style={[styles.satCard, isSelected && styles.satCardSelected]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.satName}>{item.name}</Text>
            <Text style={styles.satMeta}>
              NORAD {item.noradId} • {item.intlDesig || 'N/A'} • {item.source}
            </Text>
          </View>

          <View style={[styles.constellationBadge, { borderColor: badgeColor }]}>
            <Text style={[styles.constellationText, { color: badgeColor }]}>
              {item.constellation}
            </Text>
          </View>
        </View>

        {/* TLE Age & Staleness Alert Badge (RF-16) */}
        <View style={styles.ageRow}>
          <View
            style={[
              styles.stalenessIndicator,
              { backgroundColor: isStale ? colors.danger : colors.success }
            ]}
          />
          <Text style={[styles.ageText, isStale && { color: colors.danger }]}>
            {isStale
              ? `STALE TLE (${ageHours}h old) — Refresh recommended`
              : `FRESH TLE (${ageHours}h old) • SGP4 Valid`}
          </Text>
        </View>

        {/* Expandable TLE Lines */}
        {isExpanded && (
          <View style={styles.tleContainer}>
            <Text style={styles.tleText}>{item.tleLine1}</Text>
            <Text style={styles.tleText}>{item.tleLine2}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setExpandedNoradId(isExpanded ? null : item.noradId)}
          >
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'code-slash-outline'}
              size={13}
              color={colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Hide TLE' : 'View TLE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectButton,
              isSelected && { backgroundColor: colors.surfaceLight }
            ]}
            onPress={() => {
              selectSatellite(item);
              router.push('/(tabs)');
            }}
          >
            <Ionicons
              name={isSelected ? 'checkmark' : 'locate-outline'}
              size={14}
              color={isSelected ? colors.success : '#000000'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.selectButtonText,
                isSelected && { color: colors.success }
              ]}
            >
              {isSelected ? 'Active Target' : 'Track on Map'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Orbital Object Catalog
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            CelesTrak GP & SupGP • {filteredList.length} Objects Tracked
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadCatalog()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={18} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by satellite name or NORAD ID..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Constellation Filter Chips */}
      <View style={styles.chipsContainer}>
        <FlatList
          horizontal
          data={CONSTELLATIONS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          renderItem={({ item }) => {
            const isActive = constellationFilter === item.key;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setConstellationFilter(item.key)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Satellite List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.noradId.toString()}
        renderItem={renderSatelliteCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Satellites Found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with another keyword or change constellation filter.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 10
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  refreshButton: {
    padding: 6
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    padding: 0
  },
  chipsContainer: {
    marginVertical: 10
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  chipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: 'bold'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8
  },
  satCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  satCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8
  },
  satName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold'
  },
  satMeta: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginTop: 2
  },
  constellationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  constellationText: {
    fontSize: 9.5,
    fontWeight: 'bold'
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  stalenessIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  ageText: {
    color: colors.textSecondary,
    fontSize: 10.5
  },
  tleContainer: {
    backgroundColor: '#050811',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#111D33'
  },
  tleText: {
    color: '#00E5FF',
    fontFamily: 'monospace',
    fontSize: 9.5,
    lineHeight: 14
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  expandButtonText: {
    color: colors.textSecondary,
    fontSize: 11
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14
  },
  selectButtonText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20
  }
});

