import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, Platform } from 'react-native';
import tw from 'twrnc';
import { generateExcelReport, cleanupSessionData } from '../utils/api';
import { downloadFile } from '../utils/downloadHelper';

const AttendanceComplete = ({ navigation, route }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { classroom, attendanceList } = route.params;

    const handleGenerateExcel = async () => {
        try {
            setIsLoading(true);

            // For mobile devices, generate Excel locally with current attendance data
            if (Platform.OS !== 'web' && attendanceList.length > 0) {
                console.log('Generating Excel locally for mobile...');
                
                // Prepare data in the format: Student ID, Photo URL, Course Name, Date
                const excelData = attendanceList.map(attendance => ({
                    'Student ID': attendance.studentId,
                    'Photo URL': attendance.photoUrl,
                    'Course Name': classroom.courseName,
                    'Date': new Date().toDateString()
                }));

                const fileName = `${classroom.courseName}_attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
                
                const result = await downloadFile(null, fileName, excelData);
                
                if (result.success) {
                    Alert.alert(
                        'Excel Generated Successfully! 📊',
                        `Attendance report created and ready to share!\n\n` +
                        `• ${attendanceList.length} student records included\n` +
                        `• File: ${fileName}\n\n` +
                        `Contains: Student ID, Photo URL, Course Name, Date`,
                        [{ text: 'Great!' }]
                    );
                } else {
                    throw new Error(result.message);
                }
                
                return;
            }

            // For web or when no local data, use server generation
            console.log('Using server Excel generation...');
            const response = await generateExcelReport(classroom._id);
            
            if (response.success) {
                Alert.alert(
                    'Excel Generated Successfully! 📊',
                    'Your attendance report has been generated and downloaded.',
                    [{ text: 'Great!' }]
                );
            } else {
                throw new Error(response.message || 'Failed to generate Excel report');
            }
        } catch (error) {
            console.error('Excel generation error:', error);
            Alert.alert(
                'Error',
                'Failed to generate Excel report. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToHome = async () => {
        try {
            console.log('🏠 Back to Home pressed - cleaning up session data...');
            
            // Show confirmation dialog
            Alert.alert(
                'Cleanup Session Data',
                'This will delete today\'s attendance session and records from the database to free up space. Are you sure you want to continue?\n\n💡 Make sure you\'ve downloaded the Excel report first!',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Yes, Clean Up',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                setIsLoading(true);
                                
                                // Clean up session data
                                const cleanupResponse = await cleanupSessionData(classroom._id);
                                
                                if (cleanupResponse.success) {
                                    console.log('✅ Session data cleaned up successfully');
                                    
                                    // Show success message
                                    Alert.alert(
                                        'Cleanup Complete! 🧹',
                                        `Successfully deleted:\n• ${cleanupResponse.deletedSessions} session(s)\n• ${cleanupResponse.deletedAttendance} attendance record(s)\n\nDatabase space freed up!`,
                                        [
                                            {
                                                text: 'Great!',
                                                onPress: () => {
                                                    // Navigate back to home
                                                    navigation.reset({
                                                        index: 0,
                                                        routes: [{ name: 'TeacherMain' }]
                                                    });
                                                }
                                            }
                                        ]
                                    );
                                } else {
                                    throw new Error(cleanupResponse.message || 'Cleanup failed');
                                }
                            } catch (error) {
                                console.error('Cleanup error:', error);
                                Alert.alert(
                                    'Cleanup Failed',
                                    'Failed to clean up session data. You can still go back to home.',
                                    [
                                        {
                                            text: 'Go Home Anyway',
                                            onPress: () => {
                                                navigation.reset({
                                                    index: 0,
                                                    routes: [{ name: 'TeacherMain' }]
                                                });
                                            }
                                        }
                                    ]
                                );
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error in handleBackToHome:', error);
            // Fallback - just navigate home
            navigation.reset({
                index: 0,
                routes: [{ name: 'TeacherMain' }]
            });
        }
    };

    const handleBackToClassroom = () => {
        // Navigate back to the classroom (StartAttendance)
        navigation.goBack();
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`}>
            <View style={tw`flex-1 px-6 py-8`}>
                {/* Header */}
                <View style={tw`items-center mb-12`}>
                    <Text style={[tw`text-white text-3xl font-bold mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>
                        ✅ Attendance Complete
                    </Text>
                    <Text style={[tw`text-gray-300 text-center text-lg`, { fontFamily: 'MarckScript_400Regular' }]}>
                        {classroom.courseName}
                    </Text>
                    <Text style={tw`text-gray-400 text-center`}>
                        {classroom.classCode}
                    </Text>
                </View>

                {/* Summary */}
                <View style={tw`bg-slate-700 rounded-lg p-6 mb-8`}>
                    <Text style={tw`text-white text-xl font-semibold mb-4 text-center`}>
                        Session Summary
                    </Text>
                    
                    <View style={tw`flex-row justify-between items-center mb-3`}>
                        <Text style={tw`text-gray-300`}>Total Students Present:</Text>
                        <Text style={tw`text-cyan-400 font-semibold text-lg`}>
                            {attendanceList.length}
                        </Text>
                    </View>
                    
                    <View style={tw`flex-row justify-between items-center mb-3`}>
                        <Text style={tw`text-gray-300`}>Session Date:</Text>
                        <Text style={tw`text-white font-semibold`}>
                            {new Date().toLocaleDateString()}
                        </Text>
                    </View>
                    
                    <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-gray-300`}>Session Time:</Text>
                        <Text style={tw`text-white font-semibold`}>
                            {new Date().toLocaleTimeString()}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={tw`flex-1 justify-center`}>
                    {attendanceList.length > 0 ? (
                        <TouchableOpacity
                            style={tw`bg-green-600 py-4 rounded-lg mb-6 ${isLoading ? 'opacity-50' : ''}`}
                            onPress={handleGenerateExcel}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <Text style={tw`text-white text-lg font-semibold text-center`}>
                                {isLoading ? 'Generating Excel...' : '📊 Download Excel Report'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={tw`bg-slate-700 py-4 rounded-lg mb-6`}>
                            <Text style={tw`text-gray-400 text-center text-lg`}>
                                No students submitted attendance
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={tw`bg-cyan-600 py-4 rounded-lg`}
                        onPress={handleBackToHome}
                        activeOpacity={0.8}
                    >
                        <Text style={tw`text-white text-lg font-semibold text-center`}>
                            🏠 Back to Home
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={tw`mt-8`}>
                    <Text style={tw`text-gray-400 text-center text-sm`}>
                        Session completed at {new Date().toLocaleTimeString()}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default AttendanceComplete;
