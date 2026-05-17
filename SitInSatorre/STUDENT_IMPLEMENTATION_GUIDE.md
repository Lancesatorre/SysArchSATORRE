# Student Features Implementation Guide

## Overview
This document outlines the implemented student-side features for SitInSatorre: Sit-In Summary, Session History, and Reservations System.

---

## Files Created

### Frontend Components (React/JSX)

#### 1. **SitInSummary.jsx**
- **Location**: `src/Student/SitInSummary.jsx`
- **Purpose**: Displays aggregated sit-in statistics on the dashboard
- **Features**:
  - Total Sit-In Hours
  - Number of Sessions
  - Average Session Duration
  - Longest Session
  - Auto-refresh functionality
  - Error handling and loading states
- **Props**: None (fetches own data)
- **Usage in Dashboard**:
```jsx
import SitInSummary from './Student/SitInSummary';

// Inside Dashboard component
<SitInSummary />
```

---

#### 2. **SessionHistory.jsx**
- **Location**: `src/Student/SessionHistory.jsx`
- **Purpose**: Display comprehensive table of all student sessions
- **Features**:
  - Sortable columns (click headers)
  - Multiple filters:
    - Lab filter (dropdown)
    - Date range (from/to)
    - Rows per page selector
  - CSV export
  - Pagination
  - Responsive design
  - Error handling
- **Usage**:
```jsx
import SessionHistory from './Student/SessionHistory';

// Create route in App.jsx
<Route path="/student/sessions" element={<SessionHistory />} />
```

---

#### 3. **Reservations.jsx**
- **Location**: `src/Student/Reservations.jsx`
- **Purpose**: Main reservations page
- **Features**:
  - Quick stats cards (Pending, Approved, Total)
  - Integration with ReservationWizard modal
  - MyReservations component embedding
  - Auto-refresh on successful creation
- **Usage**:
```jsx
import Reservations from './Student/Reservations';

// Create route in App.jsx
<Route path="/student/reservations" element={<Reservations />} />
```

---

#### 4. **ReservationWizard.jsx**
- **Location**: `src/Student/ReservationWizard.jsx`
- **Purpose**: Multi-step modal for creating reservations
- **Steps**:
  1. **Select Lab**: Choose from available labs
  2. **Select Date & Time**: Pick reservation date and time slot
  3. **Select PC**: Choose available PC (with real-time availability check)
  4. **Confirm**: Review and submit reservation
- **Features**:
  - Progress bar with step indicators
  - Validation at each step
  - Real-time PC availability checking
  - Error handling
  - Loading states
- **Props**:
  - `onClose`: Callback when wizard closes
  - `onSuccess`: Callback when reservation created
- **Usage**:
```jsx
// Automatically used by Reservations.jsx
// Can also be used independently:
import ReservationWizard from './Student/ReservationWizard';

const [showWizard, setShowWizard] = useState(false);

{showWizard && (
  <ReservationWizard
    onClose={() => setShowWizard(false)}
    onSuccess={() => {
      // Handle success
    }}
  />
)}
```

---

#### 5. **MyReservations.jsx**
- **Location**: `src/Student/MyReservations.jsx`
- **Purpose**: Display and manage student's reservations
- **Features**:
  - Grouped by status (Pending, Approved, History)
  - Color-coded status badges
  - Delete functionality for pending reservations
  - Decline reason display
  - Confirmation modal before deletion
  - Empty state messaging
- **Props**:
  - `reservations`: Array of reservation objects
  - `loading`: Boolean loading state
  - `onReservationDeleted`: Callback after successful deletion
- **Usage**:
```jsx
// Automatically used by Reservations.jsx
// Can also be used independently:
import MyReservations from './Student/MyReservations';

<MyReservations
  reservations={reservations}
  loading={loading}
  onReservationDeleted={handleRefresh}
/>
```

---

## Backend Files (PHP)

### Database Requirements

Before using the backend files, ensure your database has the following tables:

```sql
-- Sessions table (should already exist)
CREATE TABLE sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  lab_id INT NOT NULL,
  pc_number VARCHAR(10) NOT NULL,
  session_date DATE NOT NULL,
  time_in DATETIME NOT NULL,
  time_out DATETIME,
  status ENUM('in_progress', 'completed', 'incomplete') DEFAULT 'in_progress',
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (lab_id) REFERENCES labs(id)
);

-- Labs table (should already exist)
CREATE TABLE labs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lab_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active'
);

-- PCs table (if not exists)
CREATE TABLE pcs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lab_id INT NOT NULL,
  pc_number VARCHAR(10) NOT NULL,
  status ENUM('available', 'maintenance', 'disabled') DEFAULT 'available',
  FOREIGN KEY (lab_id) REFERENCES labs(id)
);

-- Reservations table (NEW - must be created)
CREATE TABLE reservations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  pc_id INT NOT NULL,
  lab_id INT NOT NULL,
  pc_number VARCHAR(10) NOT NULL,
  reservation_date DATE NOT NULL,
  time_from TIME NOT NULL,
  time_to TIME NOT NULL,
  status ENUM('pending', 'approved', 'declined', 'completed', 'cancelled') DEFAULT 'pending',
  decline_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (pc_id) REFERENCES pcs(id),
  FOREIGN KEY (lab_id) REFERENCES labs(id),
  INDEX (student_id),
  INDEX (reservation_date),
  INDEX (status)
);
```

