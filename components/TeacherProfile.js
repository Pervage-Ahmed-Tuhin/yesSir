import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, Modal, TextInput, ScrollView, ActivityIndicator, Platform, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import tw from 'twrnc';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';

const TeacherProfile = ({ navigation }) => {
    const { user } = useUser();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [classrooms, setClassrooms] = useState([]);
    const [classroomsLoading, setClassroomsLoading] = useState(true);
    
    // Form states
    const [username, setUsername] = useState(user?.username || '');
    const [teacherId, setTeacherId] = useState(user?.unsafeMetadata?.teacherId || '');
    const [department, setDepartment] = useState(user?.unsafeMetadata?.department || '');

    // Effect to update form states when user data changes
    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setTeacherId(user.unsafeMetadata?.teacherId || '');
            setDepartment(user.unsafeMetadata?.department || '');
        }
    }, [user, refreshTrigger]);

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            setClassroomsLoading(true);
            console.log('Fetching classrooms for teacher ID:', user.id);
            const response = await fetch(`http://192.168.0.220:5000/api/classrooms/teacher/${user.id}`);
            console.log('Response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Response data:', data);
                if (data.success) {
                    setClassrooms(data.classrooms || []);
                } else {
                    console.error('Failed to fetch classrooms:', data.message);
                    setClassrooms([]);
                }
            } else {
                console.error('Response not ok:', response.status);
                setClassrooms([]);
            }
        } catch (error) {
            console.error('Error fetching classrooms:', error);
            setClassrooms([]);
        } finally {
            setClassroomsLoading(false);
        }
    };

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
                    teacherId: teacherId.trim(),
                    department: department.trim(),
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
                    teacherId: teacherId.trim(),
                    department: department.trim(),
                    userType: 'Teacher'
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server response error:', errorData);
                throw new Error(`Failed to update profile: ${response.status} - ${errorData}`);
            }

            const responseData = await response.json();
            console.log('Profile update response:', responseData);

            // Update classroom references where this teacher is the owner
            try {
                const classroomUpdateResponse = await fetch(`http://192.168.0.220:5000/api/classrooms/update-teacher`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        teacherClerkId: user.id,
                        newTeacherName: username.trim(),
                        newTeacherId: teacherId.trim(),
                        newDepartment: department.trim()
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

    const handleDeleteClassroom = (classroomId, classroomName) => {
        Alert.alert(
            'Delete Classroom',
            `Are you sure you want to delete "${classroomName}"? This action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteClassroom(classroomId),
                },
            ]
        );
    };

    const deleteClassroom = async (classroomId) => {
        try {
            const response = await fetch(`http://192.168.0.220:5000/api/classrooms/${classroomId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                Alert.alert('Success', 'Classroom deleted successfully!');
                fetchClassrooms(); // Refresh the list
            } else {
                throw new Error('Failed to delete classroom');
            }
        } catch (error) {
            console.error('Error deleting classroom:', error);
            Alert.alert('Error', 'Failed to delete classroom. Please try again.');
        }
    };

    const renderClassroomItem = ({ item }) => (
        <View style={tw`bg-slate-700 rounded-lg p-4 mb-3 flex-row justify-between items-center`}>
            <Text style={[tw`text-white text-lg font-semibold flex-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                {item.courseName}
            </Text>
            
            <TouchableOpacity
                style={tw`bg-red-600 px-4 py-2 rounded-lg ml-3`}
                onPress={() => handleDeleteClassroom(item._id, item.courseName)}
                activeOpacity={0.8}
            >
                <Text style={[tw`text-white text-sm font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

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
                                    {(username || user?.username || 'T')[0].toUpperCase()}
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
                        {username || user?.username || 'Teacher'}
                    </Text>
                    
                    {/* Teacher ID */}
                    <Text style={[tw`text-gray-400 text-lg mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Teacher ID: {teacherId || 'Not Set'}
                    </Text>

                    {/* Teacher Details */}
                    <View style={tw`items-center mt-2`}>
                        {department && (
                            <Text style={[tw`text-gray-300 text-sm mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                                Department: {department}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Edit Profile Button */}
                <TouchableOpacity
                    style={tw`bg-slate-700 py-4 rounded-lg mb-6`}
                    onPress={() => setEditModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Text style={[tw`text-white text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>

                {/* Your Classrooms Section */}
                <View style={tw`mb-8`}>
                    <Text style={[tw`text-white text-xl font-semibold mb-4`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Your Classrooms
                    </Text>

                    {classroomsLoading ? (
                        <View style={tw`items-center py-8`}>
                            <ActivityIndicator size="large" color="#06b6d4" />
                            <Text style={[tw`text-gray-400 mt-2`, { fontFamily: 'MarckScript_400Regular' }]}>Loading classrooms...</Text>
                        </View>
                    ) : classrooms.length > 0 ? (
                        <FlatList
                            data={classrooms}
                            renderItem={renderClassroomItem}
                            keyExtractor={(item) => item._id}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={tw`bg-slate-700 rounded-lg p-6 items-center`}>
                            <Text style={[tw`text-gray-400 text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                                No classrooms created yet
                            </Text>
                            <TouchableOpacity
                                style={tw`bg-cyan-600 py-2 px-4 rounded-lg mt-3`}
                                onPress={() => navigation.navigate('CreateClassroom')}
                                activeOpacity={0.8}
                            >
                                <Text style={[tw`text-white font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>Create Classroom</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={tw`flex-row bg-slate-900 border-t border-slate-700 ${Platform.OS === 'android' ? 'pb-6' : 'pb-2'}`}>
                {/* Home Tab */}
                <TouchableOpacity 
                    style={tw`flex-1 items-center py-4`}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('TeacherMain')}
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

                            {/* Teacher ID */}
                            <View style={tw`mb-4`}>
                                <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Teacher ID</Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                                    value={teacherId}
                                    onChangeText={setTeacherId}
                                    placeholder="Enter teacher ID"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            {/* Department */}
                            <View style={tw`mb-6`}>
                                <Text style={[tw`text-gray-300 text-sm mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>Department</Text>
                                <TextInput
                                    style={tw`bg-slate-700 text-white px-4 py-3 rounded-lg`}
                                    value={department}
                                    onChangeText={setDepartment}
                                    placeholder="Enter department"
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

export default TeacherProfile;
