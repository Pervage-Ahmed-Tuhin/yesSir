import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, TextInput, Image, ScrollView } from 'react-native';
import tw from 'twrnc';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { submitAttendance, getAttendanceStatus } from '../utils/api';

const MarkAttendance = ({ navigation, route }) => {
    const [studentId, setStudentId] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const { user } = useUser();
    const { classroom, studentInfo } = route.params;

    useEffect(() => {
        // Set student ID from user metadata
        if (user?.unsafeMetadata?.studentId) {
            setStudentId(user.unsafeMetadata.studentId);
        }

        // Check attendance status periodically
        const checkStatus = async () => {
            try {
                const response = await getAttendanceStatus(classroom._id);
                console.log('Attendance status response:', response);
                if (response.success) {
                    setIsSubmitEnabled(response.isActive);
                    setTimeRemaining(response.timeRemaining || 0);
                    console.log('Submit enabled:', response.isActive, 'Time remaining:', response.timeRemaining);
                }
            } catch (error) {
                console.error('Failed to check attendance status:', error);
            }
        };

        // Check immediately and then every 5 seconds
        checkStatus();
        const interval = setInterval(checkStatus, 5000);

        return () => clearInterval(interval);
    }, [classroom._id]);

    useEffect(() => {
        // Timer countdown
        if (timeRemaining > 0) {
            const timer = setTimeout(() => {
                setTimeRemaining(timeRemaining - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [timeRemaining]);

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is required to take attendance photo.');
            return false;
        }
        return true;
    };

    const captureImage = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setCapturedImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error capturing image:', error);
            Alert.alert('Error', 'Failed to capture image. Please try again.');
        }
    };

    const handleSubmitAttendance = async () => {
        if (!studentId.trim()) {
            Alert.alert('Required Field', 'Please enter your Student ID');
            return;
        }

        if (!capturedImage) {
            Alert.alert('Photo Required', 'Please capture your photo for attendance verification');
            return;
        }

        setIsLoading(true);

        try {
            // Create FormData for image upload
            const formData = new FormData();
            formData.append('photo', {
                uri: capturedImage.uri,
                type: 'image/jpeg',
                name: `attendance_${studentId}_${Date.now()}.jpg`,
            });
            formData.append('studentId', studentId);
            formData.append('studentName', user?.username || 'Student');
            formData.append('studentEmail', user?.emailAddresses[0]?.emailAddress || 'student@email.com');

            console.log('Submitting attendance for classroom:', classroom._id);
            console.log('Student ID:', studentId);

            const response = await submitAttendance(classroom._id, formData);
            console.log('Submit response:', response);

            if (response.success) {
                Alert.alert(
                    'Attendance Submitted',
                    'Your attendance has been recorded successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            } else {
                throw new Error(response.message || 'Failed to submit attendance');
            }

        } catch (error) {
            console.error('Submit attendance error:', error);
            Alert.alert('Error', 'Failed to submit attendance. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                    Mark Attendance
                </Text>
            </View>

            {/* Content */}
            <ScrollView 
                style={tw`flex-1`}
                contentContainerStyle={tw`px-6 py-8`}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Text style={[tw`text-white text-3xl font-bold text-center mb-4`, { fontFamily: 'MarckScript_400Regular' }]}>
                    Capture Student ID
                </Text>

                {/* Subtitle */}
                <Text style={[tw`text-gray-300 text-center mb-8 px-4`, { fontFamily: 'MarckScript_400Regular' }]}>
                    Position the student ID within the frame and ensure it's clear and legible.
                </Text>

                {/* Timer Display */}
                {timeRemaining > 0 && (
                    <View style={tw`bg-cyan-400 rounded-lg p-4 mb-6`}>
                        <Text style={tw`text-slate-800 text-center font-bold text-lg`}>
                            Time Remaining: {formatTime(timeRemaining)}
                        </Text>
                    </View>
                )}

                {/* Status Display */}
                {!isSubmitEnabled && timeRemaining === 0 && (
                    <View style={tw`bg-gray-600 rounded-lg p-4 mb-6`}>
                        <Text style={tw`text-white text-center font-semibold`}>
                            Waiting for teacher to start attendance...
                        </Text>
                    </View>
                )}

                {/* Camera Section */}
                <View style={tw`items-center mb-8`}>
                    <TouchableOpacity
                        style={tw`w-20 h-20 bg-slate-600 rounded-full items-center justify-center mb-4`}
                        onPress={captureImage}
                        activeOpacity={0.8}
                    >
                        <Text style={tw`text-white text-3xl`}>📷</Text>
                    </TouchableOpacity>
                    
                    {capturedImage && (
                        <View style={tw`mt-4`}>
                            <Image 
                                source={{ uri: capturedImage.uri }} 
                                style={tw`w-32 h-32 rounded-lg`}
                                resizeMode="cover"
                            />
                            <Text style={tw`text-green-400 text-center mt-2`}>
                                Photo captured ✓
                            </Text>
                        </View>
                    )}
                </View>

                {/* Student ID Input */}
                <View style={tw`mb-8`}>
                    <TextInput
                        style={tw`bg-slate-700 text-white px-4 py-4 rounded-lg text-lg border border-slate-600`}
                        placeholder="Student ID"
                        placeholderTextColor="#64748b"
                        value={studentId}
                        onChangeText={setStudentId}
                        editable={isSubmitEnabled}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={tw`bg-cyan-400 py-4 rounded-lg ${!isSubmitEnabled || isLoading || !studentId.trim() || !capturedImage ? 'opacity-50' : ''}`}
                    onPress={handleSubmitAttendance}
                    activeOpacity={0.8}
                    disabled={!isSubmitEnabled || isLoading || !studentId.trim() || !capturedImage}
                >
                    <Text style={tw`text-slate-800 text-lg font-semibold text-center`}>
                        {isLoading ? 'Submitting...' : 'Submit'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={tw`flex-row bg-slate-900 border-t border-slate-700`}>
                {/* Home Tab */}
                <TouchableOpacity 
                    style={tw`flex-1 items-center py-3`}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('StudentHome')}
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

export default MarkAttendance;
