import React from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useAuth, useUser } from '@clerk/clerk-expo';

const TeacherHome = ({ navigation }) => {
    const { signOut } = useAuth();
    const { user } = useUser();

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
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
                    style: 'destructive',
                },
            ]
        );
    };

    const handleCreateClassroom = () => {
        navigation.navigate('CreateClassroom');
    };

    const handleMyClassrooms = () => {
        navigation.navigate('MyClassrooms');
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`} edges={['top', 'left', 'right']}>
            {/* Header with Attendance title and Settings icon */}
            <View style={tw`flex-row justify-between items-center px-6 py-4 ${Platform.OS === 'android' ? 'mt-2' : ''}`}>
                <Text style={[tw`text-white text-xl font-medium`, { fontFamily: 'MarckScript_400Regular' }]}>
                    Attendance
                </Text>
                <TouchableOpacity
                    onPress={handleSignOut}
                    activeOpacity={0.8}
                >
                    {/* Settings/Options icon - you can replace with an actual icon */}
                    <View style={tw`w-8 h-8 bg-gray-600 rounded-full items-center justify-center`}>
                        <Text style={tw`text-white text-lg`}>⚙️</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={tw`flex-1 px-6`}>
                {/* Profile Section */}
                <View style={tw`items-center py-6 mb-4`}>
                    {/* Profile Avatar */}
                    <View style={tw`w-24 h-24 bg-cyan-200 rounded-full items-center justify-center mb-3`}>
                        {user?.imageUrl ? (
                            <Image 
                                source={{ uri: `${user.imageUrl}?${Date.now()}` }} 
                                style={tw`w-24 h-24 rounded-full`}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={tw`w-20 h-20 bg-cyan-300 rounded-full items-center justify-center`}>
                                <Text style={[tw`text-cyan-800 text-3xl font-bold`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    {(user?.username || 'T')[0].toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    {/* Welcome Message */}
                    <Text style={[tw`text-white text-3xl text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Welcome, {user?.username || 'Teacher'}
                    </Text>
                    
                    {/* Teacher Details */}
                    <View style={tw`mt-3 items-center`}>
                        {user?.unsafeMetadata?.teacherId && (
                            <Text style={[tw`text-cyan-400 text-sm mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                                Teacher ID: {user.unsafeMetadata.teacherId}
                            </Text>
                        )}
                        {user?.unsafeMetadata?.department && (
                            <Text style={[tw`text-gray-300 text-sm`, { fontFamily: 'MarckScript_400Regular' }]}>
                                Department: {user.unsafeMetadata.department}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={tw`mb-8`}>
                    {/* Create Classroom Button */}
                    <TouchableOpacity
                        style={tw`bg-cyan-400 py-6 rounded-lg mb-6`}
                        onPress={handleCreateClassroom}
                        activeOpacity={0.8}
                    >
                        <Text style={[tw`text-slate-800 text-xl font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Create Classroom
                        </Text>
                    </TouchableOpacity>

                    {/* My Classrooms Button */}
                    <TouchableOpacity
                        style={tw`bg-slate-700 py-6 rounded-lg border border-slate-600`}
                        onPress={handleMyClassrooms}
                        activeOpacity={0.8}
                    >
                        <Text style={[tw`text-white text-xl font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                            My Classrooms
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Navigation */}
            <View style={tw`flex-row bg-slate-900 border-t border-slate-700 ${Platform.OS === 'android' ? 'pb-6' : 'pb-2'}`}>
                {/* Home Tab */}
                <TouchableOpacity 
                    style={tw`flex-1 items-center py-4`}
                    activeOpacity={0.8}
                >
                    <View style={tw`items-center`}>
                        <Text style={tw`text-white text-2xl mb-1`}>🏠</Text>
                        <Text style={[tw`text-white text-sm font-medium`, { fontFamily: 'MarckScript_400Regular' }]}>Home</Text>
                    </View>
                </TouchableOpacity>

                {/* Profile Tab */}
                <TouchableOpacity 
                    style={tw`flex-1 items-center py-4`}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('TeacherProfile')}
                >
                    <View style={tw`items-center`}>
                        <Text style={tw`text-gray-400 text-2xl mb-1`}>👤</Text>
                        <Text style={[tw`text-gray-400 text-sm`, { fontFamily: 'MarckScript_400Regular' }]}>Profile</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default TeacherHome;
