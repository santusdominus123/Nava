import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

import HomeScreen from '../screens/HomeScreen';
import DevotionalScreen from '../screens/DevotionalScreen';
import PrayerScreen from '../screens/PrayerScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import PremiumScreen from '../screens/PremiumScreen';
import ReadingPlanScreen from '../screens/ReadingPlanScreen';
import VerseNotesScreen from '../screens/VerseNotesScreen';
import CommunityScreen from '../screens/CommunityScreen';
import LegalScreen from '../screens/LegalScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  const { theme } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Devotional':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Prayer':
              iconName = focused ? 'hand-left' : 'hand-left-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              break;
            case 'Community':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return (
            <View style={[styles.tabIconWrap, focused && { backgroundColor: theme.primary + '12' }]}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text.light,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text.primary,
        headerTitleStyle: {
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 18,
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Devotional" component={DevotionalScreen} />
      <Tab.Screen name="Prayer" component={PrayerScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useApp();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text.primary,
        headerTitleStyle: {
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Main" component={HomeTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search Verses' }} />
      <Stack.Screen name="Premium" component={PremiumScreen} options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="ReadingPlan" component={ReadingPlanScreen} options={{ title: 'Reading Plans', headerShown: false }} />
      <Stack.Screen name="VerseNotes" component={VerseNotesScreen} options={{ title: 'My Notes' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ title: 'Legal' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 40,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