### API Endpoints

#### 1. **getStudentSitInSummary.php**
- **Method**: GET
- **URL**: `/server/actions/getStudentSitInSummary.php`
- **Authentication**: Required (checks `$_SESSION['student_id']`)
- **Response**:
```json
{
  "success": true,
  "data": {
    "total_hours": 125.5,
    "session_count": 42,
    "average_duration": 2.98,
    "longest_session": 6.75
  }
}
```

---

#### 2. **getStudentSessions.php**
- **Method**: GET
- **URL**: `/server/actions/getStudentSessions.php`
- **Parameters**:
  - `lab_id` (optional): Filter by lab
  - `start_date` (optional): Filter from date
  - `end_date` (optional): Filter to date
  - `page` (default: 1): Page number for pagination
  - `per_page` (default: 10): Records per page
  - `sort_by` (default: 'session_date'): Column to sort by
  - `sort_order` (default: 'DESC'): ASC or DESC
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": 1,
        "session_date": "2024-01-20",
        "time_in": "08:30:15",
        "time_out": "11:45:42",
        "duration_minutes": 195,
        "pc_number": "A-05",
        "lab_name": "Lab A",
        "status": "completed"
      }
    ],
    "total_count": 127
  }
}
```

---

#### 3. **getLabs.php**
- **Method**: GET
- **URL**: `/server/actions/getLabs.php`
- **Parameters**: None
- **Authentication**: Not required
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lab_name": "Lab A",
      "location": "Ground Floor"
    },
    {
      "id": 2,
      "lab_name": "Lab B",
      "location": "First Floor"
    }
  ]
}
```

---

#### 4. **getLabAvailability.php**
- **Method**: GET
- **URL**: `/server/actions/getLabAvailability.php`
- **Parameters**:
  - `date` (optional): Check availability for specific date (YYYY-MM-DD)
- **Authentication**: Not required
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lab_name": "Lab A",
      "location": "Ground Floor",
      "total_pcs": 15,
      "available_pcs": 12
    }
  ]
}
```

---

#### 5. **getPCAvailability.php**
- **Method**: GET
- **URL**: `/server/actions/getPCAvailability.php`
- **Required Parameters**:
  - `lab_id`: Lab ID
  - `date`: Date (YYYY-MM-DD)
  - `time_slot`: Slot ID (slot1, slot2, slot3)
- **Authentication**: Not required
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pc_number": "A-01",
      "available": true
    },
    {
      "id": 2,
      "pc_number": "A-02",
      "available": false
    }
  ]
}
```

---

#### 6. **createReservation.php**
- **Method**: POST
- **URL**: `/server/actions/createReservation.php`
- **Content-Type**: application/json
- **Authentication**: Required
- **Request Body**:
```json
{
  "lab_id": 1,
  "pc_number": "A-02",
  "reservation_date": "2024-02-15",
  "time_slot": "slot1"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "reservation_id": 123
}
```
- **Errors**:
  - Missing required fields
  - Cannot reserve for past dates
  - PC not found or unavailable
  - PC already reserved for that time

---

#### 7. **getStudentReservations.php**
- **Method**: GET
- **URL**: `/server/actions/getStudentReservations.php`
- **Parameters**: None
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 10,
      "pc_id": 5,
      "lab_id": 1,
      "pc_number": "A-02",
      "lab_name": "Lab A",
      "reservation_date": "2024-02-15",
      "time_from": "09:00:00",
      "time_to": "13:00:00",
      "status": "pending",
      "decline_reason": null,
      "created_at": "2024-02-14 15:30:00",
      "approved_at": null
    }
  ]
}
```

---

#### 8. **deleteReservation.php**
- **Method**: DELETE
- **URL**: `/server/actions/deleteReservation.php`
- **Content-Type**: application/json
- **Authentication**: Required
- **Request Body**:
```json
{
  "reservation_id": 1
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Reservation deleted successfully"
}
```
- **Errors**:
  - Reservation not found
  - Can only delete pending reservations
  - Unauthorized access

---

## Integration Steps

### 1. Add Routes to App.jsx
```jsx
import SitInSummary from './Student/SitInSummary';
import SessionHistory from './Student/SessionHistory';
import Reservations from './Student/Reservations';

// Inside BrowserRouter
<Routes>
  {/* ... existing routes ... */}
  
  {/* Student routes */}
  <Route path="/student/dashboard" element={<StudentDashboard />} />
  <Route path="/student/sessions" element={<SessionHistory />} />
  <Route path="/student/reservations" element={<Reservations />} />
</Routes>
```

### 2. Add to StudentDashboard.jsx
```jsx
import SitInSummary from './SitInSummary';

