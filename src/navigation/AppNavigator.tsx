import React from 'react';
import { StyleSheet } from 'react-native';
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
import GroupChatScreen from '../screens/GroupChatScreen';
import GroupSettingsScreen from '../screens/GroupSettingsScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';

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

          return <Ionicons name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text.light,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 80,
          paddingBottom: 24,
          paddingTop: 6,
          paddingHorizontal: 4,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 9,
          marginTop: 1,
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
      <Tab.Screen name="Devotional" component={DevotionalScreen} options={{ tabBarLabel: 'Devos' }} />
      <Tab.Screen name="Prayer" component={PrayerScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ headerShown: false, tabBarLabel: 'Social' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
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
      <Stack.Screen name="Legal" component={LegalScreen} options={{ title: 'Legal' }} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ headerShown: false, presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});
