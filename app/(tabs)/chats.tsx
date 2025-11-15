import BackButton from '@/components/BackButton'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import * as Icons from "phosphor-react-native"
import React, { useCallback, useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'


const PROXY_URL = 'https://p8080.m1006.opf-testnet-rofl-25.rofl.app'

export default function AllChats() {
  const [threads, setThreads] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // ✅ load threads from ROFL backend (RAM-only threads)
  const loadThreads = async () => {
    try {
      const res = await fetch(`${PROXY_URL}/threads`);
      console.log("Threads response raw:", res);   // ← helps debug

      const data = await res.json();
      console.log("Parsed threads:", data);        // ← this should show { threads: [...] }

      if (data.threads) setThreads(data.threads);
    } catch (err) {
      console.warn("Failed to load threads:", err);
    }
  };

  useFocusEffect(
  useCallback(() => {
    loadThreads();   // 🔥 called every time screen is shown (e.g. when navigating back)
  }, [])
);
  const filteredThreads = threads.filter(t =>
    t.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton iconSize={12} />
          <Text style={styles.headerTitle}>Conversations</Text>
          <View />
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBar}>
          <Icons.MagnifyingGlass size={20} color={colors.black} weight='bold'/>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={colors.neutral400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* THREAD LIST */}
        <ScrollView contentContainerStyle={styles.scrollViewStyle} showsVerticalScrollIndicator={false}>
          {filteredThreads.length === 0 ? (
            <Text style={{ color: colors.neutral500, marginTop: 40, textAlign: 'center' }}>
              No conversations yet.
            </Text>
          ) : (
            filteredThreads.map((threadId) => (
              <TouchableOpacity
                key={threadId}
                onPress={() => router.push(`/message?thread_id=${threadId}`)}
                style={styles.threadCard}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icons.ChatCircleDots size={22} color={colors.neutral500} />
                  <Text style={styles.threadTitle}>{threadId}</Text>
                </View>

                <Icons.ArrowRight size={18} color={colors.neutral900} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  header: { flexDirection: 'row', alignItems: 'center', marginVertical: spacingY._10, justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.black },
  searchBar: {
    height: verticalScale(20),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
    
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.black },
  scrollViewStyle: { flexGrow: 1, gap: 16 },
  threadCard: {
    backgroundColor: colors.neutral100,
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  threadTitle: { fontSize: 16, fontWeight: '600', color: colors.neutral900 },
})
