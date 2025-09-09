import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { useUser } from '@clerk/clerk-expo';
import { getTeacherClassrooms } from '../utils/api';
import { useFocusEffect } from '@react-navigation/native';

const MyClassrooms = ({ navigation, route }) => {
    const [classrooms, setClassrooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useUser();

    useEffect(() => {
        loadClassrooms();
    }, []);

    // Refresh when screen comes into focus or when refresh param is passed
    useFocusEffect(
        React.useCallback(() => {
            if (route.params?.refresh) {
                loadClassrooms();
                // Clear the refresh param
                navigation.setParams({ refresh: false });
            }
        }, [route.params?.refresh])
    );

    const loadClassrooms = async () => {
        try {
            setIsLoading(true);
            const teacherClerkId = user?.id; // Use Clerk user ID instead of teacherId
            
            if (teacherClerkId) {
                console.log('Loading classrooms for teacher Clerk ID:', teacherClerkId);
                const response = await getTeacherClassrooms(teacherClerkId);
                if (response.success) {
                    setClassrooms(response.classrooms);
                    console.log('Loaded classrooms:', response.classrooms);
                } else {
                    console.log('No classrooms found or failed response:', response);
                }
            } else {
                console.log('No teacher Clerk ID found');
            }
        } catch (error) {
            console.error('Failed to load classrooms:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartAttendance = (classroom) => {
        navigation.navigate('StartAttendance', { classroom });
    };

    const renderClassroomItem = ({ item }) => (
        <View style={tw`bg-slate-700 rounded-lg p-4 mb-4 mx-6`}>
            <View style={tw`flex-row justify-between items-center`}>
                <View style={tw`flex-1`}>
                    <Text style={[tw`text-white text-lg font-semibold mb-1`, { fontFamily: 'MarckScript_400Regular' }]}>
                        {item.courseName}
                    </Text>
                    <Text style={[tw`text-gray-400 text-sm`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Join Code: {item.classCode}
                    </Text>
                </View>
                <TouchableOpacity
                    style={tw`bg-slate-600 px-4 py-2 rounded-lg`}
                    onPress={() => handleStartAttendance(item)}
                    activeOpacity={0.8}
                >
                    <Text style={tw`text-white text-sm font-medium`}>
                        Start Attendance
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`}>
            {/* Header */}
            <View style={tw`flex-row justify-between items-center px-6 py-4 border-b border-slate-700`}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={tw`mr-4`}
                    activeOpacity={0.8}
                >
                    <Text style={tw`text-white text-2xl`}>←</Text>
                </TouchableOpacity>
                <Text style={[tw`text-white text-xl font-semibold flex-1 text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                    My Classrooms
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreateClassroom')}
                    style={tw`p-2`}
                    activeOpacity={0.8}
                >
                    <Text style={tw`text-white text-2xl font-light`}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={tw`flex-1 pt-6`}>
                {isLoading ? (
                    <View style={tw`flex-1 justify-center items-center`}>
                        <ActivityIndicator size="large" color="#06b6d4" />
                        <Text style={[tw`text-gray-400 mt-4`, { fontFamily: 'MarckScript_400Regular' }]}>Loading classrooms...</Text>
                    </View>
                ) : classrooms.length === 0 ? (
                    <View style={tw`flex-1 justify-center items-center px-6`}>
                        <Text style={tw`text-gray-400 text-lg text-center mb-4`}>
                            No classrooms created yet
                        </Text>
                        <Text style={tw`text-gray-500 text-center mb-6`}>
                            Create your first classroom to get started
                        </Text>
                        <TouchableOpacity
                            style={tw`bg-cyan-400 px-6 py-3 rounded-lg`}
                            onPress={() => navigation.navigate('CreateClassroom')}
                            activeOpacity={0.8}
                        >
                            <Text style={tw`text-slate-800 font-semibold`}>
                                Create Classroom
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={classrooms}
                        renderItem={renderClassroomItem}
                        keyExtractor={(item) => item._id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={tw`pb-6`}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default MyClassrooms;
