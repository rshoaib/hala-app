/**
 * AI Arabic Tutor — Conversational practice with Gemini
 * Desert Gold themed chat with animated typing indicator
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  FontFamily,
  BorderRadius,
  Shadows,
  ClayStyle,
} from '@/constants/theme';
import {
  sendTutorMessage,
  resetTutorChat,
  isAIConfigured,
} from '@/services/aiService';
import { speakArabic } from '@/services/speechService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const SUGGESTIONS = [
  "How do I greet someone in Emirati?",
  "Teach me to order food",
  "How to say 'thank you'?",
  "What's a common UAE expression?",
  "Help me practice introductions",
  "How to ask for directions?",
];

// Animated typing dots component
function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, easing: Easing.ease, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );
    createDotAnim(dot1, 0).start();
    createDotAnim(dot2, 200).start();
    createDotAnim(dot3, 400).start();
  }, []);

  return (
    <View style={styles.typingDots}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            {
              transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
              opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function AITutorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [remainingMsgs, setRemainingMsgs] = useState<number>(-1);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isAIConfigured()) {
      setShowSetupGuide(true);
    } else {
      // Send welcome message
      addBotMessage(
        "هلا! 👋 Welcome! I'm Hala, your Emirati Arabic tutor.\n\nI can help you:\n• 🗣️ Learn everyday Emirati phrases\n• 📝 Practice conversations\n• 🇦🇪 Understand UAE culture\n\nWhat would you like to learn today?"
      );
    }
  }, []);

  function addBotMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text, isUser: false, timestamp: new Date() },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function handleSend(customText?: string) {
    const messageText = customText || input.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Get AI response
    try {
      const response = await sendTutorMessage(messageText);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleNewChat() {
    resetTutorChat();
    setMessages([]);
    addBotMessage(
      "هلا! 👋 Fresh start! What would you like to learn about Emirati Arabic today?"
    );
  }

  // Extract Arabic text from a message for TTS
  function extractArabic(text: string): string | null {
    const arabicMatch = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+(?:\s+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+)*/);
    return arabicMatch ? arabicMatch[0] : null;
  }

  // ── Setup Guide (no API key) ──
  if (showSetupGuide) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'AI Tutor',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
        <View style={styles.setupContainer}>
          <View style={styles.setupIconCircle}>
            <Text style={styles.setupEmoji}>🤖</Text>
          </View>
          <Text style={styles.setupTitle}>Set Up AI Tutor</Text>
          <Text style={styles.setupDesc}>
            To use the AI Arabic Tutor, you need a free Gemini API key.
          </Text>

          <View style={styles.setupSteps}>
            {[
              { step: '1', text: 'Go to aistudio.google.com/apikey', icon: '🌐' },
              { step: '2', text: 'Create a free API key', icon: '🔑' },
              { step: '3', text: 'Add it to constants/aiConfig.ts', icon: '📝' },
            ].map((item, i) => (
              <View key={i} style={styles.setupStepCard}>
                <View style={styles.setupStepNumber}>
                  <Text style={styles.setupStepNumberText}>{item.step}</Text>
                </View>
                <Text style={styles.setupStepText}>{item.text}</Text>
                <Text style={styles.setupStepIcon}>{item.icon}</Text>
              </View>
            ))}
          </View>

          <View style={styles.setupNoteCard}>
            <Ionicons name="sparkles" size={16} color={Colors.primary} />
            <Text style={styles.setupNote}>
              Completely free — no credit card needed!
            </Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'AI Tutor',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleNewChat} style={styles.headerBtn}>
              <Ionicons name="refresh" size={20} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageContent}
        >
          {/* Messages */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.isUser ? styles.userBubble : styles.botBubble,
              ]}
            >
              {!msg.isUser && (
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarText}>هلا</Text>
                </View>
              )}
              <View
                style={[
                  styles.messageCard,
                  msg.isUser ? styles.userMessageCard : styles.botMessageCard,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.isUser && styles.userMessageText,
                  ]}
                >
                  {msg.text}
                </Text>

                {/* TTS button for bot messages with Arabic */}
                {!msg.isUser && extractArabic(msg.text) && (
                  <TouchableOpacity
                    style={styles.ttsBtn}
                    onPress={() => {
                      const arabic = extractArabic(msg.text);
                      if (arabic) speakArabic(arabic);
                    }}
                  >
                    <View style={styles.ttsBtnInner}>
                      <Ionicons name="volume-medium" size={14} color={Colors.primary} />
                      <Text style={styles.ttsBtnText}>Listen</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {/* Typing indicator with animated dots */}
          {isLoading && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>هلا</Text>
              </View>
              <View style={[styles.messageCard, styles.botMessageCard, styles.typingCard]}>
                <TypingDots />
              </View>
            </View>
          )}

          {/* Suggestion chips (show when no messages or just welcome) */}
          {messages.length <= 1 && !isLoading && (
            <View style={styles.suggestionsWrap}>
              <Text style={styles.suggestionsTitle}>Try asking:</Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => handleSend(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask me anything in Emirati Arabic..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            {input.trim() && !isLoading ? (
              <View style={[styles.sendBtnInner, styles.sendBtnActive]}>
                <Ionicons name="send" size={18} color="#FFF" />
              </View>
            ) : (
              <View style={styles.sendBtnInner}>
                <Ionicons name="send" size={18} color={Colors.textMuted} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    marginRight: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
    ...Shadows.soft,
  },
  botAvatarText: {
    fontSize: 11,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
    color: '#FFF',
  },
  messageCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    maxWidth: '100%',
  },
  userMessageCard: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: BorderRadius.sm,
    ...Shadows.card,
  },
  botMessageCard: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surface,
    ...Shadows.card,
  },
  messageText: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFF',
  },
  ttsBtn: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  ttsBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  ttsBtnText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  typingCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 20,
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  suggestionsWrap: {
    marginTop: Spacing.lg,
  },
  suggestionsTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    ...Shadows.soft,
  },
  suggestionText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.text,
    fontSize: FontSize.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 1,
  },
  sendBtnInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
  },

  // ── Setup Guide ──
  setupContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  setupIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  setupEmoji: {
    fontSize: 48,
  },
  setupTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
  },
  setupDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  setupSteps: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    width: '100%',
  },
  setupStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.card,
  },
  setupStepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupStepNumberText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  setupStepText: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  setupStepIcon: {
    fontSize: 20,
  },
  setupNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  setupNote: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
