import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, FlatList, Linking, Platform } from 'react-native';
import tw from 'twrnc';
import { startAttendanceSession, stopAttendanceSession, getAttendanceList, generateExcelReport } from '../utils/api';
import { downloadFile } from '../utils/downloadHelper';

const StartAttendance = ({ navigation, route }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [attendanceList, setAttendanceList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { classroom } = route.params;

    // Load attendance list when component mounts
    useEffect(() => {
        loadAttendanceList();
    }, []);

    useEffect(() => {
        // Timer countdown
        if (timeRemaining > 0 && isSessionActive) {
            const timer = setTimeout(() => {
                setTimeRemaining(timeRemaining - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeRemaining === 0 && isSessionActive) {
            // Auto-stop session when timer reaches 0
            handleStopAttendance();
        }
    }, [timeRemaining, isSessionActive]);

    // Real-time attendance list updates
    useEffect(() => {
        let interval = null;
        if (isSessionActive) {
            // Load attendance list every 3 seconds during active session
            interval = setInterval(() => {
                loadAttendanceList();
            }, 3000);
        } else {
            // Clear interval when session is not active
            if (interval) {
                clearInterval(interval);
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isSessionActive]);

    const handleStartAttendance = async () => {
        try {
            setIsLoading(true);
            const response = await startAttendanceSession(classroom._id);
            
            if (response.success) {
                setIsSessionActive(true);
                setTimeRemaining(300); // 5 minutes (300 seconds)
                setAttendanceList([]); // Clear previous list
                // Load attendance list immediately after starting
                await loadAttendanceList();
                Alert.alert('Attendance Started', 'Students can now submit their attendance for 5 minutes.');
            } else {
                throw new Error(response.message || 'Failed to start attendance');
            }
        } catch (error) {
            console.error('Start attendance error:', error);
            Alert.alert('Error', 'Failed to start attendance session. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopAttendance = async () => {
        try {
            setIsLoading(true);
            const response = await stopAttendanceSession(classroom._id);
            
            if (response.success) {
                setIsSessionActive(false);
                setTimeRemaining(0);
                
                // Load final attendance list
                await loadAttendanceList();
                
                // Navigate to completion page instead of showing alert
                navigation.navigate('AttendanceComplete', {
                    classroom: classroom,
                    attendanceList: attendanceList
                });
            } else {
                // Handle the case where session doesn't exist gracefully
                console.log('No active session found, ending session locally');
                setIsSessionActive(false);
                setTimeRemaining(0);
                
                // Still navigate to completion page with current data
                navigation.navigate('AttendanceComplete', {
                    classroom: classroom,
                    attendanceList: attendanceList
                });
            }
        } catch (error) {
            console.error('Stop attendance error:', error);
            
            // Even if there's an error, navigate to completion page
            // This handles the "No active session found" error gracefully
            setIsSessionActive(false);
            setTimeRemaining(0);
            
            navigation.navigate('AttendanceComplete', {
                classroom: classroom,
                attendanceList: attendanceList
            });
        } finally {
            setIsLoading(false);
        }
    };

    const loadAttendanceList = async () => {
        try {
            console.log('Loading attendance list for classroom:', classroom._id);
            const response = await getAttendanceList(classroom._id);
            console.log('Attendance list response:', response);
            if (response.success) {
                setAttendanceList(response.attendanceList || []);
                console.log('Attendance list updated:', response.attendanceList?.length || 0, 'students');
            }
        } catch (error) {
            console.error('Failed to load attendance list:', error);
        }
    };

    const handleGenerateExcel = async () => {
        try {
            setIsLoading(true);

            // For mobile devices, generate Excel locally with current attendance data
            if (Platform.OS !== 'web' && attendanceList.length > 0) {
                console.log('Generating Excel locally for mobile...');
                
                // Prepare data in the format you requested: Student ID, Photo URL, Course Name, Date
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
                    `Attendance report ready for download!\n\n` +
                    `• ${response.recordsProcessed || attendanceList.length} student records included\n` +
                    `• File: ${response.fileName || 'attendance_report.xlsx'}\n\n` +
                    `Contains: Student ID, Photo URL, Course Name, Date`,
                    [
                        {
                            text: 'Download Now',
                            onPress: async () => {
                                try {
                                    if (response.downloadUrl) {
                                        console.log('Starting download process...');
                                        const downloadResult = await downloadFile(response.downloadUrl, response.fileName);
                                        
                                        if (downloadResult.success) {
                                            Alert.alert('Download Started! 📥', downloadResult.message);
                                        } else {
                                            // Fallback - show URL for manual download
                                            Alert.alert(
                                                'Download URL Ready',
                                                `Please copy this URL to download manually:\n\n${downloadResult.url}`,
                                                [
                                                    {
                                                        text: 'Copy & Open',
                                                        onPress: () => {
                                                            console.log('Manual download URL:', downloadResult.url);
                                                            // Try opening in browser as fallback
                                                            Linking.openURL(downloadResult.url).catch(() => {
                                                                console.log('Manual intervention needed');
                                                            });
                                                        }
                                                    },
                                                    { text: 'OK' }
                                                ]
                                            );
                                        }
                                    } else {
                                        Alert.alert('Error', 'No download URL received from server');
                                    }
                                } catch (error) {
                                    console.error('Download process error:', error);
                                    Alert.alert('Download Error', `Failed to download: ${error.message}`);
                                }
                            }
                        },
                        { text: 'Later' }
                    ]
                );
                // Don't clear attendance list since records are not deleted anymore
            } else {
                throw new Error(response.message || 'Failed to generate Excel');
            }
        } catch (error) {
            console.error('Generate Excel error:', error);
            Alert.alert('Error', 'Failed to generate Excel report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderAttendanceItem = ({ item }) => (
        <View style={tw`bg-slate-700 rounded-lg p-4 mb-3 mx-6`}>
            <View style={tw`flex-row justify-between items-center`}>
                <View style={tw`flex-1`}>
                    <Text style={tw`text-white text-lg font-semibold mb-1`}>
                        {item.studentName}
                    </Text>
                    <Text style={tw`text-gray-400 text-sm`}>
                        ID: {item.studentId}
                    </Text>
                    <Text style={tw`text-gray-400 text-xs`}>
                        Submitted: {new Date(item.submittedAt).toLocaleTimeString()}
                    </Text>
                </View>
                <View style={tw`items-center`}>
                    <View style={tw`w-3 h-3 bg-green-500 rounded-full mb-1`} />
                    <Text style={tw`text-green-400 text-xs`}>Present</Text>
                </View>
            </View>
        </View>
    );

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
                    {classroom.courseName} - Attendance
                </Text>
            </View>

            {/* Content */}
            <View style={tw`flex-1 p-6`}>
                {/* Timer and Status */}
                <View style={tw`bg-slate-700 rounded-lg p-6 mb-6`}>
                    <Text style={tw`text-white text-xl font-bold text-center mb-4`}>
                        Attendance Session
                    </Text>
                    
                    {isSessionActive ? (
                        <View style={tw`items-center`}>
                            <Text style={tw`text-cyan-400 text-3xl font-bold mb-2`}>
                                {formatTime(timeRemaining)}
                            </Text>
                            <Text style={tw`text-gray-300 text-center mb-4`}>
                                Students can submit attendance
                            </Text>
                            <Text style={tw`text-yellow-400 text-sm text-center`}>
                                ⏱️ Timer will auto-stop when complete
                            </Text>
                        </View>
                    ) : (
                        <View style={tw`items-center`}>
                            <Text style={tw`text-gray-300 text-center mb-4`}>
                                No active session. Start attendance to allow students to submit.
                            </Text>
                            <TouchableOpacity
                                style={tw`bg-cyan-400 px-6 py-3 rounded-lg`}
                                onPress={handleStartAttendance}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <Text style={tw`text-slate-800 font-semibold`}>
                                    Start Attendance (5 min)
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Attendance Count */}
                <View style={tw`mb-4`}>
                    <Text style={tw`text-white text-lg font-semibold`}>
                        Present Students ({attendanceList.length})
                        {isSessionActive && <Text style={tw`text-cyan-400 text-sm`}> • Live</Text>}
                    </Text>
                </View>

                {/* Attendance List */}
                <View style={tw`flex-1`}>
                    {attendanceList.length === 0 ? (
                        <View style={tw`flex-1 justify-center items-center`}>
                            <Text style={tw`text-gray-400 text-center`}>
                                No attendance submissions yet
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={attendanceList}
                            renderItem={renderAttendanceItem}
                            keyExtractor={(item) => item._id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={tw`pb-6`}
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default StartAttendance;
