// API base URL - using IP address for React Native connectivity
const API_BASE_URL = 'http://192.168.0.220:5000/api';

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('Making API call to:', url);
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        console.log('API call config:', {
            method: config.method || 'GET',
            url: url,
            hasBody: !!config.body
        });

        const response = await fetch(url, config);
        const data = await response.json();
        
        console.log('API response:', { 
            status: response.status, 
            success: response.ok,
            data: data 
        });

        if (!response.ok) {
            console.error('API call failed:', {
                status: response.status,
                statusText: response.statusText,
                errorMessage: data.message,
                fullError: data
            });
            throw new Error(data.message || `API call failed with status ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call error details:', {
            endpoint,
            error: error.message,
            stack: error.stack,
            networkError: error.code || 'Unknown'
        });
        
        // Add more specific error messages for common network issues
        if (error.message.includes('Network request failed') || 
            error.message.includes('fetch')) {
            throw new Error(`Network error: Unable to connect to server at ${API_BASE_URL}. Please check your internet connection.`);
        }
        
        throw error;
    }
};

// User registration functions
export const registerStudent = async (userData) => {
    console.log('Registering student with data:', userData);
    try {
        const result = await apiCall('/auth/register/student', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        console.log('Student registration successful:', result);
        return result;
    } catch (error) {
        console.error('Student registration failed:', error.message);
        throw error;
    }
};

export const registerTeacher = async (userData) => {
    console.log('Registering teacher with data:', userData);
    try {
        const result = await apiCall('/auth/register/teacher', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        console.log('Teacher registration successful:', result);
        return result;
    } catch (error) {
        console.error('Teacher registration failed:', error.message);
        throw error;
    }
};

// User profile functions
export const getUserProfile = async (clerkUserId) => {
    return await apiCall(`/auth/profile/${clerkUserId}`, {
        method: 'GET',
    });
};

export const updateUserProfile = async (clerkUserId, updateData) => {
    return await apiCall(`/auth/profile/${clerkUserId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
};

// Helper function to register user based on metadata
export const registerUserFromClerk = async (user, metadata) => {
    console.log('=== STARTING DATABASE REGISTRATION ===');
    console.log('User ID:', user.id);
    console.log('User metadata:', metadata);
    console.log('User email addresses:', user.emailAddresses);
    console.log('User name parts:', { firstName: user.firstName, lastName: user.lastName, username: user.username });

    const userData = {
        clerkUserId: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        email: user.emailAddresses[0]?.emailAddress,
    };

    console.log('Prepared base user data:', userData);

    if (metadata.userType === 'Student') {
        const studentData = {
            ...userData,
            studentId: metadata.studentId,
            department: metadata.department,
            batch: metadata.batch,
            section: metadata.section,
        };
        console.log('Registering as student with data:', studentData);
        
        try {
            const result = await registerStudent(studentData);
            console.log('Student registration completed successfully');
            return result;
        } catch (error) {
            console.error('Student registration failed in registerUserFromClerk:', error);
            throw error;
        }
    } else if (metadata.userType === 'Teacher') {
        const teacherData = {
            ...userData,
            teacherId: metadata.teacherId,
            department: metadata.department,
        };
        console.log('Registering as teacher with data:', teacherData);
        
        try {
            const result = await registerTeacher(teacherData);
            console.log('Teacher registration completed successfully');
            return result;
        } catch (error) {
            console.error('Teacher registration failed in registerUserFromClerk:', error);
            throw error;
        }
    } else {
        const errorMsg = `Invalid user type: ${metadata.userType}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
};

// Classroom functions
export const createClassroom = async (classroomData) => {
    return await apiCall('/classrooms/create', {
        method: 'POST',
        body: JSON.stringify(classroomData),
    });
};

export const getTeacherClassrooms = async (teacherId) => {
    return await apiCall(`/classrooms/teacher/${teacherId}`);
};

export const getClassroomByCode = async (classCode) => {
    return await apiCall(`/classrooms/code/${classCode}`);
};

export const joinClassroom = async (joinData) => {
    return await apiCall('/classrooms/join', {
        method: 'POST',
        body: JSON.stringify(joinData),
    });
};

// Attendance functions
export const startAttendanceSession = async (classroomId) => {
    return await apiCall(`/attendance/start-session/${classroomId}`, {
        method: 'POST',
    });
};

export const stopAttendanceSession = async (classroomId) => {
    return await apiCall(`/attendance/stop-session/${classroomId}`, {
        method: 'POST',
    });
};

export const getAttendanceStatus = async (classroomId) => {
    return await apiCall(`/attendance/session-status/${classroomId}`);
};

export const submitAttendance = async (classroomId, formData) => {
    // For FormData, we need to handle the request differently
    try {
        const url = `${API_BASE_URL}/attendance/submit/${classroomId}`;
        const response = await fetch(url, {
            method: 'POST',
            body: formData, // Don't set Content-Type header for FormData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Attendance submission failed');
        }

        return data;
    } catch (error) {
        console.error('Submit attendance error:', error);
        throw error;
    }
};

export const getAttendanceList = async (classroomId, date = null) => {
    const queryParam = date ? `?date=${date}` : '';
    return await apiCall(`/attendance/list/${classroomId}${queryParam}`);
};

export const generateExcelReport = async (classroomId, date = null) => {
    try {
        const url = `${API_BASE_URL}/attendance/generate-excel/${classroomId}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date }),
        });

        const data = await response.json();
        console.log('Excel generation response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Excel generation failed');
        }

        return data;
    } catch (error) {
        console.error('Generate Excel error:', error);
        throw error;
    }
};

export const cleanupSessionData = async (classroomId) => {
    try {
        console.log('🧹 Cleaning up session data for classroom:', classroomId);
        const response = await apiCall(`/attendance/cleanup-session/${classroomId}`, {
            method: 'DELETE'
        });
        
        console.log('Cleanup response:', response);
        return response;
    } catch (error) {
        console.error('Cleanup session data error:', error);
        throw error;
    }
};
