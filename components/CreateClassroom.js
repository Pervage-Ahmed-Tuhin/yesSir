import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, TextInput } from 'react-native';
import tw from 'twrnc';
import { useUser } from '@clerk/clerk-expo';
import { createClassroom } from '../utils/api';

const CreateClassroom = ({ navigation }) => {
    const [courseName, setCourseName] = useState('');
    const [uniqueClassCode, setUniqueClassCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();

    const handleCreateClassroom = async () => {
        if (!courseName.trim()) {
            Alert.alert('Required Field', 'Please enter a course name');
            return;
        }

        if (!uniqueClassCode.trim()) {
            Alert.alert('Required Field', 'Please enter a unique class code');
            return;
        }

        setIsLoading(true);

        try {
            const classroomData = {
                courseName: courseName.trim(),
                classCode: uniqueClassCode.trim(),
                teacherId: user?.unsafeMetadata?.teacherId,
                teacherName: user?.username || 'Teacher',
                department: user?.unsafeMetadata?.department || '',
                createdBy: user?.id
            };

            console.log('Creating classroom with data:', classroomData);

            const response = await createClassroom(classroomData);
            
            if (response.success) {
                Alert.alert(
                    'Success',
                    'Classroom created successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Navigate back and trigger refresh if coming from MyClassrooms
                                if (navigation.getState().routes.some(route => route.name === 'MyClassrooms')) {
                                    navigation.navigate('MyClassrooms', { refresh: true });
                                } else {
                                    navigation.goBack();
                                }
                            }
                        }
                    ]
                );
            } else {
                throw new Error(response.message || 'Failed to create classroom');
            }
        } catch (error) {
            console.error('Create classroom error:', error);
            Alert.alert('Error', 'Failed to create classroom. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`}>
            {/* Header */}
            <View style={tw`flex-row items-center px-6 py-4 border-b border-slate-700`}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={tw`mr-4`}
                    activeOpacity={0.8}
                >
                    <Text style={tw`text-white text-2xl`}>←</Text>
                </TouchableOpacity>
                <Text style={[tw`text-white text-xl font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>
                    Create Classroom
                </Text>
            </View>

            {/* Content */}
            <View style={tw`flex-1 px-6 py-8`}>
                {/* Course Name Input */}
                <View style={tw`mb-6`}>
                    <TextInput
                        style={tw`bg-slate-700 text-white px-4 py-4 rounded-lg text-lg border border-slate-600`}
                        placeholder="Course Name"
                        placeholderTextColor="#64748b"
                        value={courseName}
                        onChangeText={setCourseName}
                        autoCapitalize="words"
                    />
                </View>

                {/* Unique Class Code Input */}
                <View style={tw`mb-2`}>
                    <TextInput
                        style={tw`bg-slate-700 text-white px-4 py-4 rounded-lg text-lg border border-slate-600`}
                        placeholder="Unique Class Code"
                        placeholderTextColor="#64748b"
                        value={uniqueClassCode}
                        onChangeText={(text) => setUniqueClassCode(text.toUpperCase())}
                        autoCapitalize="characters"
                    />
                </View>

                {/* Format Message */}
                <Text style={[tw`text-gray-400 text-sm mb-8 px-2`, { fontFamily: 'MarckScript_400Regular' }]}>
                    Format: batch_section_courseid (e.g., 2024_A_CSE101)
                </Text>

                {/* Spacer */}
                <View style={tw`flex-1`} />

                {/* Create Button */}
                <TouchableOpacity
                    style={tw`bg-cyan-400 py-4 rounded-lg ${isLoading || !courseName.trim() || !uniqueClassCode.trim() ? 'opacity-50' : ''}`}
                    onPress={handleCreateClassroom}
                    activeOpacity={0.8}
                    disabled={isLoading || !courseName.trim() || !uniqueClassCode.trim()}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#1e293b" />
                    ) : (
                        <Text style={[tw`text-slate-800 text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                            Create
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default CreateClassroom;
