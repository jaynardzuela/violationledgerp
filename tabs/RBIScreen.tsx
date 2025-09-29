import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

type Resident = {
  id: string;
  name: string;
  street: string;
  sector: string;
};

// Mock residents (replace with backend/store later)
const RESIDENTS: Resident[] = [
  { id: '1', name: 'Juan Dela Cruz', street: 'Mabini St', sector: 'Sector A' },
  { id: '2', name: 'Maria Santos', street: 'Rizal Ave', sector: 'Sector B' },
  { id: '3', name: 'Pedro Pascual', street: 'Bonifacio St', sector: 'Sector A' },
  { id: '4', name: 'Ana Reyes', street: 'Roxas Blvd', sector: 'Sector C' },
  { id: '5', name: 'Luis Fernandez', street: 'San Juan St', sector: 'Sector B' },
];

export default function RBIScreen() {
  const [query, setQuery] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(true); // Name sorter A→Z
  const [streetFilter, setStreetFilter] = useState<string>('All');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [openStreet, setOpenStreet] = useState<boolean>(false);
  const [openSector, setOpenSector] = useState<boolean>(false);

  const streets = useMemo(() => ['All', ...Array.from(new Set(RESIDENTS.map(r => r.street))).sort()], []);
  const sectors = useMemo(() => ['All', ...Array.from(new Set(RESIDENTS.map(r => r.sector))).sort()], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = RESIDENTS.filter((r) => {
      // text filter by name/street
      const byName = r.name.toLowerCase().includes(q);
      const byStreet = r.street.toLowerCase().includes(q);
      const textOk = q.length === 0 ? true : (byName || byStreet);
      // street filter
      const streetOk = streetFilter === 'All' ? true : r.street === streetFilter;
      // sector filter
      const sectorOk = sectorFilter === 'All' ? true : r.sector === sectorFilter;
      return textOk && streetOk && sectorOk;
    });
    // sort by name
    return base.sort((a, b) => sortAsc
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
    );
  }, [query, sortAsc, streetFilter, sectorFilter]);

  const renderItem = ({ item }: { item: Resident }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.name]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.cell, styles.street]} numberOfLines={1}>{item.street}</Text>
      <Text style={[styles.cell, styles.sector]} numberOfLines={1}>{item.sector}</Text>
    </View>
  );

  const keyExtractor = (item: Resident) => item.id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Resident Database (RBI)</Text>
        <Text style={styles.subtitle}>Search by Name or Street</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search residents (name or street)…"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholderTextColor="#99A2B3"
          autoCapitalize="words"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filters: Name (A–Z), Street dropdown, Sector dropdown */}
      <View style={styles.filtersBar}>
        {/* Name Sort */}
        <TouchableOpacity
          onPress={() => setSortAsc((s) => !s)}
          style={[styles.filterPill, styles.filterPillAccent]}
          activeOpacity={0.85}
        >
          <Text style={styles.filterPillText}>Name {sortAsc ? '(A–Z)' : '(Z–A)'}</Text>
        </TouchableOpacity>

        {/* Street Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            onPress={() => { setOpenStreet((o) => !o); setOpenSector(false); }}
            style={styles.dropdownButton}
            activeOpacity={0.85}
          >
            <Text style={styles.dropdownButtonText}>Street: {streetFilter}</Text>
            <Text style={styles.dropdownChevron}>{openStreet ? '▴' : '▾'}</Text>
          </TouchableOpacity>
          {openStreet && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 160 }}>
                {streets.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => { setStreetFilter(s); setOpenStreet(false); }}
                    style={styles.dropdownItem}
                  >
                    <Text style={styles.dropdownItemText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Sector Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            onPress={() => { setOpenSector((o) => !o); setOpenStreet(false); }}
            style={styles.dropdownButton}
            activeOpacity={0.85}
          >
            <Text style={styles.dropdownButtonText}>Sector: {sectorFilter}</Text>
            <Text style={styles.dropdownChevron}>{openSector ? '▴' : '▾'}</Text>
          </TouchableOpacity>
          {openSector && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 160 }}>
                {sectors.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => { setSectorFilter(s); setOpenSector(false); }}
                    style={styles.dropdownItem}
                  >
                    <Text style={styles.dropdownItemText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.name]}>Name</Text>
        <Text style={[styles.headerCell, styles.street]}>Street</Text>
        <Text style={[styles.headerCell, styles.sector]}>Sector</Text>
      </View>

      {/* List / Empty State */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Residents Found</Text>
          <Text style={styles.emptySubtitle}>Try a different name or street.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FC' },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1B2559' },
  subtitle: { marginTop: 2, fontSize: 12, color: '#5B6B92' },

  searchContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E3E8F0',
    color: '#1B2559',
  },

  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EAF1FF',
    borderTopWidth: 1,
    borderTopColor: '#D8E3FF',
    borderBottomWidth: 1,
    borderBottomColor: '#D8E3FF',
  },
  headerCell: { color: '#304675', fontWeight: '700', fontSize: 12 },

  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  cell: { color: '#1B2559', fontSize: 13 },

  name: { flex: 0.45, paddingRight: 8 },
  street: { flex: 0.35, paddingRight: 8 },
  sector: { flex: 0.20 },

  listContent: { paddingBottom: 20 },

  emptyState: { alignItems: 'center', marginTop: 48, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1B2559' },
  emptySubtitle: { marginTop: 6, fontSize: 13, color: '#5B6B92', textAlign: 'center' },
  
  // Filters
  filtersBar: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  filterPill: {
    backgroundColor: '#EAF1FF',
    borderWidth: 1,
    borderColor: '#D8E3FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  filterPillAccent: {
    backgroundColor: '#DDE9FF',
    borderColor: '#BDD3FF',
  },
  filterPillText: { color: '#304675', fontSize: 12, fontWeight: '700' },

  dropdownContainer: { position: 'relative' },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownButtonText: { color: '#1B2559', fontSize: 12, fontWeight: '600' },
  dropdownChevron: { color: '#5B6B92', fontSize: 12 },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    borderRadius: 10,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12 },
  dropdownItemText: { color: '#1B2559', fontSize: 12 },
});

