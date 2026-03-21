import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { typography } from '../theme/typography';

const { width, height } = Dimensions.get('window');

const PREMIUM_FEATURES = [
    {
        icon: 'sparkles',
        title: 'Advanced Bible AI',
        desc: 'Access smarter, deeper theological responses with unlimited daily interactions.'
    },
    {
        icon: 'headset',
        title: 'Audio Devotionals',
        desc: 'Listen to beautifully narrated daily verses and guided prayers on the go.'
    },
    {
        icon: 'color-palette',
        title: 'Custom Themes',
        desc: 'Unlock exclusive reading themes and personalize your app aesthetic.'
    },
    {
        icon: 'cellular',
        title: 'Offline Access',
        desc: 'Download verses, prayers, and your chat history for offline reading.'
    }
];

export default function PremiumScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { theme } = useApp();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

    const handleSubscribe = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        alert('Subscription successful! Welcome to Premium.');
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1438283173091-5dbf5c5a3206?q=80&w=800&auto=format&fit=crop' }}
                style={StyleSheet.absoluteFillObject}
            >
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 20, 35, 0.7)' }]} />
                <LinearGradient
                    colors={['transparent', 'rgba(10, 20, 35, 0.9)', '#0A1423']}
                    style={StyleSheet.absoluteFillObject}
                />
            </ImageBackground>

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <BlurView intensity={40} tint="light" style={styles.closeBtnGlass}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </BlurView>
                </TouchableOpacity>
                <View style={styles.proBadge}>
                    <Ionicons name="star" size={14} color="#C9A227" />
                    <Text style={styles.proText}>PRO</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            >
                {/* Title Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>Deepen Your</Text>
                    <Text style={styles.heroTitleAccent}>Spiritual Journey</Text>
                    <Text style={styles.heroSubtitle}>
                        Unlock the full potential of BibleGuide AI with exclusive features designed for reflection and growth.
                    </Text>
                </View>

                {/* Features List */}
                <View style={styles.featuresContainer}>
                    {PREMIUM_FEATURES.map((feat, index) => (
                        <View key={index} style={styles.featureRow}>
                            <View style={styles.featureIconWrap}>
                                <Ionicons name={feat.icon as any} size={22} color="#C9A227" />
                            </View>
                            <View style={styles.featureTextWrap}>
                                <Text style={styles.featureTitle}>{feat.title}</Text>
                                <Text style={styles.featureDesc}>{feat.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Pricing Cards */}
                <View style={styles.pricingContainer}>
                    {/* Monthly */}
                    <TouchableOpacity
                        style={[styles.planCardBase, selectedPlan === 'monthly' && styles.planCardActive]}
                        activeOpacity={0.9}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedPlan('monthly');
                        }}
                    >
                        <BlurView intensity={40} tint="dark" style={styles.planCardGlass}>
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>Monthly</Text>
                                {selectedPlan === 'monthly' && (
                                    <Ionicons name="checkmark-circle" size={20} color="#5A8DEE" />
                                )}
                            </View>
                            <Text style={styles.planPrice}>$4.99<Text style={styles.planDuration}>/mo</Text></Text>
                        </BlurView>
                    </TouchableOpacity>

                    {/* Yearly */}
                    <TouchableOpacity
                        style={[styles.planCardBase, selectedPlan === 'yearly' && styles.planCardActive]}
                        activeOpacity={0.9}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedPlan('yearly');
                        }}
                    >
                        <BlurView intensity={selectedPlan === 'yearly' ? 80 : 40} tint="dark" style={styles.planCardGlass}>
                            <View style={styles.saveBadge}>
                                <Text style={styles.saveBadgeText}>SAVE 33%</Text>
                            </View>
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>Yearly</Text>
                                {selectedPlan === 'yearly' && (
                                    <Ionicons name="checkmark-circle" size={20} color="#5A8DEE" />
                                )}
                            </View>
                            <Text style={styles.planPrice}>$39.99<Text style={styles.planDuration}>/yr</Text></Text>
                            <Text style={styles.planEquivalent}>Equivalent to $3.33/mo</Text>
                        </BlurView>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Sticky Bottom Actions */}
            <View style={[styles.footer, { paddingBottom: insets.bottom || 24 }]}>
                <Text style={styles.cancelText}>Cancel anytime. Auto-renews.</Text>
                <TouchableOpacity activeOpacity={0.9} onPress={handleSubscribe}>
                    <LinearGradient
                        colors={['#5A8DEE', '#3D6CBA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.subscribeBtn}
                    >
                        <Text style={styles.subscribeBtnText}>
                            Start 7-Day Free Trial
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.legalLinks}>
                    <Text style={styles.legalText}>Terms of Service</Text>
                    <Text style={styles.legalDot}>•</Text>
                    <Text style={styles.legalText}>Privacy Policy</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A1423',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    closeBtn: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    closeBtnGlass: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(201, 162, 39, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(201, 162, 39, 0.3)',
        gap: 4,
    },
    proText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: '#C9A227',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    heroSection: {
        marginBottom: 40,
    },
    heroTitle: {
        fontFamily: 'PlayfairDisplay_600SemiBold',
        fontSize: 38,
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    heroTitleAccent: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 42,
        color: '#C9A227',
        letterSpacing: -1,
        marginBottom: 16,
    },
    heroSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 24,
    },
    featuresContainer: {
        marginBottom: 40,
        gap: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    featureIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(201, 162, 39, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(201, 162, 39, 0.2)',
    },
    featureTextWrap: {
        flex: 1,
    },
    featureTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 4,
    },
    featureDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 20,
    },
    pricingContainer: {
        gap: 16,
    },
    planCardBase: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    planCardActive: {
        borderColor: '#5A8DEE',
        shadowColor: '#5A8DEE',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    planCardGlass: {
        padding: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    planName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    planPrice: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 32,
        color: '#FFFFFF',
    },
    planDuration: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
    },
    planEquivalent: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#4ADE80',
        marginTop: 8,
    },
    saveBadge: {
        position: 'absolute',
        top: -2,
        right: 24,
        backgroundColor: '#5A8DEE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    saveBadgeText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: '#0A1423',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    cancelText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginBottom: 12,
    },
    subscribeBtn: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#5A8DEE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    subscribeBtnText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    legalLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    legalText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
    },
    legalDot: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 10,
    },
});
