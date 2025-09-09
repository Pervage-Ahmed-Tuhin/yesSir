# OAuth Troubleshooting Guide

## Overview
This document provides troubleshooting steps for OAuth authentication issues in the Yes Sir application.

## Common OAuth Issues

### 1. Google OAuth Flow Errors

#### Error: "Cannot read property 'origin'"
**Cause**: Known Clerk.js issue with React Native
**Solution**: 
- Ignore this error - authentication usually still works
- Handle gracefully in code:
```javascript
catch (error) {
  if (error.message && error.message.includes("Cannot read property 'origin'")) {
    console.log('Signout completed despite Clerk origin error');
    return;
  }
  // Handle other errors normally
}
```

#### Error: "OAuth flow was cancelled"
**Cause**: User closed OAuth popup/browser
**Solution**: Allow user to retry, no special handling needed

#### Error: "Network request failed"
**Cause**: Network connectivity issues
**Solution**: 
- Check internet connection
- Retry after network is restored
- Show appropriate error message

### 2. Session Management Issues

#### Error: "Session already exists"
**Cause**: Multiple active sessions in Clerk
**Solution**: Clear existing session before new login
```javascript
const handleSessionConflict = async () => {
  try {
    await signOut();
    console.log('Existing session cleared');
    return true;
  } catch (err) {
    console.error('Error clearing existing session:', err);
    return false;
  }
};
```

#### Error: "Session not found"
**Cause**: Session expired or cleared externally
**Solution**: Redirect user to login screen

### 3. Username Issues

#### Error: "Username already taken"
**Cause**: Attempted username conflicts with existing user
**Solution**: 
- Prompt user to choose different username
- Suggest alternatives
- Validate username availability before submission

#### Error: "Username required"
**Cause**: OAuth flow completed but username not set
**Solution**: Prompt user to complete profile with username

### 4. Profile Completion Issues

#### Error: "Profile incomplete"
**Cause**: Required metadata missing after OAuth
**Solution**: Guide user through profile completion flow

```javascript
const completeProfile = async (additionalData) => {
  try {
    await user.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Profile completion error:', error);
  }
};
```

## OAuth Configuration

### Required Clerk Settings:
1. **OAuth Providers**: Google enabled
2. **Redirect URLs**: Properly configured for mobile
3. **Session Settings**: Allow multiple sessions disabled
4. **Username**: Required field enabled

### Environment Variables:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Testing OAuth Flow

### Manual Testing Steps:
1. Clear app data/cache
2. Start fresh login flow
3. Test Google OAuth
4. Verify session creation
5. Test navigation after login
6. Test logout functionality

### Debug Logging:
```javascript
// Add to OAuth flow
console.log('=== OAUTH DEBUG ===');
console.log('User object:', user);
console.log('Session ID:', session?.id);
console.log('Auth state:', isSignedIn);
```

## Error Handling Best Practices

### 1. User-Friendly Messages
```javascript
const getErrorMessage = (error) => {
  if (error.code === 'session_exists') {
    return 'Clearing existing session and retrying...';
  } else if (error.code === 'form_identifier_not_found') {
    return 'Account not found. Please check your email or sign up.';
  } else if (error.code === 'form_password_incorrect') {
    return 'Incorrect password. Please try again.';
  }
  return 'An error occurred. Please try again.';
};
```

### 2. Retry Logic
```javascript
const retryWithBackoff = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. Loading States
```javascript
const [isLoading, setIsLoading] = useState(false);

const handleLogin = async () => {
  setIsLoading(true);
  try {
    // Login logic
  } catch (error) {
    // Error handling
  } finally {
    setIsLoading(false);
  }
};
```

## Platform-Specific Issues

### iOS:
- Deep linking configuration
- URL scheme registration
- Keychain access permissions

### Android:
- Intent filter setup
- Custom URL scheme handling
- Network security configuration

### Web:
- CORS configuration
- Redirect URL handling
- Browser compatibility

## Recovery Procedures

### Complete Session Reset:
1. Clear AsyncStorage
2. Clear Clerk session
3. Restart app
4. Fresh login

### Cache Clearing:
1. Clear Expo cache: `expo r -c`
2. Clear Metro cache: `npx react-native start --reset-cache`
3. Clear device storage

### Debug Mode:
Enable detailed logging in development:
```javascript
if (__DEV__) {
  console.log('OAuth Debug Mode Enabled');
  // Additional debug logging
}
```

## Support Resources

### Clerk Documentation:
- OAuth Guide: https://clerk.com/docs/authentication/social-connections
- React Native Integration: https://clerk.com/docs/quickstarts/react-native

### Community Support:
- Clerk Discord
- Stack Overflow with 'clerk' tag
- GitHub Issues for specific bugs
