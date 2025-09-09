// Download helper for cross-platform file downloads
import { Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

// Export attendance data to Excel for mobile
const exportAttendanceToExcel = async (attendanceData, fileName = 'attendance.xlsx') => {
    try {
        console.log('Creating Excel with data:', attendanceData.length, 'records');

        // 1. Convert JSON -> Worksheet
        const worksheet = XLSX.utils.json_to_sheet(attendanceData);

        // 2. Create a Workbook and add the Worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

        // 3. Write the workbook to binary string
        const wbout = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

        // 4. Create file path
        const fileUri = FileSystem.cacheDirectory + fileName;

        // 5. Write the file
        await FileSystem.writeAsStringAsync(fileUri, wbout, {
            encoding: FileSystem.EncodingType.Base64,
        });

        console.log('Excel file created at:', fileUri);

        // 6. Share the file
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                dialogTitle: "Share Attendance Excel",
                UTI: "com.microsoft.excel.xlsx",
            });
            return { success: true, message: 'Excel file shared successfully' };
        } else {
            return { success: false, message: 'Sharing not available on this device' };
        }

    } catch (error) {
        console.error('Excel export error:', error);
        return { success: false, message: error.message };
    }
};

// Main download function with mobile Excel generation
const downloadFile = async (url, fileName, attendanceData = null) => {
    try {
        console.log('Starting download for:', fileName);
        console.log('Platform:', Platform.OS);

        // For mobile (iOS/Android) - generate Excel locally
        if (Platform.OS !== 'web' && attendanceData) {
            console.log('Generating Excel locally for mobile...');
            return await exportAttendanceToExcel(attendanceData, fileName);
        }
        // For web (Expo web) - download from URL
        else if (Platform.OS === 'web') {
            console.log('Using web download...');
            // Create a temporary link element and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.target = '_blank';
            
            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return { success: true, message: 'Download started in browser' };
        } 
        // Fallback for mobile without data - try URL opening
        else {
            console.log('Using URL fallback...');
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
                return { success: true, message: 'Opened in browser for download' };
            } else {
                return { 
                    success: false, 
                    message: 'Cannot open URL', 
                    url: url 
                };
            }
        }
    } catch (error) {
        console.error('Download error:', error);
        return { 
            success: false, 
            message: error.message, 
            url: url 
        };
    }
};

// Export functions
export { exportAttendanceToExcel, downloadFile };
export default downloadFile;
