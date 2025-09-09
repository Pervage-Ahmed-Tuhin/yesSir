import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import tw from 'twrnc';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { registerUserFromClerk } from '../utils/api';

const AdditionalInfo = ({ navigation }) => {
    const [userType, setUserType] = useState('');
    const [studentId, setStudentId] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [department, setDepartment] = useState('');
    const [batch, setBatch] = useState('');
    const [section, setSection] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const { signOut } = useAuth();

    const handleSaveUserType = async () => {
        if (!userType) {
            Alert.alert('Selection Required', 'Please select whether you are a Teacher or Student');
            return;
        }

        // Validate required fields based on user type
        if (userType === 'Student') {
            if (!studentId || !department || !batch || !section) {
                Alert.alert('Required Fields', 'Please fill in all fields: Student ID, Department, Batch, and Section');
                return;
            }
        } else if (userType === 'Teacher') {
            if (!teacherId || !department) {
                Alert.alert('Required Fields', 'Please fill in all fields: Teacher ID and Department');
                return;
            }
        }

        setIsLoading(true);

        try {
            // Prepare metadata based on user type
            const metadata = {
                userType: userType,
                department: department,
            };

            if (userType === 'Student') {
                metadata.studentId = studentId;
                metadata.batch = batch;
                metadata.section = section;
            } else if (userType === 'Teacher') {
                metadata.teacherId = teacherId;
            }

            // Update user metadata with all the information
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    ...metadata
                }
            });

            // Reload the user to ensure the metadata is fresh
            await user.reload();

            console.log('User profile saved to Clerk:', metadata);

            // Also save to our database
            try {
                console.log('Attempting to save user to database...');
                console.log('User ID:', user.id);
                console.log('Metadata:', metadata);
                
                const dbResponse = await registerUserFromClerk(user, metadata);
                console.log('User profile saved to database successfully:', dbResponse);
                
                Alert.alert(
                    'Welcome to Yes Sir!',
                    `You have been registered as a ${userType} successfully! Welcome to the platform.`,
                    [
                        {
                            text: 'Continue to Dashboard',
                            onPress: () => {
                                // Force a re-render by logging and the navigation should happen automatically
                                console.log('Profile setup complete, user will be redirected to dashboard');
                                console.log('Current user type in metadata:', user.unsafeMetadata?.userType);
                                // Small delay to ensure state updates are processed
                                setTimeout(() => {
                                    console.log('Navigation should occur now');
                                }, 100);
                            }
                        }
                    ]
                );
            } catch (dbError) {
                console.error('Database save error:', dbError);
                console.error('Database error details:', dbError.message);
                
                // Show user there was a database issue but Clerk profile was saved
                Alert.alert(
                    'Profile Saved',
                    `Your profile has been saved locally, but there was an issue syncing with our servers. You can still use the app, and we'll sync your data later.\n\nError: ${dbError.message}`,
                    [
                        {
                            text: 'Continue to Dashboard',
                            onPress: () => {
                                console.log('Profile setup complete with DB error, proceeding to dashboard');
                                setTimeout(() => {
                                    console.log('Navigation should occur now');
                                }, 100);
                            }
                        }
                    ]
                );
            }
        } catch (err) {
            console.error('Error updating user metadata:', err);
            Alert.alert('Error', 'Failed to save your information. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`}>
            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                <View style={tw`px-8 py-8`}>

                    {/* Header */}
                    <View style={tw`items-center mb-8`}>
                        <View style={tw`flex-row justify-between items-center w-full mb-4`}>
                            <View style={tw`flex-1`} />
                            <TouchableOpacity
                                onPress={async () => {
                                    Alert.alert(
                                        'Sign Out',
                                        'Are you sure you want to sign out?',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Sign Out',
                                                onPress: async () => {
                                                    try {
                                                        // Try signOut with explicit options to avoid the origin error
                                                        await signOut({ redirectUrl: null });
                                                    } catch (error) {
                                                        console.error('Sign out error:', error);
                                                        // Check if the error is the known 'origin' issue but signout still worked
                                                        if (error.message && error.message.includes("Cannot read property 'origin'")) {
                                                            // This is a known Clerk issue, but signout actually works
                                                            // Don't show error alert as the user will be signed out
                                                            console.log('Signout completed despite Clerk origin error');
                                                            return;
                                                        }
                                                        // For other errors, show the alert
                                                        Alert.alert('Error', 'Failed to sign out. Please try again.');
                                                    }
                                                },
                                                style: 'destructive'
                                            }
                                        ]
                                    );
                                }}
                                style={tw`bg-red-600 px-3 py-2 rounded-lg`}
                            >
                                <Text style={[tw`text-white text-sm`, { fontFamily: 'MarckScript_400Regular' }]}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[tw`text-white text-3xl font-bold mb-4`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Complete Profile
                        </Text>
                        <Text style={[tw`text-gray-300 text-base text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Please provide your details to complete registration
                        </Text>
                    </View>

                    {/* User Type Selection */}
                    <View style={tw`mb-6`}>
                        <Text style={[tw`text-white text-lg font-semibold mb-4`, { fontFamily: 'MarckScript_400Regular' }]}>
                            I am a:
                        </Text>

                        {/* Student Option */}
                        <TouchableOpacity
                            style={[
                                tw`p-4 rounded-lg mb-3 border-2 items-center`,
                                userType === 'Student'
                                    ? tw`bg-cyan-600 border-cyan-500`
                                    : tw`bg-slate-700 border-slate-600`
                            ]}
                            onPress={() => setUserType('Student')}
                            activeOpacity={0.8}
                        >
                            <Text style={[tw`text-white text-lg font-semibold mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                                Student
                            </Text>
                            <Text style={[tw`text-gray-300 text-sm text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                                I attend classes and track my attendance
                            </Text>
                        </TouchableOpacity>

                        {/* Teacher Option */}
                        <TouchableOpacity
                            style={[
                                tw`p-4 rounded-lg mb-4 border-2 items-center`,
                                userType === 'Teacher'
                                    ? tw`bg-cyan-600 border-cyan-500`
                                    : tw`bg-slate-700 border-slate-600`
                            ]}
                            onPress={() => setUserType('Teacher')}
                            activeOpacity={0.8}
                        >
                            <Text style={tw`text-white text-lg font-semibold mb-1`}>
                                Teacher
                            </Text>
                            <Text style={tw`text-gray-300 text-sm text-center`}>
                                I manage classes and track student attendance
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Additional Fields */}
                    {userType && (
                        <View style={tw`mb-6`}>
                            <Text style={tw`text-white text-lg font-semibold mb-4`}>
                                Additional Information:
                            </Text>

                            {/* Student ID or Teacher ID */}
                            <View style={tw`mb-4`}>
                                <Text style={tw`text-gray-300 text-sm mb-2`}>
                                    {userType === 'Student' ? 'Student ID' : 'Teacher ID'} *
                                </Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600`}
                                    placeholder={userType === 'Student' ? 'Enter your Student ID' : 'Enter your Teacher ID'}
                                    placeholderTextColor="#64748b"
                                    value={userType === 'Student' ? studentId : teacherId}
                                    onChangeText={userType === 'Student' ? setStudentId : setTeacherId}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Department */}
                            <View style={tw`mb-4`}>
                                <Text style={tw`text-gray-300 text-sm mb-2`}>
                                    Department *
                                </Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600`}
                                    placeholder="Enter your Department (e.g., Computer Science)"
                                    placeholderTextColor="#64748b"
                                    value={department}
                                    onChangeText={setDepartment}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* Student-specific fields */}
                            {userType === 'Student' && (
                                <>
                                    {/* Batch */}
                                    <View style={tw`mb-4`}>
                                        <Text style={tw`text-gray-300 text-sm mb-2`}>
                                            Batch *
                                        </Text>
                                        <TextInput
                                            style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600`}
                                            placeholder="Enter your Batch (e.g., 2024, Spring 2024)"
                                            placeholderTextColor="#64748b"
                                            value={batch}
                                            onChangeText={setBatch}
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    {/* Section */}
                                    <View style={tw`mb-4`}>
                                        <Text style={tw`text-gray-300 text-sm mb-2`}>
                                            Section *
                                        </Text>
                                        <TextInput
                                            style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600`}
                                            placeholder="Enter your Section (e.g., A, B, C)"
                                            placeholderTextColor="#64748b"
                                            value={section}
                                            onChangeText={setSection}
                                            autoCapitalize="characters"
                                            maxLength={2}
                                        />
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={tw`bg-cyan-400 py-4 rounded-lg mb-8 ${isLoading || !userType ? 'opacity-50' : ''}`}
                        onPress={handleSaveUserType}
                        activeOpacity={0.8}
                        disabled={isLoading || !userType}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#1e293b" />
                        ) : (
                            <Text style={[tw`text-slate-800 text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                                Complete Registration
                            </Text>
                        )}
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AdditionalInfo;