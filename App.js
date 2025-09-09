import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts, MarckScript_400Regular } from '@expo-google-fonts/marck-script';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import components
import WelcomePage from './components/WelcomePage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import AdditionalInfo from './components/AdditionalInfo';
import StudentHome from './components/StudentHome';
import TeacherHome from './components/TeacherHome';
import StudentProfile from './components/StudentProfile';
import TeacherProfile from './components/TeacherProfile';
import CreateClassroom from './components/CreateClassroom';
import MyClassrooms from './components/MyClassrooms';
import StartAttendance from './components/StartAttendance';
import AttendanceComplete from './components/AttendanceComplete';
import JoinClassroom from './components/JoinClassroom';
import MarkAttendance from './components/MarkAttendance';

// Clerk publishable key
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_c3R1bm5pbmcta2FuZ2Fyb28tMjMuY2xlcmsuYWNjb3VudHMuZGV2JA';

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Please add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file');
}

console.log('Clerk Key (first 20 chars):', CLERK_PUBLISHABLE_KEY.substring(0, 20));

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator for authenticated users
function MainTabNavigator() {
  const { user, isLoaded } = useUser();
  const userType = user?.unsafeMetadata?.userType;

  console.log('MainTabNavigator - User type:', userType, 'User loaded:', isLoaded);

  // If user data is not loaded yet, show loading
  if (!isLoaded || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  // If no userType is set, this shouldn't happen for authenticated users
  if (!userType) {
    console.warn('User is authenticated but has no userType set');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  if (userType === 'Teacher') {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="TeacherMain"
          component={TeacherHome}
        />
        <Stack.Screen
          name="TeacherProfile"
          component={TeacherProfile}
        />
        <Stack.Screen
          name="CreateClassroom"
          component={CreateClassroom}
        />
        <Stack.Screen
          name="MyClassrooms"
          component={MyClassrooms}
        />
        <Stack.Screen
          name="StartAttendance"
          component={StartAttendance}
        />
        <Stack.Screen
          name="AttendanceComplete"
          component={AttendanceComplete}
        />
      </Stack.Navigator>
    );
  } else if (userType === 'Student') {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="StudentMain"
          component={StudentHome}
        />
        <Stack.Screen
          name="StudentProfile"
          component={StudentProfile}
        />
        <Stack.Screen
          name="JoinClassroom"
          component={JoinClassroom}
        />
        <Stack.Screen
          name="MarkAttendance"
          component={MarkAttendance}
        />
      </Stack.Navigator>
    );
  } 
  
  // Default to Student if userType is not Teacher (should be Student)
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="StudentMain"
        component={StudentHome}
      />
      <Stack.Screen
        name="StudentProfile"
        component={StudentProfile}
      />
      <Stack.Screen
        name="JoinClassroom"
        component={JoinClassroom}
      />
      <Stack.Screen
        name="MarkAttendance"
        component={MarkAttendance}
      />
    </Stack.Navigator>
  );
}

// Main Stack Navigator
function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  // Show loading spinner while Clerk is initializing or user data is loading
  if (!isLoaded || (isSignedIn && !userLoaded)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  // Check if user has completed profile setup
  const hasCompletedProfile = user?.unsafeMetadata?.userType;
  console.log('User profile status:', {
    isSignedIn,
    userLoaded,
    hasCompletedProfile,
    userType: user?.unsafeMetadata?.userType,
    userId: user?.id
  });

  return (
    <Stack.Navigator
      initialRouteName={
        !isSignedIn
          ? "Welcome"
          : hasCompletedProfile
            ? "MainApp"
            : "AdditionalInfo"
      }
      screenOptions={{
        headerShown: false,
      }}
    >
      {isSignedIn ? (
        // User is signed in
        hasCompletedProfile ? (
          // User has completed profile, show main app
          <Stack.Screen
            name="MainApp"
            component={MainTabNavigator}
          />
        ) : (
          // User needs to complete profile
          <Stack.Screen
            name="AdditionalInfo"
            component={AdditionalInfo}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: '#1e293b',
              },
              headerTintColor: '#ffffff',
              headerTitle: 'Complete Profile',
              headerLeft: () => null, // Prevent going back
            }}
          />
        )
      ) : (
        // User is not signed in, show auth screens
        <>
          <Stack.Screen
            name="Welcome"
            component={WelcomePage}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: '#1e293b',
              },
              headerTintColor: '#ffffff',
              headerTitle: 'Login',
            }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUp}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: '#1e293b',
              },
              headerTintColor: '#ffffff',
              headerTitle: 'Sign Up',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  let [fontsLoaded] = useFonts({
    MarckScript_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <NavigationContainer>
          <StatusBar 
            style="light" 
            backgroundColor="transparent"
            translucent={true}
          />
          <RootNavigator />
        </NavigationContainer>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
