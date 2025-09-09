import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useUser } from '@clerk/clerk-expo';
import { getClassroomByCode, joinClassroom } from '../utils/api';

const JoinClassroom = ({ navigation }) => {
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();

    const handleJoinClassroom = async () => {
        if (!joinCode.trim()) {
            Alert.alert('Required Field', 'Please enter a join code');
            return;
        }

        setIsLoading(true);

        try {
            // First, check if classroom exists
            console.log('Searching for classroom with code:', joinCode.toUpperCase());
            const classroomResponse = await getClassroomByCode(joinCode.toUpperCase());
            console.log('Classroom response:', classroomResponse);
            
            if (!classroomResponse.success) {
                Alert.alert('Classroom Not Found', 'Please check the join code and try again.');
                return;
            }

            const classroom = classroomResponse.classroom;

            // Check if student is already enrolled
            const isAlreadyEnrolled = classroom.students && classroom.students.some(
                student => student.clerkUserId === user?.id
            );

            if (isAlreadyEnrolled) {
                // If already enrolled, go directly to attendance page
                navigation.navigate('MarkAttendance', { 
                    classroom: classroom,
                    studentInfo: {
                        studentId: user?.unsafeMetadata?.studentId,
                        studentName: user?.username || 'Student',
                        clerkUserId: user?.id
                    }
                });
                return;
            }

            // Join the classroom
            const joinData = {
                classCode: joinCode.toUpperCase(),
                studentId: user?.unsafeMetadata?.studentId,
                studentName: user?.username || 'Student',
                clerkUserId: user?.id
            };

            const joinResponse = await joinClassroom(joinData);

            if (joinResponse.success) {
                Alert.alert(
                    'Success',
                    `You have successfully joined ${classroom.courseName}!`,
                    [
                        {
                            text: 'Continue to Attendance',
                            onPress: () => navigation.navigate('MarkAttendance', { 
                                classroom: classroom,
                                studentInfo: joinData
                            })
                        }
                    ]
                );
            } else {
                throw new Error(joinResponse.message || 'Failed to join classroom');
            }

        } catch (error) {
            console.error('Join classroom error:', error);
            Alert.alert('Error', 'Failed to join classroom. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={tw`flex-row items-center px-6 py-4 border-b border-slate-700 ${Platform.OS === 'android' ? 'mt-2' : ''}`}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={tw`mr-4`}
                    activeOpacity={0.8}
                >
                    <Text style={tw`text-white text-2xl`}>←</Text>
                </TouchableOpacity>
                <Text style={[tw`text-white text-xl font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>
                    Join Classroom
                </Text>
            </View>

            {/* Content with Keyboard Avoidance */}
            <KeyboardAvoidingView 
                style={tw`flex-1`}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={tw`flex-1 px-6 py-8`}>
                    {/* Join Code Input */}
                    <View style={tw`mb-8`}>
                        <TextInput
                            style={tw`bg-slate-700 text-white px-4 py-4 rounded-lg text-lg border border-slate-600`}
                            placeholder="Enter Join Code"
                            placeholderTextColor="#64748b"
                            value={joinCode}
                            onChangeText={(text) => setJoinCode(text.toUpperCase())}
                            autoCapitalize="characters"
                        />
                    </View>

                    {/* Spacer */}
                    <View style={tw`flex-1`} />

                    {/* Join Button */}
                    <TouchableOpacity
                        style={tw`bg-cyan-400 py-4 rounded-lg ${isLoading || !joinCode.trim() ? 'opacity-50' : ''}`}
                        onPress={handleJoinClassroom}
                        activeOpacity={0.8}
                        disabled={isLoading || !joinCode.trim()}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#1e293b" />
                        ) : (
                            <Text style={[tw`text-slate-800 text-lg font-semibold text-center`, { fontFamily: 'MarckScript_400Regular' }]}>
                                Join
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default JoinClassroom;
