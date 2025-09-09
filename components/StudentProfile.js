import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, Modal, TextInput, ScrollView, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import tw from 'twrnc';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';

const StudentProfile = ({ navigation }) => {
    const { user } = useUser();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // Form states
    const [username, setUsername] = useState(user?.username || '');
    const [studentId, setStudentId] = useState(user?.unsafeMetadata?.studentId || '');
    const [department, setDepartment] = useState(user?.unsafeMetadata?.department || '');
    const [batch, setBatch] = useState(user?.unsafeMetadata?.batch || '');
    const [section, setSection] = useState(user?.unsafeMetadata?.section || '');

    // Effect to update form states when user data changes
    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setStudentId(user.unsafeMetadata?.studentId || '');
            setDepartment(user.unsafeMetadata?.department || '');
            setBatch(user.unsafeMetadata?.batch || '');
            setSection(user.unsafeMetadata?.section || '');
        }
    }, [user, refreshTrigger]);

    const handleImagePick = async () => {
        try {
            // Request permission first
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required', 
                    'Please go to Settings and allow access to your photo library to update your profile picture.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => {
                            if (Platform.OS === 'ios') {
                                Linking.openURL('app-settings:');
                            } else {
                                Linking.openURL('package:' + Application.applicationId);
                            }
                        }}
                    ]
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1, // Use maximum quality for better results
            });

            if (!result.canceled && result.assets[0]) {
                setImageLoading(true);
                const asset = result.assets[0];
                
                try {
                    console.log('Selected image URI:', asset.uri);
                    
                    // Create a proper File-like object for Clerk (works on both iOS and Android)
                    const fileExtension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
                    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
                    
                    const file = {
                        uri: asset.uri,
                        name: `profile.${fileExtension}`, // must include extension
                        type: mimeType, // proper MIME type
                    };
                    
                    console.log('File object created:', file.name, file.type);
                    
                    // Update user profile image in Clerk
                    await user.setProfileImage({ file });
                    
                    // Force reload the user data multiple times to ensure the image updates
                    await user.reload();
                    
                    // Wait a bit and reload again for Android compatibility
                    setTimeout(async () => {
                        await user.reload();
                        setRefreshTrigger(prev => prev + 1);
                    }, 1000);
                    
                    console.log('✅ Profile image updated successfully in Clerk!');
                    setImageLoading(false);
                    Alert.alert('Success', 'Profile picture updated successfully!');
                } catch (imageError) {
                    setImageLoading(false);
                    console.error('❌ Error updating profile image:', imageError);
                    
                    // Show a more informative error message
                    if (imageError.message.includes('setProfileImage') || imageError.message.includes('Upload')) {
                        Alert.alert('Upload Error', 'Failed to upload image to Clerk. Please try a different image or check your internet connection.');
                    } else {
                        Alert.alert('Error', `Failed to update profile picture: ${imageError.message}`);
                    }
                }
            }
        } catch (error) {
            setImageLoading(false);
            console.error('Error accessing photo library:', error);
            Alert.alert('Error', 'Failed to access photo library. Please try again.');
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);

            // Update Clerk user data
            await user.update({
                username: username.trim(),
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    studentId: studentId.trim(),
                    department: department.trim(),
                    batch: batch.trim(),
                    section: section.trim(),
                }
            });

            // Update in database
            const response = await fetch(`http://192.168.0.220:5000/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    studentId: studentId.trim(),
                    department: department.trim(),
                    batch: batch.trim(),
                    section: section.trim(),
                    userType: 'Student'
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server response error:', errorData);
                throw new Error(`Failed to update profile: ${response.status} - ${errorData}`);
            }

            const responseData = await response.json();
            console.log('Profile update response:', responseData);

            // Update classroom references where this student is enrolled
            try {
                const classroomUpdateResponse = await fetch(`http://192.168.0.220:5000/api/classrooms/update-student`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        newUsername: username.trim(),
                        newStudentId: studentId.trim()
                    }),
                });

                if (!classroomUpdateResponse.ok) {
                    console.warn('Warning: Failed to update classroom references, but profile was updated successfully');
                } else {
                    const classroomResult = await classroomUpdateResponse.json();
                    console.log('Classroom update result:', classroomResult);
                }
            } catch (classroomError) {
                console.warn('Warning: Error updating classroom references:', classroomError);
            }

            await user.reload();
            setLoading(false);
            setEditModalVisible(false);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            setLoading(false);
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={tw`flex-row items-center px-6 py-4 border-b border-slate-700 ${Platform.OS === 'android' ? 'mt-2' : ''}`}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={tw`mr-4`}
                >
                    <Text style={tw`text-white text-2xl`}>←</Text>
                </TouchableOpacity>
                <Text style={[tw`text-white text-xl font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>Profile</Text>
            </View>

            <ScrollView style={tw`flex-1 px-6`}>
                {/* Profile Section */}
                <View style={tw`items-center py-8`}>
                    {/* Profile Avatar */}
                    <TouchableOpacity
                        onPress={handleImagePick}
                        style={tw`w-32 h-32 bg-orange-200 rounded-full items-center justify-center mb-4 relative`}
                        disabled={imageLoading}
                    >
                        {user?.imageUrl ? (
                            <Image 
                                key={`${user.imageUrl}-${refreshTrigger}`}
                                source={{ uri: `${user.imageUrl}?${Date.now()}` }} 
                                style={tw`w-32 h-32 rounded-full`}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={tw`w-24 h-24 bg-orange-300 rounded-full items-center justify-center`}>
                                <Text style={[tw`text-orange-800 text-4xl font-bold`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    {(username || user?.username || 'S')[0].toUpperCase()}
                                </Text>
                            </View>
                        )}
                        
                        {imageLoading && (
                            <View style={tw`absolute inset-0 bg-black bg-opacity-50 rounded-full items-center justify-center`}>
                                <ActivityIndicator size="small" color="#06b6d4" />
                            </View>
                        )}
                        
                        {/* Camera icon overlay */}
                        <View style={tw`absolute bottom-0 right-0 w-8 h-8 bg-cyan-400 rounded-full items-center justify-center`}>
                            <Text style={tw`text-slate-800 text-sm`}>📷</Text>
                        </View>
                    </TouchableOpacity>
                    
                    {/* User Name */}
                    <Text style={[tw`text-white text-2xl font-bold mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                        {username || user?.username || 'Student'}
                    </Text>
                    
                    {/* Student ID */}
                    <Text style={[tw`text-gray-400 text-lg mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Student ID: {studentId || 'Not Set'}
                    </Text>

                    {/* Student Details */}
                    <View style={tw`items-center mt-2`}>
                        {department && (
                            <Text style={[tw`text-gray-300 text-sm mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                                {department}
                            </Text>
                        )}
                        <View style={tw`flex-row items-center`}>
                            {batch && (
                                <Text style={[tw`text-gray-400 text-sm mr-2`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    Batch: {batch}
                                </Text>
                            )}
                            {section && (
                                <Text style={[tw`text-gray-400 text-sm`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    Section: {section}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Edit Profile Button */}
                <TouchableOpacity
                    style={tw`bg-slate-700 py-4 rounded-lg mb-8`}
                    onPress={() => setEditModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Text style={[tw`text-white text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={tw`flex-row bg-slate-900 border-t border-slate-700 ${Platform.OS === 'android' ? 'pb-6' : 'pb-2'}`}>
                {/* Home Tab */}
                <TouchableOpacity 
                    style={tw`flex-1 items-center py-4`}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('StudentMain')}
                >
                    <View style={tw`items-center`}>
                        <Text style={[tw`text-gray-400 text-2xl mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>🏠</Text>
                        <Text style={[tw`text-gray-400 text-sm`, { fontFamily: 'MarckScript_400Regular' }]}>Home</Text>
                    </View>
                </TouchableOpacity>

                {/* Profile Tab */}
                <TouchableOpacity 
                    style={tw`flex-1 items-center py-4`}
                    activeOpacity={0.8}
                >
                    <View style={tw`items-center`}>
                        <Text style={[tw`text-white text-2xl mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>👤</Text>
                        <Text style={[tw`text-white text-sm font-medium`, { fontFamily: 'MarckScript_400Regular' }]}>Profile</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Edit Profile Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
                    <View style={tw`bg-slate-800 rounded-lg p-6 mx-4 w-full max-w-sm`}>
                        <Text style={[tw`text-white text-xl font-semibold text-center mb-6`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Edit Profile
                        </Text>

                        <ScrollView style={tw`max-h-96`}>
                            {/* Username */}
                            <View style={tw`mb-4`}>
                                <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Username</Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Enter username"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Student ID */}
                            <View style={tw`mb-4`}>
                                <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Student ID</Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                                    value={studentId}
                                    onChangeText={setStudentId}
                                    placeholder="Enter student ID"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Department */}
                            <View style={tw`mb-4`}>
                                <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Department</Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                                    value={department}
                                    onChangeText={setDepartment}
                                    placeholder="Enter department"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Batch */}
                            <View style={tw`mb-4`}>
                                <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Batch</Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                                    value={batch}
                                    onChangeText={setBatch}
                                    placeholder="Enter batch"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Section */}
                            <View style={tw`mb-6`}>
                                <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Section</Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                                    value={section}
                                    onChangeText={setSection}
                                    placeholder="Enter section"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </ScrollView>

                        {/* Modal Buttons */}
                        <View style={tw`flex-row justify-between`}>
                            <TouchableOpacity
                                style={tw`bg-gray-600 py-3 px-6 rounded-lg flex-1 mr-2`}
                                onPress={() => setEditModalVisible(false)}
                                disabled={loading}
                            >
                                <Text style={[tw`text-white text-center font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={tw`bg-cyan-600 py-3 px-6 rounded-lg flex-1 ml-2 ${loading ? 'opacity-50' : ''}`}
                                onPress={handleUpdateProfile}
                                disabled={loading}
                            >
                                <Text style={[tw`text-white text-center font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>
                                    {loading ? 'Saving...' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default StudentProfile;
