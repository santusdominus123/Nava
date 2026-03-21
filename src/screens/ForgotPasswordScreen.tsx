import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const { theme, darkMode } = useApp();
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Focus state
    const [emailFocused, setEmailFocused] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;
    const btnScaleAnim = useRef(new Animated.Value(1)).current;
    const successFadeAnim = useRef(new Animated.Value(0)).current;
    const successSlideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 10,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Floating background orbs
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim1, { toValue: 1, duration: 4000, useNativeDriver: true }),
                Animated.timing(floatAnim1, { toValue: 0, duration: 4500, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim2, { toValue: 1, duration: 5000, useNativeDriver: true }),
                Animated.timing(floatAnim2, { toValue: 0, duration: 3500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(btnScaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(btnScaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Required Field', 'Please enter your email address.');
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEmailSent(true);

            // Animate success view in
            Animated.parallel([
                Animated.timing(successFadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(successSlideAnim, {
                    toValue: 0,
                    tension: 12,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } catch (error: any) {
            Alert.alert('Reset Failed', error.message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        Haptics.selectionAsync();
        navigation.goBack();
    };

    const orb1TranslateY = floatAnim1.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -30],
    });

    const orb2TranslateY = floatAnim2.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 40],
    });

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Background Orbs */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1TranslateY }] }]}>
                    <LinearGradient colors={theme.gradient.primary as any} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
                <Animated.View style={[styles.orb2, { transform: [{ translateY: orb2TranslateY }] }]}>
                    <LinearGradient colors={theme.gradient.gold as any} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View style={[styles.contentWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                    {/* Glass Header */}
                    <View style={styles.headerWrap}>
                        <View style={styles.iconBoxOuter}>
                            <BlurView intensity={80} tint="light" style={styles.iconBoxInner}>
                                <Ionicons name="lock-closed" size={42} color={theme.primary} />
                            </BlurView>
                        </View>
                        <Text style={[styles.title, { color: theme.text.primary }]}>
                            Reset Password
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
                            Enter your email and we'll send you a reset link
                        </Text>
                    </View>

                    {/* Glass Form Card */}
                    <BlurView
                        intensity={darkMode ? 40 : 70}
                        tint={darkMode ? 'dark' : 'light'}
                        style={[
                            styles.formGlassWrap,
                            { borderColor: theme.border },
                            darkMode && { backgroundColor: theme.card },
                        ]}
                    >
                        {!emailSent ? (
                            <>
                                {/* Email Input */}
                                <View
                                    style={[
                                        styles.inputBox,
                                        darkMode && { backgroundColor: theme.primary + '20', borderColor: theme.border },
                                        emailFocused && {
                                            borderColor: theme.primary,
                                            backgroundColor: darkMode ? theme.primary + '40' : 'rgba(255,255,255,0.8)',
                                        },
                                    ]}
                                >
                                    <Ionicons name="mail-outline" size={20} color={theme.text.secondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text.primary }]}
                                        placeholder="Email address"
                                        placeholderTextColor={theme.text.light}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        onFocus={() => setEmailFocused(true)}
                                        onBlur={() => setEmailFocused(false)}
                                        selectionColor={theme.primary}
                                    />
                                </View>

                                {/* Submit Button */}
                                <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={handleResetPassword}
                                        onPressIn={handlePressIn}
                                        onPressOut={handlePressOut}
                                        disabled={loading}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={theme.gradient.primary as any}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.btnGradient}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color="#FFF" />
                                            ) : (
                                                <Text style={styles.btnText}>Send Reset Link</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>

                                {/* Back to Sign In */}
                                <TouchableOpacity style={styles.backLinkWrap} onPress={handleGoBack}>
                                    <Text style={[styles.backLinkText, { color: theme.text.primary }]}>
                                        Back to{' '}
                                        <Text style={{ color: theme.primary, fontFamily: 'Inter_700Bold' }}>
                                            Sign In
                                        </Text>
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* Success State */
                            <Animated.View
                                style={[
                                    styles.successWrap,
                                    {
                                        opacity: successFadeAnim,
                                        transform: [{ translateY: successSlideAnim }],
                                    },
                                ]}
                            >
                                <View style={[styles.successIconCircle, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="checkmark-circle" size={64} color={theme.primary} />
                                </View>
                                <Text style={[styles.successTitle, { color: theme.text.primary }]}>
                                    Check Your Email
                                </Text>
                                <Text style={[styles.successMessage, { color: theme.text.secondary }]}>
                                    Check your email for the reset link. If you don't see it, check your spam folder.
                                </Text>

                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={handleGoBack}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={theme.gradient.primary as any}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.btnGradient}
                                    >
                                        <Text style={styles.btnText}>Back to Sign In</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </BlurView>

                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 60,
    },

    // Background Orbs (2 orbs)
    orb1: {
        position: 'absolute',
        top: -height * 0.1,
        left: -width * 0.5,
        width: width * 1.5,
        height: height * 0.5,
        borderBottomRightRadius: width,
        borderBottomLeftRadius: width * 0.5,
        overflow: 'hidden',
        opacity: 0.15,
    },
    orb2: {
        position: 'absolute',
        bottom: -height * 0.1,
        right: -width * 0.2,
        width: width * 1.2,
        height: height * 0.6,
        borderTopLeftRadius: width * 1.2,
        overflow: 'hidden',
        opacity: 0.12,
    },

    contentWrap: {
        width: '100%',
    },
    headerWrap: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconBoxOuter: {
        width: 96,
        height: 96,
        borderRadius: 28,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#1C3D5A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
    },
    iconBoxInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 36,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.8,
        paddingHorizontal: 16,
    },

    // Glass Form Card
    formGlassWrap: {
        borderRadius: 32,
        padding: 24,
        borderWidth: 1.5,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#1C3D5A',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 20,
        paddingHorizontal: 20,
        marginBottom: 16,
        height: 64,
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#1A2332',
    },
    actionBtn: {
        marginTop: 12,
        borderRadius: 20,
        shadowColor: '#1C3D5A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    btnGradient: {
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 17,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    backLinkWrap: {
        marginTop: 24,
        alignItems: 'center',
        padding: 10,
    },
    backLinkText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: '#1A2332',
    },

    // Success State
    successWrap: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    successIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 26,
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.8,
        marginBottom: 28,
        paddingHorizontal: 8,
    },
});
