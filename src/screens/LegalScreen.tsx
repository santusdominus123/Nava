import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

type LegalRouteParams = {
  Legal: { type: 'terms' | 'privacy' };
};

const TERMS_OF_SERVICE = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using Bible Guide AI ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App. We reserve the right to update or modify these terms at any time, and your continued use of the App constitutes acceptance of any changes.`,
  },
  {
    title: '2. Description of Service',
    body: `Bible Guide AI is a mobile application that provides AI-powered Bible study tools, daily devotionals, guided prayers, reading plans, verse search, and community features. The App is designed to support and enhance your personal Bible study and spiritual growth.`,
  },
  {
    title: '3. User Accounts',
    body: `To access certain features, you must create an account using a valid email address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.\n\nYou agree to provide accurate, current, and complete information during registration and to keep your account information updated.`,
  },
  {
    title: '4. Subscription & Payments',
    body: `Bible Guide AI offers both free and premium subscription tiers. Premium subscriptions are billed on a monthly or yearly basis through your App Store or Google Play account.\n\n• Payment is charged to your account upon confirmation of purchase.\n• Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period.\n• You may manage and cancel your subscription through your device's account settings.\n• Refunds are subject to the policies of the respective app store.`,
  },
  {
    title: '5. User Content',
    body: `You retain ownership of any content you create within the App, including prayer requests, notes, highlights, and chat messages. By using the App, you grant us a limited license to store and process your content solely for the purpose of providing and improving our services.\n\nYou agree not to submit content that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable.`,
  },
  {
    title: '6. AI Disclaimer',
    body: `Bible Guide AI uses artificial intelligence to generate responses to your questions, devotional content, and prayer guidance. Please be aware that:\n\n• AI-generated responses are for educational and informational purposes only.\n• AI responses should not be considered as theological authority, pastoral counsel, or a substitute for professional religious guidance.\n• While we strive for accuracy, AI-generated content may occasionally contain errors or misinterpretations.\n• We encourage you to verify AI responses against Scripture and consult with qualified religious leaders for important theological matters.`,
  },
  {
    title: '7. Prohibited Uses',
    body: `You agree not to use the App to:\n\n• Violate any applicable laws or regulations.\n• Impersonate any person or entity.\n• Distribute spam, malware, or other harmful content.\n• Attempt to gain unauthorized access to the App's systems or other users' accounts.\n• Use the App for any commercial purpose without our prior written consent.\n• Scrape, data mine, or extract content from the App using automated means.\n• Harass, bully, or intimidate other users.`,
  },
  {
    title: '8. Termination',
    body: `We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we determine violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason at our sole discretion.\n\nUpon termination, your right to use the App will immediately cease. Provisions of these terms that by their nature should survive termination will remain in effect.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law, Bible Guide AI and its affiliates, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, goodwill, or profits, arising out of or in connection with your use of the App.\n\nThe App is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied.`,
  },
  {
    title: '10. Contact',
    body: `If you have any questions or concerns about these Terms of Service, please contact us at:\n\nEmail: support@bibleguideai.app\nWebsite: https://bibleguideai.app/support`,
  },
];

