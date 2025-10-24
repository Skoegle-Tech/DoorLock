import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Text, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import Home from './Screens/Home';
import MapCard from './Screens/Map';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (2.5s)
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    // Splash screen
    return (
      <View style={styles.splashContainer}>
        <StatusBar hidden />
        <Image
          source={require('./assets/taptrack.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>TapTrack</Text>
        <Text style={styles.tagline}>Smart NFC Check-in & Check-out</Text>
      </View>
    );
  }

  // Main Navigation
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#111',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              letterSpacing: 1,
            },
            contentStyle: {
              backgroundColor: '#000',
            },
          }}
        >
          {/* Home Screen */}
          <Stack.Screen
            name="Home"
            component={Home}
            options={{
              title: 'TapTrack Dashboard',
            }}
          />

          {/* MapCard Screen */}
          <Stack.Screen
            name="MapCard"
            component={MapCard}
            options={{
              title: 'Mapped NFC Cards',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 6,
    letterSpacing: 1,
  },
});
