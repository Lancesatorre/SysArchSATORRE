# Student Side Features - Detailed Documentation

## 1. Software Availability / Lab Page

### Purpose
Display available software in each lab based on what the admin has uploaded in the Software Management app.

### User Flow
```
Student Login 
  ↓
Student Dashboard 
  ↓
Click "Software Availability" 
  ↓
View all labs with software listing
  ↓
Select lab to see detailed software list
  ↓
View software details (name, version, category, etc.)
```

### Page Structure
```
┌─────────────────────────────────────────────┐
│ Software Availability / Lab                  │
├─────────────────────────────────────────────┤
│ [Lab Filter Dropdown]    [Search Box]        │
├─────────────────────────────────────────────┤
│                                              │
│  Lab Name: Computer Lab A-1                 │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Visual Studio│  │ SQL Server   │         │
│  │ 2022         │  │ 2022         │         │
│  │ IDE          │  │ Database     │         │
│  └──────────────┘  └──────────────┘         │
│                                              │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Python 3.10  │  │ NetBeans IDE │         │
│  │ Tools        │  │ IDE          │         │
│  └──────────────┘  └──────────────┘         │
│                                              │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Postman      │  │ Git          │         │
│  │ Tools        │  │ Tools        │         │
│  └──────────────┘  └──────────────┘         │
│                                              │
└─────────────────────────────────────────────┘
```

### Features

#### Lab Selection
- Dropdown/Select input to filter by lab
- Or: Cards view showing all labs
- Default: Show all labs

#### Software Display
**Format Options:**
1. **Card/Grid View** (Recommended)
   - Software name (bold)
   - Version
   - Category badge (color-coded: IDE=Blue, Database=Green, Tools=Orange, etc.)
   - Installation date
   - Click for more details

2. **List View** (Alternative)
   - Rows with: Name | Version | Category | Installation Date | Action

#### Search & Filter
- Search by software name
- Filter by category dropdown
- Filter by lab

#### Software Details Modal (on click)
```
┌──────────────────────────────┐
│ Software Details             │
├──────────────────────────────┤
│ Name:        Visual Studio    │
│ Version:     2022 v17.4       │
│ Category:    IDE              │
│ Status:      Available        │
│ In Labs:     Lab A-1, Lab B-3 │
│ Installed:   2024-01-15       │
│ Description: Full-featured    │
│              IDE for .NET     │
│              development      │
├──────────────────────────────┤
│ [Close]                       │
└──────────────────────────────┘
```

### Backend Requirements

#### API Endpoint
```
GET /server/actions/getSoftwareAvailability.php

Parameters:
  - lab_id (optional): Filter by specific lab
  - category (optional): Filter by category

Response JSON:
{
  "success": true,
  "data": [
    {
      "software_id": 1,
      "name": "Visual Studio",
      "version": "2022",
      "category": "IDE",
      "labs": ["Lab A-1", "Lab B-3"],
      "installation_date": "2024-01-15",
      "status": "active",
      "description": "..."
    }
  ]
}
```

### Database Queries
- `SELECT * FROM software WHERE status = 'active'`
- `SELECT * FROM software_labs WHERE lab_id = ?`
- Join with lab information for display

### React Component Structure
```
SoftwareAvailability.jsx (Main Page)
├── SoftwareFilter.jsx (Lab selector, search)
├── SoftwareGrid.jsx (Card view display)
│   └── SoftwareCard.jsx (Individual software card)
│       └── SoftwareDetailsModal.jsx (Detail popup)
└── LoadingOverlay.jsx (For data fetching)
```

### Sample Component Code