const PRIVACY_POLICY = [
  {
    title: '1. Information We Collect',
    body: `We collect the following types of information to provide and improve our services:\n\n• Email Address: Collected during account registration for authentication and communication purposes.\n• Usage Data: Information about how you interact with the App, including features used, session duration, and preferences.\n• Prayer Requests: Content you submit through the guided prayer and prayer journal features.\n• Chat History: Messages and conversations you have with the AI Bible assistant.\n• Device Information: Device type, operating system, and app version for technical support and optimization.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect to:\n\n• Provide, maintain, and improve the App's features and services.\n• Personalize your experience, including devotional content and reading plan recommendations.\n• Process your AI chat requests and generate relevant responses.\n• Send important notifications about your account, reading streaks, and daily reminders.\n• Analyze usage patterns to improve the App's performance and user experience.\n• Respond to your inquiries and provide customer support.`,
  },
  {
    title: '3. Data Storage',
    body: `Your data is stored securely using Supabase, a trusted cloud database platform. We implement the following security measures:\n\n• All data is encrypted in transit using TLS/SSL protocols.\n• Data at rest is encrypted using AES-256 encryption.\n• Row-level security policies ensure that users can only access their own data.\n• Regular security audits and updates are performed to maintain data integrity.\n• Database backups are encrypted and stored in geographically distributed locations.`,
  },
  {
    title: '4. Third-Party Services',
    body: `We use the following third-party services to operate the App:\n\n• OpenAI: Powers the AI chat feature. Your chat messages are sent to OpenAI's API for processing. OpenAI's data usage policies apply to this data. We do not send your personal information to OpenAI beyond the chat content.\n• Supabase: Provides our backend infrastructure, including authentication, database, and real-time features. Supabase's privacy policy governs their handling of data.\n• Expo: Used for push notifications and app updates.\n\nWe carefully select third-party providers that maintain high standards of data protection and privacy.`,
  },
  {
    title: '5. Your Rights',
    body: `In accordance with GDPR and other applicable data protection regulations, you have the following rights:\n\n• Right of Access: You may request a copy of all personal data we hold about you.\n• Right to Deletion: You may request the deletion of your account and all associated data at any time.\n• Right to Portability: You may request your data in a structured, commonly used, and machine-readable format.\n• Right to Rectification: You may update or correct your personal information through your account settings.\n• Right to Restrict Processing: You may request that we limit how we use your data.\n• Right to Object: You may object to certain types of data processing.\n\nTo exercise any of these rights, please contact us at privacy@bibleguideai.app.`,
  },
  {
    title: '6. Children\'s Privacy',
    body: `Bible Guide AI is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information promptly.\n\nIf you are a parent or guardian and believe that your child has provided us with personal information, please contact us at privacy@bibleguideai.app.`,
  },
  {
    title: '7. Data Retention',
    body: `We retain your personal data for as long as your account is active or as needed to provide you with our services. Upon account deletion:\n\n• Your personal profile data is deleted within 30 days.\n• Chat history and prayer requests are permanently deleted within 30 days.\n• Anonymized usage analytics may be retained for service improvement.\n• Backup copies are purged within 90 days of account deletion.\n\nYou may request immediate deletion of all your data by contacting our support team.`,
  },
  {
    title: '8. Changes to Policy',
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:\n\n• Posting the updated policy within the App.\n• Sending a notification to your registered email address.\n• Displaying a prominent notice within the App.\n\nYour continued use of the App after the effective date of any changes constitutes your acceptance of the updated Privacy Policy.`,
  },
  {
    title: '9. Contact',
    body: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:\n\nEmail: privacy@bibleguideai.app\nData Protection Officer: dpo@bibleguideai.app\nWebsite: https://bibleguideai.app/privacy`,
  },
];

export default function LegalScreen() {
  const { theme, darkMode } = useApp();
  const route = useRoute<RouteProp<LegalRouteParams, 'Legal'>>();
  const navigation = useNavigation();
  const { type } = route.params;

  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const sections = isTerms ? TERMS_OF_SERVICE : PRIVACY_POLICY;

  const colors = {
    background: darkMode ? '#0F0F1A' : '#FAFAF8',
    card: darkMode ? '#1A1A2E' : '#FFFFFF',
    text: darkMode ? '#E8E6E1' : '#2D2D2D',
    textSecondary: darkMode ? '#A0A0B0' : '#6B6B6B',
    sectionTitle: darkMode ? '#D4A574' : '#8B6914',
    accent: darkMode ? '#D4A574' : '#8B6914',
    border: darkMode ? '#2A2A3E' : '#E8E4DC',
    headerBg: darkMode ? '#141425' : '#F5F3EE',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {title}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated */}
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last updated: March 2026
        </Text>

        {/* Sections */}
        {sections.map((section, index) => (
          <View
            key={index}
            style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.text }]}>
              {section.body}
            </Text>
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  lastUpdated: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 12,
    lineHeight: 24,
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 40,
  },
});
