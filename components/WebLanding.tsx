import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { StyleSheet } from 'react-native';

export const WebLanding = () => {
  return (
    <ScrollView style={styles.fullWidthContainer}>
      <View style={[sharedStyles.container, sharedStyles.webContainer, styles.innerContainer]}>
        {/* Hero Section */}
      <View style={[sharedStyles.center, styles.heroSection]}>
        <Ionicons 
          name="restaurant" 
          size={theme.fontSize.hero} 
          color={theme.colors.primary}
          style={styles.heroIcon}
        />
        <Text style={styles.heroTitle}>Welcome to Fridge Friend</Text>
        <Text style={sharedStyles.subtitle}>
          Your smart kitchen companion for tracking ingredients and reducing food waste
        </Text>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <FeatureCard
          icon="time-outline"
          title="Track Expiry Dates"
          description="Never waste food again with smart expiry date tracking"
        />
        <FeatureCard
          icon="notifications-outline"
          title="Get Reminders"
          description="Receive alerts when ingredients are about to expire"
        />
        <FeatureCard
          icon="list-outline"
          title="Organize Items"
          description="Keep your ingredients organized by categories"
        />
      </View>

      {/* Download Section */}
      <View style={[sharedStyles.center, styles.downloadSection]}>
        <Text style={styles.downloadTitle}>Get Started Today</Text>
        <Text style={[sharedStyles.bodyText, styles.downloadText]}>
          Download Fridge Friend on your mobile device to start tracking your ingredients
        </Text>
        <View style={styles.storeButtons}>
          <StoreButton icon="logo-apple" text="App Store" />
          <StoreButton icon="logo-google-playstore" text="Play Store" />
        </View>
      </View>
    </View>
    </ScrollView>
  );
};

const FeatureCard = ({ icon, title, description }: { 
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
}) => (
  <View style={[sharedStyles.card, styles.featureCard]}>
    <Ionicons name={icon} size={theme.fontSize.xxxl} color={theme.colors.primary} />
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={sharedStyles.bodyText}>{description}</Text>
  </View>
);

const StoreButton = ({ icon, text }: { 
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
}) => (
  <Pressable style={styles.storeButton}>
    <Ionicons name={icon} size={theme.fontSize.xl} color={theme.colors.text.primary} />
    <Text style={styles.storeButtonText}>{text}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  fullWidthContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    alignSelf: 'center',
    width: '100%',
  },
  heroSection: {
    marginBottom: theme.spacing.xl * 2,
  },
  heroIcon: {
    marginBottom: theme.spacing.xl,
  },
  heroTitle: {
    fontSize: theme.fontSize.hero,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.xl * 2,
    flexWrap: 'wrap',
  },
  featureCard: {
    alignItems: 'center',
    width: '30%',
    minWidth: 280,
  },
  featureTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  downloadSection: {
    marginTop: theme.spacing.xl,
  },
  downloadTitle: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  downloadText: {
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  storeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  storeButton: {
    backgroundColor: theme.colors.background.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    minWidth: 160,
    justifyContent: 'center',
  },
  storeButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});