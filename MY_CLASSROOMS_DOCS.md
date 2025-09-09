# My Classrooms Documentation

## Overview
This document explains how the "My Classrooms" functionality works for teachers in the Yes Sir application.

## Components Involved

### 1. MyClassrooms.js
- **Location**: `components/MyClassrooms.js`
- **Purpose**: Displays list of classrooms created by the teacher
- **Key Features**:
  - Classroom list display
  - Start attendance functionality
  - Automatic refresh on focus
  - Loading states

### 2. API Integration
- **Endpoint**: `GET /api/classrooms/teacher/:teacherClerkId`
- **Function**: `getTeacherClassrooms()` in `utils/api.js`

## Data Flow

1. **Component Mount**:
   - Calls `loadClassrooms()`
   - Gets teacher's Clerk user ID (`user.id`)

2. **API Call**:
   ```javascript
   const teacherClerkId = user?.id; // Clerk user ID
   const response = await getTeacherClassrooms(teacherClerkId);
   ```

3. **Backend Query**:
   ```javascript
   const classrooms = await Classroom.find({ 
     createdBy: teacherClerkId,  // Matches Clerk user ID
     isActive: true 
   }).sort({ createdAt: -1 });
   ```

4. **Display**:
   - Shows classroom cards
   - Each card has "Start Attendance" button

## Important Implementation Details

### Key Fix - Parameter Mismatch
**Problem**: Originally used `user?.unsafeMetadata?.teacherId` (e.g., "095")
**Solution**: Now uses `user?.id` (Clerk user ID like "user_32S7q3...")

This ensures the query matches how classrooms are created:
- **Creation**: `createdBy: user.id` (Clerk ID)
- **Retrieval**: Search by `createdBy: user.id` (Clerk ID)

### Refresh Mechanism
- **Auto-refresh**: When screen comes into focus
- **Manual refresh**: When returning from CreateClassroom
- **Parameter-based**: `route.params?.refresh`

## Component Structure

```javascript
const MyClassrooms = ({ navigation, route }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  // Load classrooms on mount
  useEffect(() => {
    loadClassrooms();
  }, []);

  // Refresh when screen gains focus or refresh param is set
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.refresh) {
        loadClassrooms();
        navigation.setParams({ refresh: false });
      }
    }, [route.params?.refresh])
  );
};
```

## Classroom Card Display

Each classroom shows:
- **Course Name**: Primary display text
- **Start Attendance Button**: Navigates to StartAttendance screen

```javascript
const renderClassroomItem = ({ item }) => (
  <View style={classroomCardStyle}>
    <Text>{item.courseName}</Text>
    <TouchableOpacity onPress={() => handleStartAttendance(item)}>
      <Text>Start Attendance</Text>
    </TouchableOpacity>
  </View>
);
```

## Navigation Flow

1. **MyClassrooms** → **StartAttendance**
   - Passes classroom object as route param
   - `navigation.navigate('StartAttendance', { classroom })`

2. **CreateClassroom** → **MyClassrooms**
   - Returns with refresh parameter
   - `navigation.navigate('MyClassrooms', { refresh: true })`

## Error Handling

### Common Issues:

1. **Empty List**:
   - Check if user is properly authenticated
   - Verify Clerk user ID is available
   - Ensure classrooms were created with correct `createdBy` field

2. **Loading State**:
   - Shows ActivityIndicator while fetching
   - Handles both loading and error states

3. **API Errors**:
   - Network connectivity issues
   - Server not running
   - Invalid API endpoints

## Testing

### Manual Testing:
1. Create a classroom as teacher
2. Navigate to "My Classrooms"
3. Verify classroom appears in list
4. Test "Start Attendance" functionality

### Test Data Query:
```javascript
// Check classrooms for specific teacher
db.classrooms.find({ 
  createdBy: "user_32S7q3vQylEip0i4NnkQCSxlycf",
  isActive: true 
});
```

## Troubleshooting

### Issue: No classrooms showing
- **Check**: User authentication status
- **Check**: Clerk user ID availability (`user.id`)
- **Check**: Database has classrooms with matching `createdBy`
- **Solution**: Ensure parameter consistency between creation and retrieval

### Issue: Stale data
- **Check**: Refresh mechanism working
- **Solution**: Force refresh with `route.params.refresh = true`

### Issue: API errors
- **Check**: Server running on correct port
- **Check**: Network connectivity
- **Check**: API endpoint format: `/teacher/${clerkUserId}`
