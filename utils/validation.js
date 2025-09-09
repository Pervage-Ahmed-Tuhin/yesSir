// Validation utilities for the app

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateUsername = (username) => {
    // Username should be at least 3 characters and contain only alphanumeric characters and underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    return usernameRegex.test(username);
};

export const validatePassword = (password) => {
    // Password should be at least 6 characters
    return password && password.length >= 6;
};

export const validateClassCode = (classCode) => {
    // Class code should be 6 characters, alphanumeric
    const classCodeRegex = /^[A-Z0-9]{6}$/;
    return classCodeRegex.test(classCode);
};

export const validateCourseName = (courseName) => {
    // Course name should be at least 2 characters
    return courseName && courseName.trim().length >= 2;
};

export const validateDepartment = (department) => {
    // Department should be at least 2 characters
    return department && department.trim().length >= 2;
};

export const getValidationError = (type, value) => {
    switch (type) {
        case 'username':
            if (!value || value.trim().length === 0) {
                return 'Username is required';
            }
            if (!validateUsername(value)) {
                return 'Username must be at least 3 characters and contain only letters, numbers, and underscores';
            }
            return null;
            
        case 'email':
            if (!value || value.trim().length === 0) {
                return 'Email is required';
            }
            if (!validateEmail(value)) {
                return 'Please enter a valid email address';
            }
            return null;
            
        case 'password':
            if (!value || value.trim().length === 0) {
                return 'Password is required';
            }
            if (!validatePassword(value)) {
                return 'Password must be at least 6 characters long';
            }
            return null;
            
        case 'classCode':
            if (!value || value.trim().length === 0) {
                return 'Class code is required';
            }
            if (!validateClassCode(value)) {
                return 'Class code must be 6 characters (letters and numbers only)';
            }
            return null;
            
        case 'courseName':
            if (!value || value.trim().length === 0) {
                return 'Course name is required';
            }
            if (!validateCourseName(value)) {
                return 'Course name must be at least 2 characters long';
            }
            return null;
            
        case 'department':
            if (!value || value.trim().length === 0) {
                return 'Department is required';
            }
            if (!validateDepartment(value)) {
                return 'Department must be at least 2 characters long';
            }
            return null;
            
        default:
            return null;
    }
};
