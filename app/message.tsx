import BackButton from '@/components/BackButton';
import { WHOOP_API, whoopFetch } from "@/components/Whoop";
import { colors } from '@/constants/theme';
import { router } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { useLocalSearchParams } from "expo-router";




const PROXY_URL = 'https://p8080.m1043.opf-testnet-rofl-25.rofl.app'; // <-- your proxy domain
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

type Message = { id: string; sender: 'user' | 'ai'; text: string };

export default function MessageScreen() {
  const { thread_id } = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  // ---------------- Whoop data fetching ----------------
  const [profile, setProfile] = useState<any>(null);
  const [recovery, setRecovery] = useState<any>(null);
  const [sleeps, setSleeps] = useState<any[]>([]);
  const [cycle, setCycle] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);


  useEffect(() => {
    loadData()
  }, []);

  const loadData = async () => {
    setErr(null);
    setLoading(true);
    try {
      const p = await whoopFetch(WHOOP_API.endpoints.profile);
      setProfile(p);

      const rec = await whoopFetch(`${WHOOP_API.endpoints.recoveries}?limit=1`);
      setRecovery(rec.records?.[0] ?? null);

      const sl = await whoopFetch(`${WHOOP_API.endpoints.sleeps}?limit=10`);
      setSleeps(sl.records ?? []);

      const cy = await whoopFetch(`${WHOOP_API.endpoints.cycles}?limit=1`);
      setCycle(cy.records?.[0] ?? null);

      const wk = await whoopFetch(`${WHOOP_API.endpoints.workouts}?limit=5`);
      setWorkouts(wk.records ?? []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };


  const loadHistory = useCallback(async () => {
  try {
    const res = await fetch(`${PROXY_URL}/history/user_abc_kyc_flow`);
    const data = await res.json();

    if (data.messages?.length > 0) {
      const formatted = data.messages.map((msg: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        sender: msg.role === "user" ? "user" : "ai",
        text: msg.content,
      }));

      setMessages(formatted);
    }
  } catch (err) {
    console.warn("Failed to load history:", err);
  }
}, []);

  // ---------------- send message ----------------
  const sendMessage = useCallback(async () => {
  if (!message.trim()) return;

  const text = message.trim();
  setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
  setMessage('');
  setIsTyping(true);

  try {
    const res = await fetch(`${PROXY_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id,
        message: text,               // ✅ THIS FIXES THE ISSUE
      }),
    });

    const data = await res.json();

    if (data.reply) {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-ai`,
        sender: 'ai',
        text: data.reply
      }]);
    }
  } catch (err) {
    console.error('Send failed:', err);
    setMessages(prev => [...prev, {
      id: `${Date.now()}-err`,
      sender: 'ai',
      text: '⚠️ Failed to reach backend.'
    }]);
  } finally {
    setIsTyping(false);
  }
}, [message]);

  useEffect(() => {
    loadHistory();
  }, []);

  // ---------------- keyboard animation ----------------
  useEffect(() => {
    let showSub: any, hideSub: any;
    if (Platform.OS === 'ios') {
      showSub = Keyboard.addListener('keyboardWillShow', (e: any) => {
        Animated.timing(keyboardOffset, {
          toValue: e.endCoordinates.height,
          duration: e.duration,
          useNativeDriver: false,
        }).start();
      });
      hideSub = Keyboard.addListener('keyboardWillHide', (e: any) => {
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: e.duration,
          useNativeDriver: false,
        }).start();
      });
    } else {
      showSub = Keyboard.addListener('keyboardDidShow', (e: any) => {
        Animated.timing(keyboardOffset, {
          toValue: e.endCoordinates.height,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
      hideSub = Keyboard.addListener('keyboardDidHide', () => {
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
    }
    return () => {
      showSub?.remove();
      hideSub?.remove();
    };
  }, [keyboardOffset]);

  // ---------------- render ----------------
  return (
    <>
      <Modal visible={isLoading} animationType="fade" transparent>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Connecting...</Text>
          </View>
        </View>
      </Modal>

      <Animated.View style={{ flex: 1, paddingBottom: keyboardOffset, backgroundColor: colors.white }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton iconSize={12} onPress={() => router.back()} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Chat with Zeph AI</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          {/* Chat messages */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <View key={msg.id} style={[styles.bubbleRow, isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                  <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
                    <Text style={styles.bubbleText}>{msg.text}</Text>
                  </View>
                </View>
              );
            })}
            {isTyping && (
              <View style={[styles.bubbleRow, { justifyContent: 'flex-start', marginTop: 8 }]}>
                <View style={[styles.bubble, styles.bubbleAI]}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              </View>

            )}
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Message..."
              placeholderTextColor="#888"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
              <Icons.PaperPlaneTilt size={24} color={colors.primary} weight="fill" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  loadingBox: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.neutral900 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 20 },
  bubbleRow: { flexDirection: 'row', marginVertical: 4 },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: colors.primary },
  bubbleAI: { backgroundColor: colors.neutral800 },
  bubbleText: { fontSize: 16, color: '#fff' },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 10, margin: 10, borderWidth: 1.5, borderColor: colors.neutral300, borderRadius: 20, paddingHorizontal: 10 },
  input: { flex: 1, fontSize: 16, color: colors.neutral900, paddingVertical: 8, marginHorizontal: 10},
  sendBtn: { padding: 6 },
});
