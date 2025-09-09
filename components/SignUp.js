import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { getValidationError } from '../utils/validation';
import { completeGoogleSignupWithUsername } from '../utils/googleOAuthHelpers';

const SignUp = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { signUp, setActive, isLoaded } = useSignUp();
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

    const handleSignUp = async () => {
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
            const signUpAttempt = await signUp.create({
                emailAddress: email,
                password,
                username: username // Add username since it's required
            });

            console.log('SignUp attempt status:', signUpAttempt.status);
            console.log('SignUp attempt ID:', signUpAttempt.id);

            // Handle different signup statuses
            if (signUpAttempt.status === 'missing_requirements') {
                console.log('Missing requirements detected');
                console.log('Required fields:', signUpAttempt.missingFields);
                console.log('Unverified fields:', signUpAttempt.unverifiedFields);

                // Check if email verification is needed
                if (signUpAttempt.unverifiedFields?.includes('email_address')) {
                    // Prepare email verification
                    const prepareResult = await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                    console.log('Prepare verification successful');

                    setPendingVerification(true);
                    Alert.alert('Verification Code Sent', 'Please check your email for the verification code.');
                } else {
                    Alert.alert('Error', 'Additional information required. Please try again.');
                }
            } else if (signUpAttempt.status === 'complete') {
                // Account created without verification needed
                Alert.alert(
                    'Success',
                    'Account created successfully! Please login with your credentials.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('Login')
                        }
                    ]
                );
            } else {
                console.log('Unexpected signup status:', signUpAttempt.status);
                Alert.alert('Error', 'Signup process incomplete. Please try again.');
            }
        } catch (err) {
            console.error('SignUp error:', err);
            // Avoid circular structure error by not stringifying the entire error
            console.error('SignUp error message:', err.message);
            console.error('SignUp error code:', err.code);

            let errorMessage = 'Sign up failed';

            if (err.errors && err.errors.length > 0) {
                const error = err.errors[0];
                if (error.code === 'form_identifier_exists') {
                    errorMessage = 'An account with this email already exists. Please try logging in instead.';
                } else if (error.code === 'form_password_pwned') {
                    errorMessage = 'This password is too common. Please choose a stronger password.';
                } else if (error.code === 'form_password_length_too_short') {
                    errorMessage = 'Password is too short. Please use at least 8 characters.';
                } else {
                    errorMessage = error.message || errorMessage;
                }
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }; const handleVerifyEmail = async () => {
        if (!isLoaded) return;

        if (!verificationCode || verificationCode.length < 6) {
            Alert.alert('Validation Error', 'Please enter the complete 6-digit verification code');
            return;
        }

        console.log('Starting email verification with code:', verificationCode);
        console.log('SignUp object status:', signUp ? signUp.status : 'No signUp object');

        setIsLoading(true);

        try {
            const result = await signUp.attemptEmailAddressVerification({
                code: verificationCode.trim(),
            });

            console.log('Verification result status:', result.status);
            console.log('Verification result ID:', result.id);

            if (result.status === 'complete') {
                console.log('Verification complete, account created successfully');
                
                // Activate the session immediately after successful verification
                if (result.createdSessionId) {
                    console.log('Activating session:', result.createdSessionId);
                    await setActive({ session: result.createdSessionId });
                    console.log('Session activated successfully');
                    // Navigation will be handled automatically by auth state change
                } else {
                    console.log('No session ID found, redirecting to login');
                    Alert.alert(
                        'Success',
                        'Account created successfully! Please login with your credentials.',
                        [
                            {
                                text: 'OK',
                                onPress: () => navigation.navigate('Login')
                            }
                        ]
                    );
                }
            } else if (result.status === 'missing_requirements') {
                // Handle case where more verification steps are needed
                console.log('Missing requirements after verification:', result.missingFields);

                // If username is still missing after email verification, try to update it
                if (result.missingFields?.includes('username')) {
                    try {
                        console.log('Attempting to update missing username');
                        const updateResult = await signUp.update({
                            username: username
                        });
                        console.log('Username update result status:', updateResult.status);

                        if (updateResult.status === 'complete') {
                            // Activate the session after completing all requirements
                            if (updateResult.createdSessionId) {
                                console.log('Activating session after username update:', updateResult.createdSessionId);
                                await setActive({ session: updateResult.createdSessionId });
                                console.log('Session activated successfully after username update');
                            } else {
                                Alert.alert(
                                    'Success',
                                    'Account created successfully! Please login with your credentials.',
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => navigation.navigate('Login')
                                        }
                                    ]
                                );
                            }
                        } else {
                            Alert.alert('Error', 'Failed to complete account setup. Please try again.');
                        }
                    } catch (updateErr) {
                        console.error('Username update error:', updateErr.message);
                        Alert.alert('Error', 'Failed to complete account setup. Please try again.');
                    }
                } else {
                    Alert.alert('Verification Incomplete', 'Additional verification steps required');
                }
            } else {
                console.log('Unexpected verification status:', result.status);
                Alert.alert('Error', 'Verification failed. Please try again.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            console.error('Verification error message:', err.message);

            let errorMessage = 'Email verification failed';

            if (err.errors && err.errors.length > 0) {
                const error = err.errors[0];
                console.log('Error code:', error.code);
                console.log('Error message:', error.message);

                if (error.code === 'form_code_incorrect') {
                    errorMessage = 'Invalid verification code. Please check your email and try again.';
                } else if (error.code === 'form_code_expired') {
                    errorMessage = 'Verification code has expired. Please request a new one.';
                } else if (error.code === 'verification_expired') {
                    errorMessage = 'Verification session has expired. Please start the signup process again.';
                } else {
                    errorMessage = error.message || errorMessage;
                }
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }; const handleResendCode = async () => {
        if (!isLoaded) return;

        setIsLoading(true);

        try {
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            Alert.alert('Success', 'Verification code sent! Please check your email.');
        } catch (err) {
            console.error('Resend error:', err);
            Alert.alert('Error', err.errors?.[0]?.message || 'Failed to resend verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            console.log('=== STARTING GOOGLE SIGNUP ===');
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
                console.log('Google signup successful!');
                return;
            }
            
            // Handle SignUp result (new Google user)
            if (signUp && signUp.status === 'complete') {
                console.log('SignUp complete, activating session...');
                await setActive({ session: signUp.createdSessionId });
                console.log('Google signup successful via signUp!');
                return;
            }
            
            // Handle SignIn result (existing Google user)
            if (signIn && signIn.status === 'complete') {
                console.log('Existing user signing in via Google...');
                await setActive({ session: signIn.createdSessionId });
                console.log('Google login successful for existing user!');
                return;
            }
            
            // Handle incomplete states
            if (signUp && signUp.status !== 'complete') {
                console.log('SignUp incomplete:', signUp.status);
                console.log('Missing fields:', signUp.missingFields);
                console.log('Unverified fields:', signUp.unverifiedFields);
                
                // Handle missing username specifically
                if (signUp.status === 'missing_requirements' && 
                    signUp.missingFields?.includes('username')) {
                    
                    console.log('Username is missing, attempting to complete signup...');
                    const success = await completeGoogleSignupWithUsername(signUp, setActive);
                    
                    if (success) {
                        console.log('Google signup completed successfully!');
                        return;
                    }
                    // If not successful, the helper function will show appropriate error
                } else {
                    Alert.alert('Account Setup Required', 'Please complete your account setup.');
                }
                return;
            }
            
            if (signIn && signIn.status !== 'complete') {
                console.log('SignIn incomplete:', signIn.status);
                Alert.alert('Sign In Required', 'Please complete the sign-in process.');
                return;
            }
            
            // No session or objects returned (likely user cancelled)
            console.log('No valid result from OAuth flow');
            
        } catch (err) {
            console.error('=== GOOGLE SIGNUP ERROR ===');
            console.error('Error:', err);
            console.error('Message:', err.message);
            console.error('Code:', err.code);
            console.error('Name:', err.name);
            
            // Handle specific error cases
            if (err.message?.toLowerCase().includes('cancelled') || 
                err.message?.toLowerCase().includes('canceled') ||
                err.name === 'UserCancel') {
                console.log('User cancelled Google signup');
                return; // Don't show error for cancellation
            }
            
            Alert.alert(
                'Google Sign Up Error', 
                'Unable to sign up with Google. Please try again or use email/password.'
            );
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView 
                style={tw`flex-1`}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    style={tw`flex-1`}
                    contentContainerStyle={tw`px-8 py-8 ${pendingVerification ? 'justify-center' : ''}`}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* Header */}
                    <View style={tw`items-center mb-12 mt-8`}>
                        <Text style={[tw`text-white text-2xl font-bold`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Yes Sir!
                        </Text>
                    </View>

                    {/* Input Fields */}
                    <View style={tw`mb-8`}>
                        {pendingVerification ? (
                            /* Verification Code Input */
                            <>
                                <Text style={[tw`text-white text-center mb-6 text-lg`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    We've sent a verification code to {email}
                                </Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-4 rounded-lg mb-6 text-base text-center text-xl tracking-widest`}
                                    value={verificationCode}
                                    onChangeText={setVerificationCode}
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus={true}
                                />
                                
                                {/* Verify Button - Placed right after input */}
                                <TouchableOpacity
                                    style={tw`bg-cyan-400 py-4 rounded-lg mb-6 ${isLoading ? 'opacity-50' : ''}`}
                                    onPress={handleVerifyEmail}
                                    activeOpacity={0.8}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#1e293b" />
                                    ) : (
                                        <Text style={[tw`text-slate-800 text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                                            Verify Email
                                        </Text>
                                    )}
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={tw`mb-6`}
                                    onPress={handleResendCode}
                                    activeOpacity={0.8}
                                    disabled={isLoading}
                                >
                                    <Text style={[tw`text-cyan-400 text-center text-sm`, { fontFamily: 'MarckScript_400Regular' }]}>
                                        Didn't receive the code? Resend
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* Sign Up Form */
                            <>
                                {/* Username Input */}
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-4 rounded-lg mb-4 text-base`}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Username"
                                    placeholderTextColor="#94a3b8"
                                    autoCapitalize="none"
                                />

                                {/* Email Input */}
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-4 rounded-lg mb-4 text-base`}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Email"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                {/* Password Input */}
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-4 rounded-lg mb-6 text-base`}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Password"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry
                                />
                            </>
                        )}
                    </View>

                    {/* Action Buttons */}
                    {!pendingVerification && (
                        <View style={tw`mt-auto mb-8`}>
                            {/* Register Button */}
                            <TouchableOpacity
                                style={tw`bg-cyan-400 py-4 rounded-lg mb-4 ${isLoading ? 'opacity-50' : ''}`}
                                onPress={handleSignUp}
                                activeOpacity={0.8}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#1e293b" />
                                ) : (
                                    <Text style={[tw`text-slate-800 text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                                        Sign Up
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Google Sign Up Button */}
                            <TouchableOpacity
                                style={tw`bg-white py-4 rounded-lg mb-4 border border-slate-600`}
                                onPress={handleGoogleSignUp}
                                activeOpacity={0.8}
                            >
                                <Text style={[tw`text-slate-800 text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    Continue with Google
                                </Text>
                            </TouchableOpacity>

                            {/* Login Link */}
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Login')}
                                activeOpacity={0.8}
                            >
                                <Text style={[tw`text-cyan-400 text-center text-base`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    Already have an account? Login
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUp;
