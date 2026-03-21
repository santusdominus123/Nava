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
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
    const { theme, darkMode } = useApp();
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    // Dynamic Focus States
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Advanced Animations for Glassmorphism
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;
    const floatAnim3 = useRef(new Animated.Value(0)).current;
    const btnScaleAnim = useRef(new Animated.Value(1)).current;

    // Run entrance animation and orb loops
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

        // Floating background orbs setup
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

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim3, { toValue: 1, duration: 6000, useNativeDriver: true }),
                Animated.timing(floatAnim3, { toValue: 0, duration: 5000, useNativeDriver: true }),
            ])
        ).start();
    }, [isLogin]);

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

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Required Fields', 'Please enter your email and password.');
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                Alert.alert('Welcome!', 'Your account has been created successfully.');
            }
        } catch (error: any) {
            Alert.alert('Authentication Failed', error.message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const orb1TranslateY = floatAnim1.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -30],
    });

    const orb2TranslateY = floatAnim2.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 40],
    });

    const orb3TranslateX = floatAnim3.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -50],
    });

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* 3D Mesh Gradient Background Orbs */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1TranslateY }] }]}>
                    <LinearGradient colors={theme.gradient.primary as any} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
                <Animated.View style={[styles.orb2, { transform: [{ translateY: orb2TranslateY }] }]}>
                    <LinearGradient colors={theme.gradient.gold as any} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
                <Animated.View style={[styles.orb3, { transform: [{ translateX: orb3TranslateX }] }]}>
                    <LinearGradient colors={theme.gradient.prayer as any} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
            </View>
            {/* Main Glassmorphism Content */}
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
                                <Ionicons name="book" size={42} color={theme.primary} />
                            </BlurView>
                        </View>
                        <Text style={[styles.title, { color: theme.text.primary }]}>
                            Bible Guide
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
                            {isLogin ? 'Welcome back to your sanctuary.' : 'Begin your spiritual journey.'}
                        </Text>
                    </View>

                    {/* Glass Form Card */}
                    <BlurView intensity={darkMode ? 40 : 70} tint={darkMode ? "dark" : "light"} style={[styles.formGlassWrap, { borderColor: theme.border }, darkMode && { backgroundColor: theme.card }]}>
                        <View style={[styles.inputBox, darkMode && { backgroundColor: theme.primary + '20', borderColor: theme.border }, emailFocused && { borderColor: theme.primary, backgroundColor: darkMode ? theme.primary + '40' : 'rgba(255,255,255,0.8)' }]}>
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

                        <View style={[styles.inputBox, darkMode && { backgroundColor: theme.primary + '20', borderColor: theme.border }, passwordFocused && { borderColor: theme.primary, backgroundColor: darkMode ? theme.primary + '40' : 'rgba(255,255,255,0.8)' }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.text.secondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text.primary }]}
                                placeholder="Password"
                                placeholderTextColor={theme.text.light}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                selectionColor={theme.primary}
                            />
                        </View>

                        <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={handleAuth}
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
                                        <Text style={styles.btnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {isLogin && (
                            <TouchableOpacity
                                style={styles.forgotPasswordWrap}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.dividerWrap}>
                            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                            <Text style={[styles.dividerText, { color: theme.text.light }]}>Or continue with</Text>
                            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                        </View>

                        <View style={styles.socialRow}>
                            <TouchableOpacity
                                style={[styles.socialBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                                activeOpacity={0.8}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    Alert.alert('Apple Sign-In', 'Apple authentication will be integrated here.');
                                }}
                            >
                                <Ionicons name="logo-apple" size={22} color={theme.text.primary} />
                                <Text style={[styles.socialBtnText, { color: theme.text.primary }]}>Apple</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.socialBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                                activeOpacity={0.8}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    Alert.alert('Google Sign-In', 'Google authentication will be integrated here.');
                                }}
                            >
                                <Ionicons name="logo-google" size={22} color={theme.text.primary} />
                                <Text style={[styles.socialBtnText, { color: theme.text.primary }]}>Google</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.switchModeWrap}
                            onPress={() => {
                                Haptics.selectionAsync();
                                fadeAnim.setValue(0);
                                slideAnim.setValue(20);
                                setIsLogin(!isLogin);
                            }}
                        >
                            <Text style={[styles.switchText, { color: theme.text.primary }]}>
                                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                                <Text style={{ color: theme.primary, fontFamily: 'Inter_700Bold' }}>
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
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

    // Background Fluid Layout (Organic Curves hugging the edges)
    orb1: {
        position: 'absolute',
        top: -height * 0.1,
        left: -width * 0.5,
        width: width * 1.5,
        height: height * 0.5,
        borderBottomRightRadius: width, // Massive sweeping curve
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
        borderTopLeftRadius: width * 1.2, // Huge corner curve
        overflow: 'hidden',
        opacity: 0.12,
    },
    orb3: {
        position: 'absolute',
        top: height * 0.3,
        left: -width * 0.1,
        width: width * 0.8,
        height: height * 0.4,
        borderTopRightRadius: width * 0.8,
        borderBottomRightRadius: width * 0.8,
        overflow: 'hidden',
        opacity: 0.08,
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
        fontSize: 40,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.8,
    },

    // Glass Form Card (Higher Prominence)
    formGlassWrap: {
        borderRadius: 32,
        padding: 24,
        borderWidth: 1.5,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.25)', // Increased from 0.05, decreased from 0.7 for balance
        borderColor: 'rgba(255,255,255,0.4)', // Slightly stronger border for definition
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
        color: '#1A2332', // Dark text for better contrast
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
    switchModeWrap: {
        marginTop: 24,
        alignItems: 'center',
        padding: 10,
    },
    switchText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: '#1A2332',
    },

    // Social Login Styles
    dividerWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        opacity: 0.6,
    },
    dividerText: {
        paddingHorizontal: 16,
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        gap: 8,
    },
    socialBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
    },

    forgotPasswordWrap: {
        alignItems: 'flex-end',
        marginTop: 8,
        marginBottom: 4,
        paddingRight: 4,
    },
    forgotPasswordText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
    },

    // Demo Notice
    demoNoticeWrap: {
        backgroundColor: 'rgba(90, 141, 238, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(90, 141, 238, 0.3)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    demoNoticeIconWrap: {
        marginTop: 2,
    },
    demoNoticeContent: {
        flex: 1,
    },
    demoNoticeTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        marginBottom: 4,
    },
    demoNoticeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    demoNoticeHighlight: {
        fontFamily: 'Inter_700Bold',
        color: '#5A8DEE',
    },
    demoSteps: {
        gap: 4,
    },
    demoStepItem: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        lineHeight: 18,
    },
});
