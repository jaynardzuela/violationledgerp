import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Map from './tabs/map';
import Home from './tabs/home';
import Reports from './tabs/reports';
import AnalyticsScreen from './tabs/analyticsScreen';
import RBIScreen from './tabs/RBIScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Map') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'Reports') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else if (route.name === 'Analytics') {
              iconName = focused ? 'analytics' : 'analytics-outline';
            } else if (route.name === 'RBI') {
              iconName = focused ? 'people' : 'people-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={Home}
          options={{ title: 'Home' }}
        />
        <Tab.Screen 
          name="Map" 
          component={Map}
          options={{ title: 'Map' }}
        />
        <Tab.Screen 
          name="Reports" 
          component={Reports}
          options={{ title: 'Reports' }}
        />
        <Tab.Screen 
          name="Analytics" 
          component={AnalyticsScreen}
          options={{ title: 'Analytics' }}
        />
        <Tab.Screen 
          name="RBI" 
          component={RBIScreen}
          options={{ title: 'RBI' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
