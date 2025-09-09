import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import tw from 'twrnc';
import { useAuth, useUser } from '@clerk/clerk-expo';

const StudentHome = ({ navigation }) => {
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
                    onPress: () => signOut(),
                    style: 'destructive',
                },
            ]
        );
    };

    const handleJoinClassroom = () => {
        // TODO: Navigate to join classroom screen
        Alert.alert('Join Classroom', 'Join classroom functionality will be implemented here.');
    };

    const handleMyClassrooms = () => {
        // TODO: Navigate to my classrooms screen
        Alert.alert('My Classrooms', 'My classrooms functionality will be implemented here.');
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`}>
            {/* Header with Title and Settings */}
            <View style={tw`flex-row justify-between items-center px-6 py-4`}>
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
                        {/* Placeholder for profile image - you can replace with actual image component */}
                        <View style={tw`w-24 h-24 bg-orange-300 rounded-full items-center justify-center`}>
                            <Text style={tw`text-orange-800 text-4xl font-bold`}>
                                {(user?.firstName || user?.username || 'A')[0].toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    
                    {/* User Name */}
                    <Text style={tw`text-white text-2xl font-bold mb-1`}>
                        {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user?.firstName || user?.username || 'Angshu Dey'}
                    </Text>
                    
                    {/* User Type */}
                    <Text style={tw`text-gray-400 text-lg`}>
                        Student
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={tw`mb-8`}>
                    {/* Join Classroom Button */}
                    <TouchableOpacity
                        style={tw`bg-cyan-400 py-4 rounded-lg mb-4`}
                        onPress={handleJoinClassroom}
                        activeOpacity={0.8}
                    >
                        <Text style={tw`text-slate-800 text-lg font-semibold text-center`}>
                            Join Classroom
                        </Text>
                    </TouchableOpacity>

                    {/* My Classrooms Button */}
                    <TouchableOpacity
                        style={tw`bg-slate-700 py-4 rounded-lg border border-slate-600`}
                        onPress={handleMyClassrooms}
                        activeOpacity={0.8}
                    >
                        <Text style={tw`text-white text-lg font-semibold text-center`}>
                            My Classrooms
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={tw`flex-row bg-slate-900 border-t border-slate-700`}>
                {/* Home Tab */}
                <TouchableOpacity 
                    style={tw`flex-1 items-center py-3`}
                    activeOpacity={0.8}
                >
                    <View style={tw`items-center`}>
                        <Text style={tw`text-white text-2xl mb-1`}>🏠</Text>
                        <Text style={tw`text-white text-sm font-medium`}>Home</Text>
                    </View>
                </TouchableOpacity>

                {/* Profile Tab */}
                <TouchableOpacity 
                    style={tw`flex-1 items-center py-3`}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Profile', 'Profile functionality will be implemented here.')}
                >
                    <View style={tw`items-center`}>
                        <Text style={tw`text-gray-400 text-2xl mb-1`}>👤</Text>
                        <Text style={tw`text-gray-400 text-sm`}>Profile</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default StudentHome;
