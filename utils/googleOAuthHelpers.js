// Utility functions for handling Google OAuth username generation
import { Alert } from 'react-native';

/**
 * Generates a unique username from Google account information
 * @param {Object} signUpObject - The Clerk signUp object from OAuth
 * @returns {string} - Generated username
 */
export const generateUsernameFromGoogle = (signUpObject) => {
    try {
        console.log('=== GENERATING USERNAME ===');
        console.log('SignUp object type:', typeof signUpObject);
        console.log('SignUp object keys:', Object.keys(signUpObject || {}));
        
        // Try to get email from different possible locations
        let email = signUpObject.emailAddress || 
                   signUpObject.emailAddresses?.[0]?.emailAddress ||
                   signUpObject.primaryEmailAddress?.emailAddress ||
                   'user';

        console.log('Generating username from email:', email);
        console.log('Email type:', typeof email);

        // Extract the local part of the email (before @)
        const localPart = String(email).split('@')[0];
        console.log('Local part extracted:', localPart);
        
        // Clean the username: keep only letters, numbers, hyphens, and underscores
        const cleanUsername = localPart
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '') // Keep alphanumeric, underscores, and hyphens only
            .substring(0, 15); // Limit length

        console.log('Clean username:', cleanUsername);

        // Ensure username starts with a letter or number (not underscore or hyphen)
        const sanitizedUsername = cleanUsername.replace(/^[_-]+/, '');
        console.log('Sanitized username:', sanitizedUsername);
        
        // If username is empty after cleaning, use a fallback
        const baseUsername = sanitizedUsername || 'user';
        console.log('Base username:', baseUsername);

        // Ensure minimum length and valid format
        const validBaseUsername = baseUsername.length > 0 ? baseUsername : 'user';

        // Add random suffix to ensure uniqueness
        const randomSuffix = Math.floor(Math.random() * 9999);
        const finalUsername = `${validBaseUsername}${randomSuffix}`;

        // Final validation - ensure it meets Clerk requirements
        if (!/^[a-zA-Z0-9_-]+$/.test(finalUsername)) {
            console.warn('Generated username failed validation, using fallback');
            const fallbackUsername = `user${Math.floor(Math.random() * 99999)}`;
            console.log('Fallback username:', fallbackUsername);
            return fallbackUsername;
        }

        console.log('Final generated username:', finalUsername);
        console.log('Final username type:', typeof finalUsername);
        console.log('=== USERNAME GENERATION COMPLETE ===');
        
        return finalUsername;

    } catch (error) {
        console.error('=== ERROR GENERATING USERNAME ===');
        console.error('Error generating username:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Fallback to completely random username
        const randomUsername = `user${Math.floor(Math.random() * 99999)}`;
        console.log('Using fallback username:', randomUsername);
        console.log('=== FALLBACK USERNAME GENERATED ===');
        return randomUsername;
    }
};

/**
 * Handles completing a Google OAuth signup that's missing username
 * @param {Object} signUp - The Clerk signUp object
 * @param {Function} setActive - The Clerk setActive function
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const completeGoogleSignupWithUsername = async (signUp, setActive) => {
    try {
        console.log('Attempting to complete Google signup with missing username...');
        console.log('SignUp object status:', signUp.status);
        console.log('Missing fields:', signUp.missingFields);

        // Generate username
        const username = generateUsernameFromGoogle(signUp);
        
        console.log('Completing Google signup with username:', username);
        console.log('Username type:', typeof username);
        console.log('Username length:', username?.length);

        console.log('Updating signup with username:', username);

        // Update the signup with the generated username
        const updateResult = await signUp.update({
            username: username
        });

        console.log('Update result:', {
            status: updateResult.status,
            id: updateResult.id,
            createdSessionId: updateResult.createdSessionId
        });

        if (updateResult.status === 'complete') {
            console.log('SignUp completed successfully!');
            
            if (updateResult.createdSessionId) {
                await setActive({ session: updateResult.createdSessionId });
                console.log('Session activated successfully');
                return true;
            } else {
                console.error('No session ID in completed signup');
                Alert.alert('Error', 'Account created but sign-in failed. Please try logging in.');
                return false;
            }
        } else {
            console.log('SignUp still incomplete after username update:', updateResult.status);
            console.log('Still missing fields:', updateResult.missingFields);
            Alert.alert('Setup Incomplete', 'Additional account setup may be required.');
            return false;
        }

    } catch (error) {
        console.error('Error completing Google signup:', error);
        console.error('Error message:', error.message);
        
        // Check if username already exists
        if (error.errors && error.errors.some(e => e.code === 'form_identifier_exists')) {
            console.log('Username exists, trying with different suffix...');
            
            // Try again with a different username
            try {
                const newUsername = generateUsernameFromGoogle(signUp);
                const retryResult = await signUp.update({ username: newUsername });
                
                if (retryResult.status === 'complete' && retryResult.createdSessionId) {
                    await setActive({ session: retryResult.createdSessionId });
                    return true;
                }
            } catch (retryError) {
                console.error('Retry also failed:', retryError);
            }
        }

        Alert.alert('Setup Error', 'Failed to complete your Google account setup. Please try again.');
        return false;
    }
};
