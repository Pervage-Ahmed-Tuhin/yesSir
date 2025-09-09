import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Platform, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useAuth, useUser } from '@clerk/clerk-expo';

const StudentHome = ({ navigation }) => {
    const { signOut } = useAuth();
    const { user } = useUser();
    const [showSignOutModal, setShowSignOutModal] = useState(false);

    const handleSignOut = async () => {
        setShowSignOutModal(true);
    };

    const confirmSignOut = async () => {
        try {
            setShowSignOutModal(false);
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
    };

    const handleJoinClassroom = () => {
        navigation.navigate('JoinClassroom');
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`} edges={['top', 'left', 'right']}>
            {/* Header with Title and Settings */}
            <View style={tw`flex-row justify-between items-center px-6 py-4 ${Platform.OS === 'android' ? 'mt-2' : ''}`}>
                <Text style={[tw`text-white text-xl font-medium`, { fontFamily: 'MarckScript_400Regular' }]}>
                    Yes Sir!
                </Text>
                <TouchableOpacity
                    onPress={handleSignOut}
                    activeOpacity={0.8}
                >
                    <View style={tw`w-8 h-8 bg-gray-600 rounded-full items-center justify-center`}>
                        <Text style={tw`text-white text-lg`}>⚙️</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView style={tw`flex-1 px-6`} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={tw`items-center py-8`}>
                    {/* Profile Avatar */}
                    <View style={tw`w-32 h-32 bg-orange-200 rounded-full items-center justify-center mb-4`}>
                        {user?.imageUrl ? (
                            <Image 
                                source={{ uri: `${user.imageUrl}?${Date.now()}` }} 
                                style={tw`w-32 h-32 rounded-full`}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={tw`w-24 h-24 bg-orange-300 rounded-full items-center justify-center`}>
                                <Text style={[tw`text-orange-800 text-4xl font-bold`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    {(user?.username || 'S')[0].toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    {/* User Name */}
                    <Text style={[tw`text-white text-2xl font-bold mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                        {user?.username || 'Student'}
                    </Text>
                    
                    {/* User Type */}
                    <Text style={[tw`text-gray-400 text-lg mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Student
                    </Text>

                    {/* Student Details */}
                    <View style={tw`items-center mt-2`}>
                        {user?.unsafeMetadata?.studentId && (
                            <Text style={[tw`text-cyan-400 text-sm mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                                ID: {user.unsafeMetadata.studentId}
                            </Text>
                        )}
                        {user?.unsafeMetadata?.department && (
                            <Text style={[tw`text-gray-300 text-sm mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                                {user.unsafeMetadata.department}
                            </Text>
                        )}
                        <View style={tw`flex-row items-center`}>
                            {user?.unsafeMetadata?.batch && (
                                <Text style={[tw`text-gray-400 text-sm mr-2`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    Batch: {user.unsafeMetadata.batch}
                                </Text>
                            )}
                            {user?.unsafeMetadata?.section && (
                                <Text style={[tw`text-gray-400 text-sm`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    Section: {user.unsafeMetadata.section}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={tw`mb-8`}>
                    {/* Join Classroom Button */}
                    <TouchableOpacity
                        style={tw`bg-cyan-400 py-4 rounded-lg mb-4`}
                        onPress={handleJoinClassroom}
                        activeOpacity={0.8}
                    >
                        <Text style={[tw`text-slate-800 text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Join Classroom
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

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
                    onPress={() => navigation.navigate('StudentProfile')}
                >
                    <View style={tw`items-center`}>
                        <Text style={tw`text-gray-400 text-2xl mb-1`}>👤</Text>
                        <Text style={[tw`text-gray-400 text-sm`, { fontFamily: 'MarckScript_400Regular' }]}>Profile</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Custom Sign Out Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showSignOutModal}
                onRequestClose={() => setShowSignOutModal(false)}
            >
                <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
                    <View style={tw`bg-slate-800 rounded-lg p-6 mx-4 w-full max-w-sm`}>
                        <Text style={[tw`text-white text-xl font-semibold text-center mb-4`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Sign Out
                        </Text>
                        
                        <Text style={[tw`text-gray-300 text-center mb-6`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Are you sure you want to sign out?
                        </Text>

                        <View style={tw`flex-row justify-between`}>
                            <TouchableOpacity
                                style={tw`bg-gray-600 py-3 px-6 rounded-lg flex-1 mr-2`}
                                onPress={() => setShowSignOutModal(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={[tw`text-white text-center font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={tw`bg-red-600 py-3 px-6 rounded-lg flex-1 ml-2`}
                                onPress={confirmSignOut}
                                activeOpacity={0.8}
                            >
                                <Text style={[tw`text-white text-center font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default StudentHome;