```jsx
// SoftwareAvailability.jsx
import React, { useState, useEffect } from 'react';
import SoftwareFilter from './SoftwareFilter';
import SoftwareGrid from './SoftwareGrid';
import LoadingOverlay from '../Components/LoadingOverlay';

export default function SoftwareAvailability() {
  const [software, setSoftware] = useState([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSoftware();
  }, [selectedLab]);

  const fetchSoftware = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedLab) params.append('lab_id', selectedLab);
      
      const response = await fetch(`/server/actions/getSoftwareAvailability.php?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setSoftware(result.data);
      }
    } catch (error) {
      console.error('Error fetching software:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSoftware = software.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Software Availability</h1>
      <SoftwareFilter 
        onLabChange={setSelectedLab}
        onSearchChange={setSearchTerm}
      />
      {loading ? (
        <LoadingOverlay />
      ) : (
        <SoftwareGrid software={filteredSoftware} />
      )}
    </div>
  );
}
```

---

## 2. Sit-In Summary (Dashboard Widget)

### Purpose
Display key statistics about student's lab usage on the main dashboard.

### Metrics to Display

#### Card 1: Total Sit-In Hours
```
┌─────────────────┐
│   [⏱️ Icon]     │
│                 │
│  Total Hours    │
│    125.5        │
│                 │
│  hours this      │
│  semester        │
└─────────────────┘
```

#### Card 2: Number of Sessions
```
┌─────────────────┐
│   [📊 Icon]     │
│                 │
│  Sessions       │
│      42         │
│                 │
│  total sessions │
└─────────────────┘
```

#### Card 3: Average Duration
```
┌─────────────────┐
│   [⏰ Icon]     │
│                 │
│  Avg Duration   │
│   2h 59min      │
│                 │
│  per session    │
└─────────────────┘
```

#### Card 4: Longest Session
```
┌─────────────────┐
│   [🏆 Icon]     │
│                 │
│  Longest        │
│   6h 45min      │
│                 │
│  single session │
└─────────────────┘
```

### Optional Features
- **Time Period Selector**: This Month / This Semester / All Time
- **Trend Indicators**: ↑ or ↓ showing increase/decrease from previous period
- **Mini Charts**: Small sparkline chart showing trend over time

### Data Calculations

```
Total Hours = SUM(duration) of all sessions
Number of Sessions = COUNT(*) of sessions
Average Duration = Total Hours / Number of Sessions
Longest Session = MAX(duration) of all sessions
```

### Backend Requirements

#### API Endpoint
```
GET /server/actions/studentProfileStats.php

Response JSON:
{
  "success": true,
  "data": {
    "total_hours": 125.5,
    "session_count": 42,
    "average_duration": 2.98,
    "longest_session": 6.75,
    "time_period": "semester"
  }
}
```

### React Component

```jsx
// SitInSummary.jsx
import React, { useState, useEffect } from 'react';
import { Clock, BarChart3, Zap, Award } from 'lucide-react';

export default function SitInSummary() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/server/actions/studentProfileStats.php');
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Unable to load statistics</div>;

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return `${h}h ${m}min`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <SummaryCard 
        icon={<Clock />}
        title="Total Hours"
        value={formatDuration(stats.total_hours)}
      />
      <SummaryCard 
        icon={<BarChart3 />}
        title="Sessions"
        value={stats.session_count}
      />
      <SummaryCard 
        icon={<Zap />}
        title="Avg Duration"
        value={formatDuration(stats.average_duration)}
      />
      <SummaryCard 
        icon={<Award />}
        title="Longest Session"
        value={formatDuration(stats.longest_session)}
      />
    </div>
  );
}

function SummaryCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <div className="flex justify-center mb-3 text-primary">{icon}</div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
```

---

## 3. Session History Table Page

### Purpose
Display detailed table of all student sessions with sorting, filtering, and export options.

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ My Sessions / Session History                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Filters: [Lab ▼] [Date Range ▼] [Status ▼]            │
│          [🔍 Search PC No...]  [↓ Export]              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Date      │Time In │Time Out│Duration│PC No│Status    │
├─────────────────────────────────────────────────────────┤
│2024-01-20│08:30  │11:45  │3:15   │A-05 │✓ Completed│
│2024-01-19│13:00  │15:30  │2:30   │B-12 │✓ Completed│
│2024-01-18│09:15  │16:45  │7:30   │A-03 │✓ Completed│
│2024-01-17│10:00  │12:30  │2:30   │C-08 │✓ Completed│
│                                                         │
│ Showing 1-10 of 127                                     │
│ [◀ Previous] [1] [2] [3] ... [13] [Next ▶]            │
└─────────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Description | Format | Sortable |
|--------|-------------|--------|----------|
| Date | Session date | YYYY-MM-DD | Yes |
| Time In | Check-in time | HH:MM | Yes |
| Time Out | Check-out time | HH:MM | Yes |
| Duration | Session length | HH:MM | Yes |
| PC No. | Computer number | Text (e.g., A-05) | Yes |
| Status | Session status | Badge | Yes |

### Filters & Search

1. **Lab Filter**: Dropdown of all labs
2. **Date Range**: From date to date picker
3. **Status Filter**: Dropdown (Completed, In Progress, etc.)
4. **Search**: PC number search

### Features

- **Column Sorting**: Click header to toggle ascending/descending
- **Row Expansion**: Click row to see additional details
- **Pagination**: 10, 25, 50 rows per page selector
- **Export**: CSV button to download data
- **Responsive**: Stack on mobile devices

### Row Details Modal (on click)

```
┌──────────────────────────────┐
│ Session Details              │
├──────────────────────────────┤
│ Date:         2024-01-20     │
│ Lab:          Lab A          │
│ PC Number:    A-05           │
│ Time In:      08:30:15       │
│ Time Out:     11:45:42       │
│ Duration:     3h 15m 27s     │
│ Status:       Completed      │
│ Purpose:      Database Work  │
│ Notes:        (if any)       │
├──────────────────────────────┤
│ [Close]   [Print]            │
└──────────────────────────────┘
```

### Backend Requirements

#### API Endpoints
```
GET /server/actions/getStudentSessions.php

Parameters:
  - lab_id (optional)
  - start_date (optional)
  - end_date (optional)
  - status (optional)
  - page (default: 1)
  - per_page (default: 10)

