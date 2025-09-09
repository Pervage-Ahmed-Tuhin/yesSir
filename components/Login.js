import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useSignIn, useOAuth, useAuth } from '@clerk/clerk-expo';
import { validateEmail, getValidationError } from '../utils/validation';
import { completeGoogleSignupWithUsername } from '../utils/googleOAuthHelpers';

const Login = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { signIn, setActive, isLoaded } = useSignIn();
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const { signOut } = useAuth();

    const handleSessionConflict = async () => {
        try {
            console.log('Handling session conflict, signing out existing session...');
            await signOut();
            console.log('Existing session cleared');
            return true;
        } catch (err) {
            console.error('Error clearing existing session:', err);
            return false;
        }
    };

    const handleLogin = async () => {
        if (!isLoaded) return;

        // Validate inputs
        const usernameError = getValidationError('username', username);
        const emailError = getValidationError('email', email);
        const passwordError = getValidationError('password', password);

        if (usernameError) {
            Alert.alert('Validation Error', usernameError);
            return;
        }

        if (emailError) {
            Alert.alert('Validation Error', emailError);
            return;
        }

        if (passwordError) {
            Alert.alert('Validation Error', passwordError);
            return;
        }

        setIsLoading(true);

        try {
            // First try to sign in with email
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                console.log('Login successful, session activated');
                // Navigation is handled automatically by the auth state change
            } else {
                console.log('Login incomplete, status:', result.status);
                console.log('Login result:', JSON.stringify(result, null, 2));
                Alert.alert('Error', 'Login incomplete. Please try again.');
            }
        } catch (err) {
            console.error('Login error:', err);
            console.error('Login error details:', err.errors);
            
            let errorMessage = 'Login failed. Please try again.';
            let shouldRetry = false;
            
            if (err.errors && err.errors.length > 0) {
                const error = err.errors[0];
                console.log('Error code:', error.code);
                console.log('Error message:', error.message);
                
                // Handle specific error cases
                if (error.code === 'session_exists') {
                    console.log('Session already exists, attempting to clear and retry...');
                    shouldRetry = true;
                    errorMessage = 'Clearing existing session and retrying...';
                } else if (error.code === 'form_identifier_not_found') {
                    errorMessage = 'Account not found. Please check your email or sign up.';
                } else if (error.code === 'form_password_incorrect') {
                    errorMessage = 'Incorrect password. Please try again.';
                } else if (error.code === 'form_identifier_exists') {
                    errorMessage = 'This account already exists. Please try logging in instead.';
                } else {
                    errorMessage = error.message || errorMessage;
                }
            }
            
            if (shouldRetry) {
                // Try to clear the existing session and retry
                const sessionCleared = await handleSessionConflict();
                if (sessionCleared) {
                    // Retry the login after clearing the session
                    try {
                        const retryResult = await signIn.create({
                            identifier: email,
                            password,
                        });

                        if (retryResult.status === 'complete') {
                            await setActive({ session: retryResult.createdSessionId });
                            console.log('Login successful after session conflict resolution');
                            return; // Exit successfully
                        }
                    } catch (retryErr) {
                        console.error('Retry login error:', retryErr);
                        errorMessage = 'Login failed after clearing session. Please restart the app and try again.';
                    }
                } else {
                    errorMessage = 'Unable to clear existing session. Please restart the app and try again.';
                }
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            console.log('=== STARTING GOOGLE LOGIN ===');
            console.log('OAuth hook available:', !!startOAuthFlow);
            
            const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();
            
            console.log('=== OAUTH FLOW COMPLETED ===');
            console.log('Created Session ID:', createdSessionId);
            console.log('SignIn object:', signIn ? { status: signIn.status, id: signIn.id } : null);
            console.log('SignUp object:', signUp ? { status: signUp.status, id: signUp.id } : null);
            console.log('SetActive function:', !!setActive);
            
            // Direct session creation (most common case)
            if (createdSessionId) {
                console.log('Direct session created, activating...');
                await setActive({ session: createdSessionId });
                console.log('Google login successful!');
                return;
            }
            
            // Handle SignIn result
            if (signIn && signIn.status === 'complete') {
                console.log('SignIn complete, activating session...');
                await setActive({ session: signIn.createdSessionId });
                console.log('Google login successful via signIn!');
                return;
            }
            
            // Handle SignUp result  
            if (signUp && signUp.status === 'complete') {
                console.log('SignUp complete, activating session...');
                await setActive({ session: signUp.createdSessionId });
                console.log('Google signup successful via signUp!');
                return;
            }
            
            // Handle incomplete states
            if (signIn && signIn.status !== 'complete') {
                console.log('SignIn incomplete:', signIn.status);
                
                // If signin needs identifier, it might be a signup case
                if (signIn.status === 'needs_identifier') {
                    console.log('SignIn needs identifier - this might be a new user');
                    Alert.alert(
                        'Account Not Found', 
                        'No account found with this Google account. Please try signing up instead.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Sign Up', onPress: () => navigation.navigate('SignUp') }
                        ]
                    );
                } else {
                    Alert.alert('Sign In Required', 'Please complete the sign-in process.');
                }
                return;
            }
            
            if (signUp && signUp.status !== 'complete') {
                console.log('SignUp incomplete from login:', signUp.status);
                console.log('Missing fields:', signUp.missingFields);
                
                // Handle missing username for signup during login
                if (signUp.status === 'missing_requirements' && 
                    signUp.missingFields?.includes('username')) {
                    
                    console.log('New Google user needs username during login...');
                    const success = await completeGoogleSignupWithUsername(signUp, setActive);
                    
                    if (success) {
                        console.log('New user Google account setup completed during login!');
                        return;
                    }
                    // If not successful, the helper function will show appropriate error
                } else {
                    Alert.alert('Account Setup Required', 'Please complete your account setup.');
                }
                return;
            }
            
            // No session or objects returned (likely user cancelled)
            console.log('No valid result from OAuth flow');
            
        } catch (err) {
            console.error('=== GOOGLE LOGIN ERROR ===');
            console.error('Error:', err);
            console.error('Message:', err.message);
            console.error('Code:', err.code);
            console.error('Name:', err.name);
            
            // Handle specific error cases
            if (err.message?.toLowerCase().includes('cancelled') || 
                err.message?.toLowerCase().includes('canceled') ||
                err.name === 'UserCancel') {
                console.log('User cancelled Google login');
                return; // Don't show error for cancellation
            }
            
            Alert.alert(
                'Google Sign In Error', 
                'Unable to sign in with Google. Please try again or use email/password.'
            );
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`} edges={['top', 'left', 'right']}>
            <View style={tw`flex-1 justify-center px-8 ${Platform.OS === 'android' ? 'mt-4' : ''}`}>

                {/* Title */}
                <Text style={[tw`text-white text-3xl font-bold text-center mb-8`, { fontFamily: 'MarckScript_400Regular' }]}>
                    Welcome Back
                </Text>

                {/* Username Input */}
                <View style={tw`mb-4`}>
                    <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Username</Text>
                    <TextInput
                        style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter your username"
                        placeholderTextColor="#64748b"
                        autoCapitalize="none"
                    />
                </View>

                {/* Email Input */}
                <View style={tw`mb-4`}>
                    <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Email</Text>
                    <TextInput
                        style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#64748b"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Password Input */}
                <View style={tw`mb-6`}>
                    <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Password</Text>
                    <TextInput
                        style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                    />
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    style={tw`bg-cyan-400 py-4 rounded-lg mb-4 ${isLoading ? 'opacity-50' : ''}`}
                    onPress={handleLogin}
                    activeOpacity={0.8}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#1e293b" />
                    ) : (
                        <Text style={[tw`text-slate-800 text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Login
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Google Login Button */}
                <TouchableOpacity
                    style={tw`bg-white py-4 rounded-lg mb-4 border border-slate-600`}
                    onPress={handleGoogleLogin}
                    activeOpacity={0.8}
                >
                    <Text style={[tw`text-slate-800 text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Continue with Google
                    </Text>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('SignUp')}
                    activeOpacity={0.8}
                >
                    <Text style={[tw`text-cyan-400 text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Don't have an account? Sign Up
                    </Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
};

export default Login;
