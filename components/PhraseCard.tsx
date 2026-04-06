/**
 * PhraseCard — Reusable Arabic phrase display
 * Arabic text, transliteration, English, audio button, category
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { speakArabic } from '@/services/speechService';

interface PhraseCardProps {
  arabic: string;
  transliteration: string;
  english: string;
  category?: string;
  showEnglish?: boolean;
  onTap?: () => void;
  size?: 'sm' | 'md' | 'lg';
  style?: object;
}

export default function PhraseCard({
  arabic,
  transliteration,
  english,
  category,
  showEnglish = true,
  onTap,
  size = 'md',
  style,
}: PhraseCardProps) {
  const arabicSize = {
    sm: FontSize.arabic,
    md: FontSize.arabicLarge,
    lg: FontSize.arabicHero,
  }[size];

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onTap}
      activeOpacity={onTap ? 0.7 : 1}
      disabled={!onTap}
    >
      {category && (
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      )}

      <Text
        style={[
          styles.arabic,
          { fontSize: arabic.length > 10 ? arabicSize * 0.7 : arabicSize },
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {arabic}
      </Text>
      <Text style={styles.transliteration}>{transliteration}</Text>

      {showEnglish && <Text style={styles.english}>{english}</Text>}

      <TouchableOpacity
        style={styles.audioBtn}
        onPress={() => speakArabic(arabic)}
        activeOpacity={0.7}
      >
        <Ionicons name="volume-medium" size={18} color={Colors.primary} />
        <Text style={styles.audioText}>Listen</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  categoryPill: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  arabic: {
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  transliteration: {
    fontSize: FontSize.md,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  english: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  audioText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
});