export default function StudentDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Welcome, {studentName}!</h1>
      
      {/* Sit-In Summary Widget */}
      <SitInSummary />
      
      {/* ... rest of dashboard ... */}
    </div>
  );
}
```

### 3. Add Navigation Links
Update your Navbar or Navigation component to include links:
```jsx
<Link to="/student/sessions" className="nav-link">My Sessions</Link>
<Link to="/student/reservations" className="nav-link">Reservations</Link>
```

### 4. Database Setup
1. Create all required tables (see Database Requirements section)
2. Ensure labs are created in the labs table
3. Ensure PCs are created in the pcs table
4. Create the reservations table

### 5. Session Management
All features require `$_SESSION['student_id']` to be set. Ensure:
- User authentication sets `$_SESSION['student_id']` on login
- Session is properly initialized in each PHP file with `session_start()`

---

## Time Slots Configuration

The current system uses three predefined time slots:

```javascript
const timeSlots = [
  { 
    id: 'slot1', 
    label: '9:00 AM - 1:00 PM', 
    start: '09:00', 
    end: '13:00' 
  },
  { 
    id: 'slot2', 
    label: '1:00 PM - 5:00 PM', 
    start: '13:00', 
    end: '17:00' 
  },
  { 
    id: 'slot3', 
    label: '9:00 AM - 5:00 PM', 
    start: '09:00', 
    end: '17:00' 
  }
];
```

To customize:
1. Edit `ReservationWizard.jsx` - Update `fetchTimeSlots()` function
2. Edit `getPCAvailability.php` - Update `$time_slots` array
3. Edit `createReservation.php` - Update `$time_slots` array

---

## Icons Used

All icons are from the `lucide-react` library (minimal, clean design):

| Component | Icons |
|-----------|-------|
| SitInSummary | Clock, BarChart3, Zap, Award |
| SessionHistory | Download, ChevronUp, ChevronDown |
| Reservations | Calendar, Plus, Trash2, Clock, MapPin |
| ReservationWizard | X, ChevronRight, ChevronLeft, Check |
| MyReservations | Trash2, AlertCircle |

Ensure `lucide-react` is installed:
```bash
npm install lucide-react
```

---

## Error Handling

All components include:
- Loading states with spinners
- Error messages with retry buttons
- Input validation
- Database error handling
- Unauthorized access handling (401)
- Server error handling (500)

---

## Performance Considerations

1. **Pagination**: Session table uses pagination (default 10 records)
2. **Filtering**: Filters are applied on the backend to reduce data transfer
3. **Sorting**: Server-side sorting for better performance
4. **Caching**: Consider caching lab data (rarely changes)
5. **Debouncing**: Frontend sort/filter operations use efficient queries

---

## Security Measures

1. **Session Check**: All sensitive endpoints verify `$_SESSION['student_id']`
2. **Prepared Statements**: All SQL queries use parameterized statements
3. **Input Validation**: All inputs are validated before database operations
4. **Ownership Verification**: Students can only access their own data
5. **Reservation Constraints**: Only pending reservations can be deleted

---

## Testing

### Manual Testing Checklist

- [ ] Load SitInSummary and verify stats display
- [ ] Filter sessions by lab
- [ ] Filter sessions by date range
- [ ] Sort sessions by each column
- [ ] Export sessions to CSV
- [ ] View lab availability
- [ ] Create a reservation (all 4 steps)
- [ ] Verify PC availability updates in real-time
- [ ] View pending reservations
- [ ] Delete a pending reservation
- [ ] Verify deleted reservation is removed
- [ ] View approved reservations
- [ ] View reservation history

---

## Future Enhancements

1. **Dark Mode**: Add dark theme toggle
2. **Analytics**: Add charts for sit-in trends
3. **Notifications**: Email/SMS on reservation approval
4. **Recurring Reservations**: Allow weekly recurring bookings
5. **Waitlist**: If lab is full, join a waitlist
6. **Calendar View**: Show reservations in calendar format
7. **Admin Panel**: Auto-approval for trusted students
8. **Integration**: Sync with academic calendar

---

## Support & Debugging

### Common Issues

**Issue**: "Unauthorized" error on page load
- **Solution**: Ensure user is logged in and `$_SESSION['student_id']` is set

**Issue**: No sessions/reservations showing
- **Solution**: Check database has data; verify SQL queries with test data

**Issue**: PC availability not updating
- **Solution**: Refresh page; check time slot is correct

**Issue**: Cannot delete reservation
- **Solution**: Only pending reservations can be deleted (not approved/declined)

### Debug Mode

To enable debug logging in PHP files, add:
```php
error_log("Debug: " . json_encode($variable), 0);
```

Check PHP error log in `/var/log/php-errors.log`

---

## Deployment Checklist

- [ ] Database tables created
- [ ] PCs and labs populated
- [ ] Session management configured
- [ ] Routes added to App.jsx
- [ ] Components integrated into navigation
- [ ] Database credentials configured
- [ ] Error logging enabled
- [ ] User authentication working
- [ ] HTTPS enabled (if in production)
- [ ] Backups scheduled
- [ ] Test all features in production environment

