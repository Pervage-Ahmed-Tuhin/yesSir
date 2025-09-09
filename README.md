# Yes Sir - Attendance Management App

A React Native app built with Expo for managing student and teacher attendance with Clerk authentication.

## Features

- **Authentication**: Email-based authentication and Google OAuth via Clerk
- **User Types**: Support for both students and teachers
- **Attendance Tracking**: Dashboard for viewing attendance records
- **Modern UI**: Clean, dark-themed interface using TailwindCSS (twrnc)

## Setup Instructions

### Prerequisites

- Node.js (v16 or later)
- Expo CLI (`npm install -g @expo/cli`)
- Clerk account and API keys

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd yes-sir
   npm install
   ```

2. **Configure Clerk Authentication**:
   - Create an account at [Clerk.dev](https://clerk.dev)
   - Create a new application
   - Copy your publishable key
   - Update the `.env` file with your key:
     ```
     EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
     ```

3. **Configure OAuth (Optional - for Google Sign-In)**:
   - In your Clerk dashboard, go to "Social Connections"
   - Enable Google OAuth
   - Configure OAuth redirect URLs in Clerk dashboard

4. **Run the app**:
   ```bash
   npm start
   ```

## Project Structure

```
yes-sir/
├── App.js                 # Main app with navigation and Clerk provider
├── components/
│   ├── Login.js          # Login screen with email & Google auth
│   ├── SignUp.js         # Registration with email verification
│   ├── StudentHome.js    # Student dashboard
│   ├── TeacherHome.js    # Teacher dashboard
│   └── WelcomePage.js    # Welcome/landing screen
├── utils/
│   └── validation.js     # Form validation utilities
└── assets/               # App icons and images
```

## Authentication Flow

1. **Email Registration**: 
   - User enters email, password, and ID
   - Email verification code sent
   - User verifies email to complete registration

2. **Email Login**: 
   - User enters email and password
   - Direct authentication through Clerk

3. **Google OAuth**: 
   - One-click Google authentication
   - Automatic account creation/login

## Key Features

### Authentication
- ✅ Email/password authentication
- ✅ Google OAuth integration
- ✅ Email verification for new accounts
- ✅ Form validation
- ✅ Loading states and error handling
- ✅ Automatic session management

### UI/UX
- ✅ Dark theme throughout the app
- ✅ Responsive design
- ✅ Loading indicators
- ✅ Error alerts
- ✅ User-friendly navigation

### User Management
- ✅ Student/Teacher role selection
- ✅ Profile information display
- ✅ Sign out functionality
- ✅ Persistent authentication state

## Environment Variables

Required environment variables in `.env`:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Dependencies

- **@clerk/clerk-expo**: Authentication
- **@react-navigation**: Navigation
- **twrnc**: TailwindCSS for React Native
- **expo**: React Native framework

## Usage

1. **First Time Setup**: Create an account using email or Google
2. **Login**: Use email/password or Google to sign in
3. **Dashboard**: View attendance information based on user type
4. **Sign Out**: Use the sign out button in the dashboard

## Notes

- The app automatically handles authentication state changes
- User data is securely managed by Clerk
- Google OAuth requires proper configuration in Clerk dashboard
- The app supports both development and production environments
