# SitInSatorre Features Overview

## Project Overview
SitInSatorre is a lab sit-in management system that tracks student attendance in computer labs, manages software availability, and provides administrators with comprehensive session and reservation management tools.

---

## Table of Contents
1. [Student Features](#student-features)
2. [Admin Features](#admin-features)
3. [System-wide Features](#system-wide-features)

---

# Student Features

## 1. Software Availability / Lab
**Status**: Not Started  
**Page Location**: `/student/software-availability`

### Description
Display available software in each lab based on what the admin has uploaded in the Software Management app.

### Key Features
- View list of all labs
- Select a lab to view available software
- Software details include:
  - Software name
  - Version
  - Category (IDE, Database, Tools, etc.)
  - Availability status
  - Installation date

### Technical Requirements
- Fetch software data from `server/actions/` endpoint
- Display in grid/card layout
- Search and filter by software name or category
- Responsive design for mobile and desktop

### UI Components
- Lab selector/dropdown
- Software cards with details
- Filter/Search functionality
- Loading states

---

## 2. User Sit-In Summary
**Status**: Not Started  
**Location**: Student Dashboard (existing component)

### Description
Display aggregated sit-in statistics on the student dashboard showing overall lab usage metrics.

### Key Metrics
- **Total Sit-In Hours**: Sum of all session durations
- **Number of Sessions**: Total count of completed sessions
- **Average Session Duration**: Total hours / Number of sessions
- **Longest Session**: Maximum duration in a single session

### Display Format
- Visual cards with large, readable numbers
- Icons for each metric
- Optional: Trend indicators (up/down arrows)
- Date range selector (This month, This semester, All time)

### Data Source
- Query from `studentProfileStats.php` or create new endpoint
- Calculate from session records in database

### UI Components
- Summary cards (4 columns)
- Date range selector
- Optional: Mini charts/graphs showing trends

---

## 3. Session Table
**Status**: Not Started  
**Page Location**: `/student/sessions` or `/student/session-history`

### Description
Comprehensive table showing all sessions with detailed timing and lab information.

### Columns
| Column | Description | Data Type |
|--------|-------------|-----------|
| Date | Session date | Date |
| Time-In | Check-in time | Time (HH:MM) |
| Time-Out | Check-out time | Time (HH:MM) |
| Duration | Session length | Duration (HH:MM) |
| PC No. | Computer number in lab | Text |
| Status | Session status (Completed, In Progress, etc.) | Status Badge |

### Features
- Sortable columns (click header to sort)
- Filter by date range
- Filter by lab
- Search by PC number
- Export to CSV
- Pagination (10, 25, 50 rows per page)
- Show more details option (click row to expand)

### Technical Requirements
- Data from `StudentHistory.jsx` component
- API endpoint to fetch sessions from database
- Implement sorting and filtering logic
- Responsive table design

### UI Components
- Data table with striped rows
- Column header with sort indicators
- Filter panel
- Export button
- Pagination controls

---

## 4. Reservation System
**Status**: Not Started  
**Page Location**: `/student/reservations`

### Description
Allow students to view available labs and PCs for reservation, and manage their pending reservations.

### Features

#### View Available Slots
- Display all labs with availability status
- For each lab, show available PCs
- Time slot availability (AM/PM or specific hours)
- Color-coded availability (Available/Not Available)
- Filter by lab or date range

#### Make Reservation
- Select lab → Select PC → Select date/time
- Submit reservation for admin approval
- Confirmation message with reservation details

#### Manage Reservations
- View all student's reservations
- Filter by status (Pending, Approved, Declined)
- Display reservation details:
  - Lab name
  - PC number
  - Requested date/time
  - Current status
  - Approval date (if approved)

#### Delete Reservation
- Cancel pending reservations (Unapproved only)
- Confirmation dialog before deletion
- Success message after deletion

### Technical Requirements
- Fetch available labs/PCs from admin settings
- Check reservation availability against existing reservations
- Create new reservation record
- Update/Delete reservation records
- Validate time slots and lab availability

### UI Components
- Lab selector with availability cards
- PC grid/list view
- Date/Time picker
- Reservation list with status badges
- Action buttons (View, Delete, Print)
- Confirmation modals

---

## 5. Dark Mode
**Status**: Not Started  
**Applies To**: All student pages

### Description
Implement dark theme/mode toggle for better user experience during night study sessions.

### Implementation Details
- Toggle button in navigation bar or settings
- Persist user preference (localStorage)
- Apply to all pages and components
- Ensure contrast meets accessibility standards (WCAG AA)
- Smooth transitions between themes

### Color Scheme
- Dark background (Charcoal/Dark Gray #1a1a1a or #2d2d2d)
- Light text (#f5f5f5 or #e0e0e0)
- Accent colors (adjusted for dark mode)
- Border colors (subtle, light gray)

### Technical Requirements
- Create CSS variables for theming
- Implement context/state management for theme
- Update tailwind config for dark mode
- Test all components in both themes

### Files to Modify
- `src/App.css` - Add dark mode styles
- `src/Components/LayoutNav.jsx` - Add theme toggle
- `src/index.css` - Global dark mode styles
- Individual component styles

---

# Admin Features

## 1. Generate Reports
**Status**: Not Started  
**Page Location**: `/admin/reports`

### Description
Generate and export comprehensive reports of student sessions and sit-in activities.

### Report Types

#### Session Completion Report
- List all completed sessions
- Include: Student name, Date, Duration, Lab, PC number, Status
- Filters: Date range, Lab, Student
- Sortable columns

#### Student Sit-In Activity Report
- Summary of student activity
- Include: Student name, Total hours, Session count, Avg duration, Last session
- Filters: Date range, Department, Class
- Sortable columns

### Export Formats
- **PDF**: Professional formatted report with header, footer, pagination
- **CSV**: Comma-separated values for spreadsheet analysis
- **Excel (.xlsx)**: Formatted workbook with formulas and charts

### Features
- Date range selector
- Filter options (Lab, Student, Department)
- Preview before export
- Report generation progress indicator
- Download button with selected format

### Technical Requirements
- Create report generation backend
- Integrate PDF library (dompdf or similar)
- Integrate Excel library (PhpSpreadsheet)
- CSV generation from session data
- Query completed sessions from database

### UI Components
- Report type selector (Radio buttons)
- Filter panel
- Preview area
- Export button with format dropdown
- Download history (optional)

---

## 2. View Reservations (Admin Management)
**Status**: Not Started  
**Page Location**: `/admin/reservations`

### Description
Comprehensive reservation management system with three separate sections for lab/PC control, approval queue, and activity logs.

### Section 1: Lab & PC Availability Control

#### Purpose
Enable/disable specific labs, PCs, and time slots for student reservations.

#### Features
- Lab list view (cards or table)
- For each lab:
  - Enable/Disable toggle for entire lab
  - List of PCs with individual toggle
  - Time slot availability (AM/PM or hourly)
  - Edit button to configure time slots
  
#### Time Slot Configuration
- Available time ranges (e.g., 8:00 AM - 5:00 PM)
- Set unavailable periods (maintenance, closed hours)
- Save configuration

#### UI
- Lab cards with PC grid
- Toggle switches for easy on/off
- Collapsible time schedule section
- Save/Cancel buttons

---

### Section 2: Pending Reservations (Approval Queue)

#### Purpose
Review and approve/decline student reservation requests awaiting admin action.

#### Features
- Table of pending reservations with columns:
  - Student name
  - Lab requested
  - PC number
  - Requested date
  - Requested time slot
  - Submission date
  
#### Actions
- **Approve Button**: Accept reservation, notify student
- **Decline Button**: Reject with optional reason
- **View Details Button**: See full reservation information

#### Filters
- Filter by lab
- Filter by date
- Search by student name
- Sort by submission date

#### Notifications
- Confirmation dialog before action
- Success message after action
- Auto-refresh after action

#### UI Components
- Data table with pending reservations
- Filter panel
- Action buttons (Approve/Decline)
- Confirmation modal with optional decline reason input
- Status indicator showing number of pending

---

### Section 3: Reservation Logs & History

#### Purpose
View complete history of all reservation actions (approvals, declines, cancellations) with filtering and search.

#### Features
- Table with columns:
  - Student name
  - Lab
  - PC number
  - Action (Approved/Declined/Cancelled)
  - Action date
  - Approval date (if applicable)
  - Status (Completed/Active/Expired)
  - Reason (for declines)

#### Filters & Search
- Filter by action type (Approved, Declined, Cancelled)
- Filter by status (Active, Completed, Expired)
- Date range filter
- Student name search
- Lab filter

#### Additional Features
- Show "Active Student" indicator (currently sitting in lab)
- Export logs to CSV
- Pagination
- Column sorting

#### UI Components
- Data table with comprehensive columns
- Multi-select filters
- Date range picker
- Search input
- Export button
- Status badges (color-coded)

---

## 3. Analytics Dashboard
**Status**: Not Started  
**Location**: Admin Dashboard (add new cards/section)

### Description
Visual analytics and insights into student lab usage patterns and behaviors.

### Key Analytics & Metrics

#### Usage Analytics
- **Peak Usage Times**: Show hours with highest lab occupancy
- **Lab Utilization Rate**: Percentage of available PCs in use
- **Most Used Lab**: Identify top labs by session count

#### Student Analytics
- **Top Students by Session Duration**: Show students with highest total sit-in hours
- **Most Active Students**: Highest number of sessions
- **Longest Individual Session**: Record longest single session duration
- **Average Session Duration**: System-wide average

#### Temporal Analytics
- **Daily Usage Trend**: Line chart showing daily average sessions
- **Weekly Comparison**: Compare week-over-week usage
- **Busiest Days**: Identify peak days
- **Semester Comparison**: Usage across terms

#### Suggested Insights
- Recommended analytics for implementation:
  1. **Student with Most Hours** (Longest cumulative sit-in)
  2. **Student with Longest Single Session** (Peak focus indicator)
  3. **Lab Efficiency Metric** (Sessions per PC per day)
  4. **Student Engagement Score** (Frequency + Duration + Consistency)

### Visualization Components
- Line charts (trends over time)
- Bar charts (comparisons, rankings)
- Pie charts (distribution)
- Stat cards with KPIs
- Heatmaps (usage by time of day)

### Technical Requirements
- Aggregate data from session records
- Calculate metrics efficiently
- Real-time or periodic updates
- Filter by date range, lab, department

### UI Components
- Stat cards showing key metrics
- Multiple chart types
- Date range selector
- Export chart data option
- Refresh button for real-time updates

---

## 4. Software App - Import/Upload
**Status**: Not Started  
**Page Location**: `/admin/software-management`

### Description
Interface for administrators to upload and manage software details that will be available across labs.

### Features

#### Software Upload
- **Upload Methods**:
  - Single software entry form
  - Bulk upload via CSV/Excel file
  
#### Single Entry Form
- Software name (required)
- Version (required)
- Category (dropdown: IDE, Database, Office, Tools, Development, Other)
- Lab assignment (multi-select labs where available)
- Description/Notes
- Installation date
- License type (Proprietary, Open Source, Educational)
- Status (Active, Inactive, Deprecated)
- Upload icon/logo (optional)

#### Bulk Upload
- CSV template download
- Required columns: Name, Version, Category, Labs, License Type, Description
- Validation before import
- Preview imported records
- Confirm import

#### Software Management
- View all software in table
- Edit existing software entries
- Delete software
- Toggle active/inactive status
- Search by name or category
- Filter by category or lab
- Sort by name, version, or date added

#### Lab Assignment
- Assign software to multiple labs
- Easy toggle assignment for each lab
- View which labs have which software
- Edit assignments in bulk

### Validation
- Software name must be unique
- Version format validation
- At least one lab must be selected
- All required fields must be filled

### Technical Requirements
- Create backend endpoint to handle uploads
- Validate file format and contents
- Parse CSV/Excel files
- Insert software records into database
- Handle duplicate detection
- Create/Update/Delete operations

### Database Fields
- Software ID (Primary Key)
- Name
- Version
- Category
- Description
- Installation Date
- License Type
- Status (Active/Inactive)
- Created Date
- Updated Date
- Logo/Icon path

### UI Components
- Tab navigation (Single Upload / Bulk Upload / Manage)
- Form inputs with validation messages
- File upload area (drag & drop)
- Table with management actions
- Preview modal for bulk import
- Confirmation dialogs
- Success/Error notifications

---

# System-Wide Features

## Dark Mode (Student Side)
See [Student Features - Dark Mode](#5-dark-mode)

---

## Data Security & Validation

All features should include:
- Input validation on client and server side
- SQL injection prevention (prepared statements)
- CSRF token validation
- User authentication checks
- Role-based access control (Student vs Admin)
- Data sanitization

---

## Performance Considerations

- Implement pagination for large datasets
- Add caching for frequently accessed data
- Optimize database queries
- Lazy load images and data
- Use indexing for frequently searched fields

---

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements (especially important for dark mode)

---

## Testing Checklist

- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] UI/UX testing across browsers
- [ ] Mobile responsiveness testing
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Security testing (SQL injection, XSS, etc.)

---

## Implementation Priority

### Phase 1 (High Priority)
1. Dark Mode
2. Software Availability / Lab
3. User Sit-In Summary

### Phase 2 (Medium Priority)
1. Session Table
2. View Reservations (Admin)
3. Generate Reports

### Phase 3 (Lower Priority)
1. Reservation System (Student)
2. Analytics Dashboard
3. Software App Import/Upload

---

## Notes

- All features should maintain consistency with existing design system
- Use existing components from `src/Components/` where applicable
- Follow current code structure and naming conventions
- Ensure responsive design for mobile and desktop
- Implement proper error handling and user feedback
- Consider API rate limiting for heavy operations