Response JSON:
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
    "total_count": 127,
    "page": 1,
    "per_page": 10
  }
}
```

### React Component

```jsx
// StudentHistory.jsx
import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function StudentHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    lab: '',
    startDate: '',
    endDate: '',
    status: '',
    page: 1,
    perPage: 10
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await fetch(`/server/actions/getStudentSessions.php?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setSessions(result.data.sessions);
        setTotal(result.data.total_count);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleExport = () => {
    // Generate CSV and trigger download
    const csv = sessions.map(s => 
      `${s.session_date},${s.time_in},${s.time_out},${formatDuration(s.duration_minutes)},${s.pc_number},${s.status}`
    ).join('\n');
    
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = 'sessions.csv';
    link.click();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Sessions</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input 
            type="date" 
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            placeholder="Start Date"
            className="border p-2 rounded"
          />
          <input 
            type="date" 
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            placeholder="End Date"
            className="border p-2 rounded"
          />
          <select 
            value={filters.lab}
            onChange={(e) => setFilters({...filters, lab: e.target.value})}
            className="border p-2 rounded"
          >
            <option value="">All Labs</option>
            <option value="lab-a">Lab A</option>
            <option value="lab-b">Lab B</option>
          </select>
          <input 
            type="text"
            placeholder="Search PC No..."
            className="border p-2 rounded"
          />
          <button 
            onClick={handleExport}
            className="bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-2"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4 text-left cursor-pointer">Date</th>
              <th className="p-4 text-left cursor-pointer">Time In</th>
              <th className="p-4 text-left cursor-pointer">Time Out</th>
              <th className="p-4 text-left cursor-pointer">Duration</th>
              <th className="p-4 text-left cursor-pointer">PC No</th>
              <th className="p-4 text-left cursor-pointer">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.session_id} className="border-b hover:bg-gray-50">
                <td className="p-4">{session.session_date}</td>
                <td className="p-4">{session.time_in}</td>
                <td className="p-4">{session.time_out}</td>
                <td className="p-4">{formatDuration(session.duration_minutes)}</td>
                <td className="p-4">{session.pc_number}</td>
                <td className="p-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    ✓ {session.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <span className="text-gray-600">Showing {(filters.page - 1) * filters.perPage + 1}-{Math.min(filters.page * filters.perPage, total)} of {total}</span>
        <div className="space-x-2">
          <button onClick={() => setFilters({...filters, page: filters.page - 1})}>Previous</button>
          <span>{filters.page}</span>
          <button onClick={() => setFilters({...filters, page: filters.page + 1})}>Next</button>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Reservation System

### Purpose
Allow students to view available labs/PCs and make, manage, and cancel reservations.

### Complete User Flow

```
Student Dashboard
    ↓
[Click "Make Reservation"]
    ↓
Select Lab → Select Date → Select Time Slot
    ↓
View Available PCs (Green: Available, Red: Unavailable)
    ↓
Select PC
    ↓
Review Reservation → Submit
    ↓
Confirmation Message
    ↓
Reservation appears in "My Reservations" with status "Pending Approval"
```

### Page 1: Lab & Availability Selector

#### Layout
```
┌────────────────────────────────────────────────────────┐
│ Make a Reservation                                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Step 1: Select Lab                                    │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│ │ Lab A      │  │ Lab B      │  │ Lab C      │        │
│ │ 15 PCs     │  │ 20 PCs     │  │ 10 PCs     │        │
│ │ 5 Available│  │ 3 Available│  │ 10 Available       │
│ └────────────┘  └────────────┘  └────────────┘        │
│                                                        │
│ Step 2: Select Date & Time                            │
│ From: [Date Picker]  To: [Date Picker]                │
│ Time: [9:00 AM - 5:00 PM ▼]                           │
│                                                        │
│ [Next] [Cancel]                                        │
└────────────────────────────────────────────────────────┘
```

### Page 2: PC Selection

#### Layout
```
┌────────────────────────────────────────────────────────┐
│ Lab A - PC Selection                                   │
├────────────────────────────────────────────────────────┤
│ Date: 2024-02-15 | Time: 9:00 AM - 5:00 PM            │
│                                                        │
│ Available PCs (Click to select)                        │
│                                                        │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│ │ A-01│ │ A-02│ │ A-03│ │ A-04│ │ A-05│              │
│ │  ✓  │ │  ✓  │ │  ✓  │ │  ✗  │ │  ✓  │              │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                        │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│ │ A-06│ │ A-07│ │ A-08│ │ A-09│ │A-10 │              │
│ │  ✓  │ │  ✓  │ │  ✓  │ │  ✓  │ │  ✓  │              │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                        │
│ Selected PC: [A-02]                                    │
│                                                        │
│ [Back] [Next] [Cancel]                                │
└────────────────────────────────────────────────────────┘
```

### Page 3: Confirmation

```
┌────────────────────────────────────────────────────────┐
│ Confirm Reservation                                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Reservation Details:                                  │
│ • Lab: Lab A                                          │
│ • PC: A-02                                            │
│ • Date: February 15, 2024                             │
│ • Time: 9:00 AM - 5:00 PM                             │
│ • Status: Pending Admin Approval                      │
│                                                        │
│ You will receive notification when approved.           │
│                                                        │
│ [Cancel] [Confirm & Submit]                           │
└────────────────────────────────────────────────────────┘
```

### Page 4: My Reservations

#### Layout
```
┌─────────────────────────────────────────────────────────┐
│ My Reservations                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Filters: [Status ▼] [Date Range ▼]                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Lab  │PC No│Date        │Time Slot    │Status         │
├─────────────────────────────────────────────────────────┤
│Lab A │A-02 │2024-02-15  │9:00-17:00   │⏳ Pending     │
│Lab B │B-05 │2024-02-16  │13:00-15:00  │✓ Approved    │
│Lab C │C-03 │2024-02-10  │9:00-17:00   │✗ Declined    │
│      │     │            │             │  (Reason)    │
│Lab A │A-07 │2024-01-29  │9:00-17:00   │✓ Completed   │
│      │     │            │             │  (Sat)       │
│                                                         │
└─────────────────────────────────────────────────────────┘

Legend:
  ⏳ Pending - Awaiting admin approval
  ✓ Approved - Ready for use
  ✗ Declined - Rejected by admin
  ✓ Completed - Past date, fully used
```

### Features

#### View Available Slots
- Display all labs with availability cards
- Show total PCs and available PCs count
- Filter by date
- Color-coded availability (Green: Available, Red: Full)

#### Make Reservation
- Multi-step form (Lab → Date/Time → PC Selection → Confirm)
- Date picker with disabled past dates
- Time slot selector
- Real-time PC availability update
- Form validation

#### Manage Reservations
- Table view of all reservations
- Filter by status (Pending, Approved, Declined, Completed)
- Show detailed information (Lab, PC, Date, Time, Status)
- Color-coded status badges

#### Delete Reservation
- Delete button only for "Pending" status
- Confirmation dialog before deletion
- Success message after deletion
- Auto-refresh table

#### Notifications
- Toast notification after making reservation
- Email notification (if backend supports) when approved/declined
- Decline reason display

### Backend Requirements

#### API Endpoints

```
1. GET /server/actions/getLabAvailability.php
   Parameters: date (optional)
   Response: List of labs with available PC counts

2. GET /server/actions/getPCAvailability.php
   Parameters: lab_id, date, time_slot
   Response: List of PCs with availability status

3. POST /server/actions/createReservation.php
   Body: {
     lab_id,
     pc_number,
     reservation_date,
     time_slot,
     student_id
   }
   Response: Reservation confirmation

4. GET /server/actions/getStudentReservations.php
   Response: All reservations for logged-in student

5. DELETE /server/actions/deleteReservation.php
   Parameters: reservation_id
   Response: Success/Failure
```

### Database Schema
```sql
CREATE TABLE reservations (
  id INT PRIMARY KEY,
  student_id INT,
  lab_id INT,
  pc_number VARCHAR(10),
  reservation_date DATE,
  time_slot_start TIME,
  time_slot_end TIME,
  status ENUM('pending', 'approved', 'declined', 'completed', 'cancelled'),
  decline_reason TEXT,
  created_at TIMESTAMP,
  approved_at TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (lab_id) REFERENCES labs(id)
);
```

---

## 5. Dark Mode Implementation

### Purpose
Provide dark theme option for comfortable usage during evening study sessions.

### Scope
- Apply to all student pages and components
- Student dashboard
- Navigation bar
- All dialogs and modals
- Tables and lists
- Forms and inputs

### Color Palette

#### Light Mode (Current)
- Background: White (#FFFFFF) or Light Gray (#F5F5F5)
- Text: Dark Gray (#333333) or Black (#000000)
- Borders: Light Gray (#DDDDDD)
- Accents: Primary Blue (#007BFF)

#### Dark Mode (New)
- Background: Very Dark Gray (#1a1a1a) or Dark Gray (#2d2d2d)
- Text: Light Gray (#f5f5f5) or Off-White (#e0e0e0)
- Borders: Subtle Gray (#404040)
- Accents: Brighter Blue (#4a9eff) or Adjusted Primary (#5fa3ff)

### Implementation Steps

#### 1. CSS Variables
Create in `src/App.css` or new `src/theme.css`:

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #dddddd;
  --accent-color: #007bff;
  --shadow: 0 2px 8px rgba(0,0,0,0.1);
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #f5f5f5;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent-color: #4a9eff;
  --shadow: 0 2px 8px rgba(0,0,0,0.5);
}
```

#### 2. Update Global Styles

```css
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

.card, .modal {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

input, textarea, select {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

#### 3. React Context for Theme

```jsx
// src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

#### 4. Theme Toggle Button

```jsx
// In Navbar.jsx or LayoutNav.jsx
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
      title="Toggle dark mode"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
```

#### 5. Update App.jsx

```jsx
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Rest of app */}
    </ThemeProvider>
  );
}
```

### Tailwind CSS Integration

If using Tailwind CSS, add to `tailwind.config.js`:

```js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Custom dark mode colors
      },
    },
  },
};
```

Then use Tailwind's dark: prefix:
```jsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

### Testing Checklist
- [ ] Light mode works as before
- [ ] Dark mode applies to all pages
- [ ] Theme persists after page reload
- [ ] Transitions are smooth
- [ ] Text contrast meets WCAG AA standards (4.5:1 for normal text)
- [ ] Images and icons are visible in both modes
- [ ] Tables and forms are readable
- [ ] Modal/dialog backgrounds are appropriate
- [ ] Links and buttons are clearly visible
- [ ] Form inputs have clear borders

### Accessibility Notes
- Ensure sufficient color contrast in dark mode
- Don't rely solely on color to convey information
- Respect user's system preference (`prefers-color-scheme`)
- Test with accessibility tools (WebAIM, WAVE)

