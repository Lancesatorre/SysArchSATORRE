# Admin Side Features - Detailed Documentation

## 1. Generate Reports

### Purpose
Create and export comprehensive reports of student sessions and sit-in activities in multiple formats (PDF, CSV, Excel).

### Page Layout

```
┌──────────────────────────────────────────────────────┐
│ Generate Reports                                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Report Type:                                         │
│ ⭕ Session Completion Report                        │
│ ⭕ Student Activity Report                          │
│ ⭕ Lab Utilization Report                           │
│                                                      │
│ Filters:                                             │
│ Lab: [All Labs ▼]                                   │
│ Date Range: [From] to [To]                          │
│ Status: [All ▼]                                     │
│ Student: [Search...]                                │
│                                                      │
│ [Preview Report]                                    │
│                                                      │
│ Export Format:                                       │
│ [ ] PDF    [ ] CSV    [ ] Excel                     │
│                                                      │
│ [Generate & Export] [Clear]                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Report Types

#### Report 1: Session Completion Report

**Purpose**: Detailed list of all completed sessions

**Columns**:
| Column | Description | Notes |
|--------|-------------|-------|
| Date | Session date | YYYY-MM-DD |
| Student Name | Full name of student | From students table |
| Student ID | Student ID number | For reference |
| Lab Name | Lab where session occurred | Lab A, Lab B, etc. |
| PC Number | Computer used | A-01, B-05, etc. |
| Time In | Check-in time | HH:MM:SS |
| Time Out | Check-out time | HH:MM:SS |
| Duration (hours) | Total duration | Calculated |
| Status | Session status | Completed, In Progress |

**Sample Output**:
```
Date       Student          Lab     PC   Time In  Time Out Duration Status
2024-01-20 Juan Santos      Lab A   A-05 08:30   11:45    3:15     Completed
2024-01-20 Maria Garcia     Lab B   B-12 13:00   15:30    2:30     Completed
2024-01-20 Carlos Perez     Lab A   A-03 09:15   16:45    7:30     Completed
```

#### Report 2: Student Activity Report

**Purpose**: Summary of each student's lab usage

**Columns**:
| Column | Description |
|--------|-------------|
| Student Name | Full name |
| Student ID | ID number |
| Total Hours | Sum of all session durations |
| Session Count | Total number of sessions |
| Avg Session Duration | Total hours / Session count |
| First Session Date | Earliest session |
| Last Session Date | Most recent session |
| Most Used Lab | Lab with most sessions |

**Sample Output**:
```
Student Name      Total Hours Sessions Avg Duration Most Used Lab
Juan Santos       125.50      42       2:59         Lab A
Maria Garcia      98.25       35       2:48         Lab B
Carlos Perez      156.75      51       3:04         Lab C
```

#### Report 3: Lab Utilization Report (Optional)

**Purpose**: Efficiency and usage metrics per lab

**Columns**:
- Lab name
- Total PCs
- Sessions conducted
- Occupancy rate (%)
- Peak hours
- Average daily usage
- Most popular times

### Filters

1. **Report Type**: Radio buttons or dropdown
2. **Lab Filter**: Multi-select or dropdown (All Labs by default)
3. **Date Range**: Date picker from/to
4. **Status Filter**: Dropdown (All, Completed, In Progress, Incomplete)
5. **Student Search**: Text input to filter by student name
6. **Department Filter** (Optional): If your system has departments

### Export Formats

#### 1. PDF Export
- Professional header with school logo
- Title and report date
- Filter summary (what data is included)
- Formatted table with proper spacing
- Page numbers and footer
- Generated using: dompdf or mPDF library

#### 2. CSV Export
- Comma-separated values
- Header row with column names
- Each row is a record
- Compatible with Excel, Google Sheets
- No formatting, plain text

#### 3. Excel Export (.xlsx)
- Formatted workbook
- Column headers with bold text
- Alternating row colors
- Column width auto-adjusted
- Optional: Summary sheet with statistics
- Generated using: PHPOffice/PhpSpreadsheet library

### Features

- **Preview**: Display first 10-20 rows before exporting
- **Progress Indicator**: Show loading/generating status
- **File Download**: Automatic download when complete
- **Timestamp**: Report includes generation date/time
- **Summary Stats**: Total records, date range covered
- **Error Handling**: Clear error messages if no data found

### Backend Requirements

#### API Endpoints

```php
POST /server/actions/generateReportData.php

Request Body:
{
  "report_type": "session_completion|student_activity|lab_utilization",
  "lab_ids": [1, 2, 3],
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "status": "completed",
  "student_id": null,
  "format": "preview"
}

Response:
{
  "success": true,
  "data": [
    // Array of report rows
  ],
  "summary": {
    "total_records": 150,
    "date_range": "2024-01-01 to 2024-01-31"
  }
}
```

```php
POST /server/actions/exportReport.php

Request Body:
{
  "report_type": "session_completion",
  "format": "pdf|csv|xlsx",
  "filters": { /* same as above */ }
}

Response: File download or URL
```

#### Database Queries

```sql
-- Session Completion Report
SELECT 
  DATE(s.session_date) as date,
  st.first_name, st.last_name,
  st.student_id,
  l.lab_name,
  s.pc_number,
  TIME(s.time_in) as time_in,
  TIME(s.time_out) as time_out,
  TIMEDIFF(s.time_out, s.time_in) as duration,
  s.status
FROM sessions s
JOIN students st ON s.student_id = st.id
JOIN labs l ON s.lab_id = l.id
WHERE s.status = 'completed'
  AND s.session_date BETWEEN ? AND ?
ORDER BY s.session_date DESC;

-- Student Activity Report
SELECT 
  st.first_name, st.last_name,
  st.student_id,
  SUM(TIMESTAMPDIFF(HOUR, s.time_in, s.time_out)) as total_hours,
  COUNT(s.id) as session_count,
  AVG(TIMESTAMPDIFF(MINUTE, s.time_in, s.time_out)) as avg_duration_min,
  MIN(s.session_date) as first_session,
  MAX(s.session_date) as last_session
FROM sessions s
JOIN students st ON s.student_id = st.id
WHERE s.status = 'completed'
GROUP BY st.id
ORDER BY total_hours DESC;
```

#### Libraries Required
```php
// For PDF Export
composer require dompdf/dompdf

// For Excel Export
composer require phpoffice/phpspreadsheet

// CSV - No library needed, built-in PHP
```

### React Component Structure

```jsx
// AdminReports.jsx (Main Component)
├── ReportTypeSelector.jsx
├── FilterPanel.jsx
├── ReportPreview.jsx
├── ExportOptions.jsx
└── LoadingOverlay.jsx
```

### Sample Implementation Code

```jsx
// AdminReports.jsx
import React, { useState } from 'react';
import { Download, FileDown } from 'lucide-react';

export default function AdminReports() {
  const [reportType, setReportType] = useState('session_completion');
  const [filters, setFilters] = useState({
    lab_ids: [],
    start_date: '',
    end_date: '',
    status: '',
    student_id: ''
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

  const handlePreview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/server/actions/generateReportData.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          ...filters,
          format: 'preview'
        })
      });
      const result = await response.json();
      if (result.success) {
        setPreviewData(result.data);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/server/actions/exportReport.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          format: exportFormat,
          filters
        })
      });
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report.${exportFormat === 'csv' ? 'csv' : exportFormat === 'xlsx' ? 'xlsx' : 'pdf'}`;
      link.click();
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Generate Reports</h1>
      
      {/* Report Type Selection */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Report Type</h2>
        <div className="space-y-3">
          <label>
            <input 
              type="radio" 
              value="session_completion"
              checked={reportType === 'session_completion'}
              onChange={(e) => setReportType(e.target.value)}
            />
            <span className="ml-2">Session Completion Report</span>
          </label>
          <label>
            <input 
              type="radio"
              value="student_activity"
              checked={reportType === 'student_activity'}
              onChange={(e) => setReportType(e.target.value)}
            />
            <span className="ml-2">Student Activity Report</span>
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({...filters, start_date: e.target.value})}
            placeholder="Start Date"
            className="border p-2 rounded"
          />
          <input 
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({...filters, end_date: e.target.value})}
            placeholder="End Date"
            className="border p-2 rounded"
          />
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border p-2 rounded"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Preview Button */}
      <button 
        onClick={handlePreview}
        className="bg-blue-500 text-white px-6 py-2 rounded mb-6"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Preview Report'}
      </button>

      {/* Preview Display */}
      {previewData && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">Report Preview</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {Object.keys(previewData[0] || {}).map(key => (
                  <th key={key} className="p-2 text-left">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="border-b">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="p-2">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Export Format</h2>
        <div className="flex gap-4 mb-4">
          <label>
            <input 
              type="radio"
              value="pdf"
              checked={exportFormat === 'pdf'}
              onChange={(e) => setExportFormat(e.target.value)}
            />
            <span className="ml-2">PDF</span>
          </label>
          <label>
            <input 
              type="radio"
              value="csv"
              checked={exportFormat === 'csv'}
              onChange={(e) => setExportFormat(e.target.value)}
            />
            <span className="ml-2">CSV</span>
          </label>
          <label>
            <input 
              type="radio"
              value="xlsx"
              checked={exportFormat === 'xlsx'}
              onChange={(e) => setExportFormat(e.target.value)}
            />
            <span className="ml-2">Excel</span>
          </label>
        </div>
        <button 
          onClick={handleExport}
          className="bg-green-500 text-white px-6 py-2 rounded flex items-center gap-2"
          disabled={!previewData || loading}
        >
          <Download size={18} /> Export Report
        </button>
      </div>
    </div>
  );
}
```

---

## 2. View Reservations (Admin Management)

### Overview
Comprehensive three-section management system for handling lab/PC availability, student reservation approvals, and reservation activity logs.

### Section 1: Lab & PC Availability Control

#### Purpose
Enable/disable specific labs, PCs, and time slots for student reservations.

#### Page Layout

```
┌──────────────────────────────────────────────────────────┐
│ Reservation Management - Lab & PC Control               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [+ Add Lab] [Manage Time Slots]                         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─ Lab A (Computer Lab - Ground Floor) ─────┐           │
│ │ Status: [Enable Toggle]  [Edit]  [Delete] │           │
│ │                                            │           │
│ │ PCs Status:                                │           │
│ │ ✓ A-01  ✓ A-02  ✓ A-03  ✗ A-04  ✓ A-05  │           │
│ │ ✓ A-06  ✓ A-07  ✓ A-08  ✓ A-09  ✓ A-10  │           │
│ │ ✓ A-11  ✓ A-12  ✓ A-13  ✗ A-14  ✓ A-15  │           │
│ │                                            │           │
│ │ Availability Schedule:                     │           │
│ │ Mon-Fri: 08:00 - 17:00  [Edit]             │           │
│ │ Sat:     09:00 - 13:00  [Edit]             │           │
│ │ Sun:     Closed         [Edit]             │           │
│ │                                            │           │
│ │ [Save Changes] [Cancel]                    │           │
│ └────────────────────────────────────────────┘           │
│                                                          │
│ ┌─ Lab B (Programming Lab) ─────────────────┐           │
│ │ Status: [Enable Toggle]  [Edit]  [Delete] │           │
│ │ ... (similar structure)                    │           │
│ └────────────────────────────────────────────┘           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Features

**Lab Card**:
- Lab name and location
- Enable/Disable toggle for entire lab
- PC grid showing availability (✓ = Enabled, ✗ = Disabled)
- Individual PC toggle switches (click to enable/disable)
- Operating hours display
- Edit and Delete buttons

**Editing Lab**:
- Lab name (editable)
- Location/description
- Operating hours (multiple schedules for Mon-Fri, Sat, Sun)
- Save or Cancel

**Time Slot Configuration**:
- Default operating hours
- Multiple time slots per day
- Set maintenance windows (unavailable times)
- Different schedules for different days

#### Operations

1. **Enable/Disable Lab**: Toggle button
2. **Enable/Disable PC**: Click PC number to toggle
3. **Edit Lab Details**: Edit button opens form
4. **Set Time Slots**: Manage operating hours
5. **Save Changes**: Persist to database
6. **Delete Lab**: Remove lab from system

#### Backend Requirements

```php
// Get all labs with PC information
GET /server/actions/adminGetLabsAvailability.php

Response:
{
  "success": true,
  "data": [
    {
      "lab_id": 1,
      "lab_name": "Lab A",
      "location": "Ground Floor",
      "enabled": true,
      "pcs": [
        {
          "pc_number": "A-01",
          "status": "enabled"
        },
        {
          "pc_number": "A-02",
          "status": "enabled"
        }
      ],
      "schedule": [
        {
          "day": "monday",
          "start_time": "08:00",
          "end_time": "17:00",
          "enabled": true
        }
      ]
    }
  ]
}

// Update lab/PC status
POST /server/actions/adminUpdateLabAvailability.php

Body:
{
  "lab_id": 1,
  "lab_enabled": true,
  "pcs": [
    { "pc_number": "A-01", "status": "enabled" },
    { "pc_number": "A-02", "status": "disabled" }
  ],
  "schedule": [...]
}
```

---

### Section 2: Pending Reservations (Approval Queue)

#### Purpose
Review and approve/decline student reservation requests awaiting admin action.

#### Page Layout

```
┌──────────────────────────────────────────────────────────┐
│ Pending Reservations                                     │
│ (Awaiting Your Approval)                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Filters: [Lab ▼] [Date ▼] [Sort ▼]                      │
│ Pending: 12 reservations                                 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Student │Lab │PC  │Date │Time │Submitted│Actions       │
├──────────────────────────────────────────────────────────┤
│Juan     │Lab │A-02│2/15 │9-17 │1 hour   │[✓A] [✗D]    │
│Santos   │A   │    │     │     │ ago     │[→ View]     │
├──────────────────────────────────────────────────────────┤
│Maria    │Lab │B-05│2/16 │13-15│2 hours  │[✓A] [✗D]    │
│Garcia   │B   │    │     │     │ ago     │[→ View]     │
├──────────────────────────────────────────────────────────┤
│Carlos   │Lab │C-03│2/17 │9-17 │5 hours  │[✓A] [✗D]    │
│Perez    │C   │    │     │     │ ago     │[→ View]     │
│                                                          │
│ [Approve All] [Decline All] (Use with caution)          │
└──────────────────────────────────────────────────────────┘
```

#### Features

**Table Columns**:
- Student name
- Lab requested
- PC number
- Requested date
- Time slot
- Submission time (relative, e.g., "2 hours ago")
- Actions (Approve, Decline, View Details)

**Quick Actions**:
- **Approve Button** (✓): Accept reservation immediately
  - Status changes to "Approved"
  - Email notification sent to student
  - Removes from pending queue
  
- **Decline Button** (✗): Reject reservation
  - Opens decline form with optional reason
  - Status changes to "Declined"
  - Email notification sent with decline reason
  - Removes from pending queue

- **View Details**: Opens full reservation info modal

**Filters**:
- Lab filter (All Labs / Lab A / Lab B / Lab C)
- Date filter (Today / This Week / All)
- Sort options (Newest First / Oldest First / By Lab)

**Bulk Actions**:
- Approve all pending reservations
- Decline all pending reservations
- (Use with caution - confirmation required)

#### Approval Modal

```
┌──────────────────────────────────┐
│ Decline Reservation              │
├──────────────────────────────────┤
│                                  │
│ Reservation Details:             │
│ Student: Juan Santos             │
│ Lab: Lab A, PC A-02              │
│ Date: February 15, 2024          │
│ Time: 9:00 AM - 5:00 PM          │
│                                  │
│ Reason for Declining:            │
│ ┌──────────────────────────────┐ │
│ │ (Reason dropdown or text)    │ │
│ │ - PC maintenance scheduled   │ │
│ │ - Lab fully booked          │ │
│ │ - Other reason...           │ │
│ └──────────────────────────────┘ │
│                                  │
│ Notify Student: [✓ Toggle]       │
│                                  │
│ [Cancel] [Decline & Notify]      │
└──────────────────────────────────┘
```

#### Backend Requirements

```php
// Get pending reservations
GET /server/actions/adminGetPendingReservations.php

Parameters:
  - lab_id (optional)
  - sort (default: 'newest')
  - limit (default: 50)

Response:
{
  "success": true,
  "data": {
    "count": 12,
    "reservations": [
      {
        "reservation_id": 1,
        "student_id": 5,
        "student_name": "Juan Santos",
        "lab_id": 1,
        "lab_name": "Lab A",
        "pc_number": "A-02",
        "reservation_date": "2024-02-15",
        "time_from": "09:00",
        "time_to": "17:00",
        "created_at": "2024-02-14 15:30:00",
        "status": "pending"
      }
    ]
  }
}

// Approve reservation
POST /server/actions/adminApproveReservation.php

Body:
{
  "reservation_id": 1,
  "notify_student": true
}

Response:
{
  "success": true,
  "message": "Reservation approved",
  "notification_sent": true
}

// Decline reservation
POST /server/actions/adminDeclineReservation.php

Body:
{
  "reservation_id": 1,
  "reason": "PC maintenance scheduled",
  "notify_student": true
}

Response:
{
  "success": true,
  "message": "Reservation declined"
}
```

---

### Section 3: Reservation Logs & History

#### Purpose
View complete history of all reservation actions with comprehensive filtering and search.

#### Page Layout

```
┌───────────────────────────────────────────────────────────┐
│ Reservation Activity Log                                  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ Filters & Search:                                         │
│ [Action ▼] [Status ▼] [Date Range]                       │
│ [Search Student...] [🔍] [↓ Export CSV]                  │
│                                                           │
│ Quick Stats: 427 Approved | 23 Declined | 5 Active       │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ Date │Action │Student │Lab │PC  │Approved │Status │Details
├───────────────────────────────────────────────────────────┤
│ 2/15 │Approved│Juan S. │A   │A-02│2/14 16h │Active │[→]  │
│ 2/15 │Declined│Maria G.│B   │B-05│--       │--     │[→]  │
│ 2/14 │Approved│Carlos P│C   │C-03│2/14 14h │Compl. │[→]  │
│ 2/14 │Approved│Ana M.  │A   │A-07│2/14 10h │Active │[→]  │
│ 2/13 │Cancelled│Peter R│B   │--  │--       │--     │[→]  │
│                                                           │
│ Showing 1-10 of 455                                       │
│ [◀ Prev] [1] [2] [3] ... [46] [Next ▶]                  │
└───────────────────────────────────────────────────────────┘
```

#### Table Columns

| Column | Description | Values |
|--------|-------------|--------|
| Date | Date of action | YYYY-MM-DD |
| Action | What happened | Approved, Declined, Cancelled |
| Student | Student name | Full name |
| Lab | Lab name | Lab A, Lab B, etc. |
| PC | PC number | A-01, B-05, etc. |
| Approved | When approved | Date and time or "N/A" |
| Status | Current status | Active, Completed, Expired, Cancelled |
| Details | View full info | Click arrow icon |

#### Filters

1. **Action Filter**: Radio/Checkbox
   - Approved
   - Declined
   - Cancelled

2. **Status Filter**: Multi-select
   - Active (reservation in future/active)
   - Completed (past reservation date, used)
   - Expired (past date, not used)
   - Cancelled (student cancelled)

3. **Date Range**: From - To date picker

4. **Student Search**: Text input (name or ID)

5. **Lab Filter**: Multi-select dropdown

#### Additional Features

**Quick Stats Bar**:
- Total Approved (with count)
- Total Declined (with count)
- Currently Active (with count)

**Decline Reason Display**:
- Show decline reason in tooltip or modal
- Visible when hovering or clicking Details

**Details Modal**:
```
┌──────────────────────────────┐
│ Reservation Details          │
├──────────────────────────────┤
│ Student: Juan Santos         │
│ ID: STU-001234               │
│ Lab: Lab A                   │
│ PC: A-02                     │
│ Requested: 2024-02-15        │
│ Time: 9:00 - 17:00          │
│ Status: Active               │
│ Action: Approved             │
│ Approved By: admin@...       │
│ Approved Date: 2024-02-14    │
│ Reason (if declined): --     │
│ Notes: None                  │
├──────────────────────────────┤
│ [Print] [Email to Student]   │
│ [Close]                      │
└──────────────────────────────┘
```

**Active Student Badge**:
- Green "ACTIVE" badge for students currently in lab
- Update in real-time or on page refresh

**Export**:
- Export filtered logs to CSV
- Includes: Date, Action, Student, Lab, PC, Status

#### Backend Requirements

```php
// Get reservation logs/history
GET /server/actions/adminGetReservationLogs.php

Parameters:
  - action (optional): approved|declined|cancelled
  - status (optional): active|completed|expired
  - start_date (optional)
  - end_date (optional)
  - student_id (optional)
  - lab_id (optional)
  - page (default: 1)
  - per_page (default: 10)
  - sort (default: 'date_desc')

Response:
{
  "success": true,
  "data": {
    "logs": [
      {
        "log_id": 1,
        "reservation_id": 100,
        "action": "approved",
        "student_name": "Juan Santos",
        "student_id": "STU-001",
        "lab_id": 1,
        "lab_name": "Lab A",
        "pc_number": "A-02",
        "reservation_date": "2024-02-15",
        "time_from": "09:00",
        "time_to": "17:00",
        "action_date": "2024-02-14",
        "action_time": "16:30:00",
        "approved_by": "admin@school.edu",
        "decline_reason": null,
        "status": "active",
        "is_active_now": true
      }
    ],
    "total_count": 455,
    "stats": {
      "total_approved": 427,
      "total_declined": 23,
      "currently_active": 5
    }
  }
}

// Get active sessions (for "Active Student" indicator)
GET /server/actions/adminGetActiveSessions.php

Response:
{
  "success": true,
  "data": [
    {
      "reservation_id": 100,
      "student_name": "Juan Santos",
      "lab_id": 1,
      "pc_number": "A-02",
      "time_in": "2024-02-15 09:00:00",
      "currently_in_lab": true
    }
  ]
}
```

---

## 3. Analytics Dashboard (Admin)

### Purpose
Visual analytics and key performance indicators for lab usage, student behavior, and system metrics.

### Page Layout

```
┌────────────────────────────────────────────────────────────┐
│ Analytics Dashboard                                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Date Range: [This Month ▼]                 [🔄 Refresh]  │
│                                                            │
├────────── KEY METRICS ──────────────────────────────────────┤
│                                                            │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │  Total Hours │ │ Total Sess. │ │ Avg Duration │        │
│ │   4,850.5    │ │    1,245     │ │    2h 20m    │        │
│ │   +12% ↑     │ │    +8% ↑     │ │    -3% ↓     │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                            │
├────────── USAGE TRENDS ──────────────────────────────────────┤
│                                                            │
│ Daily Average Sessions      Busiest Times                 │
│ [Line Chart: Last 30 days]  [Bar Chart: By Hour]          │
│                                                            │
│ Hours: 8am, 2pm, 4pm                                      │
│ Peak: Monday-Friday                                       │
│                                                            │
├────────── TOP PERFORMERS ────────────────────────────────────┤
│                                                            │
│ Students with Most Hours   |  Most Active Students        │
│ ┌──────────────────────┐   |  ┌──────────────────────┐    │
│ │1. Juan Santos 125.5h │   |  │1. Maria Garcia  42 sess.│  │
│ │2. Maria Garcia 98.2h │   |  │2. Juan Santos   41 sess.│  │
│ │3. Carlos Perez 92.7h │   |  │3. Carlos Perez  38 sess.│  │
│ │4. Ana Martinez 88.3h │   |  │4. Ana Martinez  35 sess.│  │
│ │5. Peter Rodriguez... │   |  │5. Peter R...   33 sess.│  │
│ └──────────────────────┘   |  └──────────────────────┘    │
│                                                            │
├────────── LAB EFFICIENCY ────────────────────────────────────┤
│                                                            │
│ Lab Utilization Rate (%)   PC Availability (%)            │
│ [Horizontal Bar Chart]      [Donut Chart]                  │
│ Lab A: 85%                                                │
│ Lab B: 72%                                                │
│ Lab C: 68%                                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Key Metrics & Analytics

#### Section 1: Key Performance Indicators (KPIs)

Display 3-4 main cards with:
- **Total Sit-In Hours**: Sum of all session durations
  - Trend (↑ increased, ↓ decreased vs. previous period)
  - Percentage change
  
- **Total Sessions**: Count of all completed sessions
  - Trend indicator
  - Percentage change

- **Average Session Duration**: Total hours / Session count
  - Trend indicator
  - Percentage change

- **Lab Occupancy Rate** (optional): (Occupied PCs / Total PCs) * 100
  - Current percentage
  - Trend

#### Section 2: Usage Trends

**Line Chart - Daily Average Sessions**:
- X-axis: Last 30 days
- Y-axis: Average number of sessions per day
- Show trend line
- Hover for daily details

**Bar Chart - Busiest Times**:
- X-axis: Hours (0-23)
- Y-axis: Session count per hour
- Show peak times
- Highlight business hours

#### Section 3: Top Performers

**Two-column layout**:

**Left Column - Students with Most Hours**:
1. Rank, Student Name, Total Hours
2. Top 5 students
3. Sortable by clicking header
4. Click to view student details

**Right Column - Most Active Students**:
1. Rank, Student Name, Session Count
2. Top 5 students
3. Different metric (frequency vs. duration)
4. Click to view student profile

#### Section 4: Lab Efficiency

**Horizontal Bar Chart - Lab Utilization Rate**:
- Shows utilization percentage for each lab
- Colored bars (green: high, yellow: medium, red: low)
- Click for lab-specific analytics

**Donut/Pie Chart - PC Availability**:
- Total PCs available
- Total PCs in use
- Total PCs disabled/maintenance

### Suggested Analytics to Display

Based on your requirements, implement:

1. **Student Engagement Score** (Custom KPI)
   - Formula: (Total Sessions × 0.3) + (Total Hours × 0.5) + (Consistency Score × 0.2)
   - Identify most engaged students
   - Shows dedication to lab usage

2. **Session Duration Distribution**
   - Box plot or histogram
   - Shows: Min, Max, Median, Q1, Q3 durations
   - Identify outliers (very long/short sessions)

3. **Lab Comparison**
   - Compare usage across labs
   - Usage percentage, average session duration, peak hours
   - Identify underutilized labs

4. **Temporal Patterns**
   - Heatmap: Day of week vs. Hour of day
   - Identify peak usage patterns
   - Plan lab maintenance windows

5. **Reservation Success Rate**
   - Percentage of approved/declined/cancelled reservations
   - Trend over time

### Date Range Selector

- Dropdown: Last Week, Last Month, Last Quarter, All Time
- Or: Custom date range picker (From / To)
- Refresh button to reload data
- Loading indicator while fetching

### Backend Requirements

```php
// Main analytics dashboard data
GET /server/actions/adminGetAnalytics.php

Parameters:
  - start_date
  - end_date
  - lab_id (optional: filter by lab)

Response:
{
  "success": true,
  "data": {
    "metrics": {
      "total_hours": 4850.5,
      "total_hours_trend": "+12%",
      "total_sessions": 1245,
      "total_sessions_trend": "+8%",
      "avg_duration_minutes": 140,
      "avg_duration_trend": "-3%",
      "occupancy_rate": 72.5,
      "occupancy_trend": "+5%"
    },
    "daily_trend": [
      { "date": "2024-01-01", "sessions": 25, "hours": 95 },
      // ... 30 days of data
    ],
    "hourly_distribution": [
      { "hour": 8, "sessions": 145 },
      // ... 24 hours
    ],
    "top_students_by_hours": [
      {
        "rank": 1,
        "student_name": "Juan Santos",
        "student_id": 1,
        "total_hours": 125.5,
        "session_count": 42
      },
      // ... top 5
    ],
    "top_students_by_activity": [
      {
        "rank": 1,
        "student_name": "Maria Garcia",
        "student_id": 2,
        "session_count": 42,
        "total_hours": 98.5
      },
      // ... top 5
    ],
    "lab_utilization": [
      {
        "lab_id": 1,
        "lab_name": "Lab A",
        "utilization_percent": 85,
        "total_sessions": 450,
        "avg_pcs_in_use": 12.5
      },
      // ... all labs
    ],
    "duration_distribution": {
      "min": 15,
      "max": 480,
      "median": 140,
      "q1": 90,
      "q3": 210
    }
  }
}

// Get trending/engagement score
GET /server/actions/adminGetEngagementScore.php

Response:
{
  "success": true,
  "data": [
    {
      "student_id": 1,
      "student_name": "Juan Santos",
      "engagement_score": 92.5,
      "rank": 1,
      "components": {
        "frequency_score": 95,
        "duration_score": 90,
        "consistency_score": 88
      }
    }
  ]
}
```

### React Component Structure

```jsx
AnalyticsDashboard.jsx (Main)
├── DateRangeSelector.jsx
├── KPICards.jsx
│   ├── KPICard.jsx (Reusable)
│   ├── KPICard.jsx
│   ├── KPICard.jsx
│   └── KPICard.jsx
├── UsageTrends.jsx
│   ├── DailyTrendChart.jsx (Line chart)
│   └── HourlyDistributionChart.jsx (Bar chart)
├── TopPerformers.jsx
│   ├── TopByHoursTable.jsx
│   └── TopByActivityTable.jsx
├── LabEfficiency.jsx
│   ├── LabUtilizationChart.jsx (Horizontal bar)
│   └── PCAvailabilityChart.jsx (Donut)
└── LoadingOverlay.jsx
```

### Chart Libraries to Use

- **Recharts**: Modern React charting library
- **Chart.js**: Alternative with good documentation
- **D3.js**: For complex custom visualizations

---

## 4. Software App - Import/Upload

### Purpose
Interface for administrators to upload and manage software details available in different labs.

### Page Layout

#### Tab 1: Single Software Entry

```
┌────────────────────────────────────────────────────────┐
│ Software Management                                    │
├────────┬──────────────┬──────────────┬────────────────┤
│ Single │ Bulk Upload  │ Manage       │ Reports        │
│ Entry  │              │ Software     │                │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Add New Software:                                      │
│                                                        │
│ Software Name:*                                        │
│ [Visual Studio                            ]            │
│                                                        │
│ Version:*                                              │
│ [2022 v17.4                               ]            │
│                                                        │
│ Category:*                                             │
│ [IDE ▼]   (IDE / Database / Office / Tools / Dev)     │
│                                                        │
│ License Type:                                          │
│ [Proprietary ▼] (Proprietary / Open Source / Edu)     │
│                                                        │
│ Description:                                           │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Full-featured integrated development environment │  │
│ │ for .NET and C++ development                     │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ Assign to Labs:*                                       │
│ ☑ Lab A (Ground Floor)                               │
│ ☑ Lab B (First Floor)                                │
│ ☐ Lab C (Second Floor)                               │
│                                                        │
│ Status:                                                │
│ ⭕ Active  ⭕ Inactive  ⭕ Deprecated                  │
│                                                        │
│ [Upload Logo/Icon] [  ]                               │
│                                                        │
│ [Cancel] [Save Software]                              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Tab 2: Bulk Upload

```
┌────────────────────────────────────────────────────────┐
│ Bulk Upload Software                                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Import Software via CSV/Excel                          │
│                                                        │
│ ┌─ File Upload ─────────────────────────────────────┐ │
│ │ Drag & Drop files here or click to browse        │ │
│ │                                                   │ │
│ │ [Browse Files]  Supported: .csv, .xlsx           │ │
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│ [Download Template] (Download CSV template)           │
│                                                        │
│ CSV Column Requirements:                               │
│ 1. name (required) - Software name                    │
│ 2. version (required) - Version number                │
│ 3. category (required) - IDE/Database/etc.            │
│ 4. labs (required) - Comma-separated lab IDs          │
│ 5. license_type (optional) - License type             │
│ 6. description (optional) - Description               │
│ 7. status (optional) - active/inactive/deprecated     │
│                                                        │
│ [Next: Preview]                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Tab 2: Preview Before Import

```
┌────────────────────────────────────────────────────────┐
│ Preview Import                                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Ready to import 15 software items                      │
│                                                        │
│ Validation Results: ✓ All rows valid                  │
│                                                        │
│ Preview (First 5 of 15):                              │
│                                                        │
│ Name     │Version│Category│Labs    │License  │Status  │
│Visual... │2022  │IDE     │Lab A   │Propriet │Active  │
│SQL Ser..│2022  │DB     │Lab A,B │Propriet │Active  │
│Python  │3.10  │Tools  │All     │Open Src │Active  │
│NetBeans│12.6  │IDE    │Lab C   │Open Src │Active  │
│Office  │2021  │Office │All     │Propriet │Active  │
│                                                        │
│ [Back] [Cancel] [Import All]                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Tab 3: Manage Software

```
┌────────────────────────────────────────────────────────┐
│ Manage Software                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Filters: [Category ▼] [Status ▼] [Lab ▼]             │
│ Search: [          ] [🔍]                             │
│ Total: 45 software items | [Add New] [Import/Upload] │
│                                                        │
├────────────────────────────────────────────────────────┤
│Name      │Ver  │Cat │Labs    │License  │Status  │Act  │
├────────────────────────────────────────────────────────┤
│Visual S..│2022 │IDE │A, B    │Propr.   │Active  │[✎][✗]│
│SQL Server│2022 │DB │A, B, C │Propr.   │Active  │[✎][✗]│
│Python   │3.10 │Tool│All     │Open Src │Active  │[✎][✗]│
│NetBeans │12.6 │IDE │C       │Open Src │Inact.  │[✎][✗]│
│Office   │2021 │Off │All     │Propr.   │Depr.   │[✎][✗]│
│                                                        │
│ Showing 1-10 of 45                                     │
│ [◀ Prev] [1] [2] [3] [Next ▶]                        │
│                                                        │
└────────────────────────────────────────────────────────┘

Actions:
[✎] = Edit
[✗] = Delete
```

### Features

#### Single Software Entry

1. **Form Fields**:
   - Software name (required)
   - Version (required)
   - Category (required, dropdown)
   - License type (optional, dropdown)
   - Description (optional, textarea)
   - Lab assignment (required, multi-select checkboxes)
   - Status (radio: Active, Inactive, Deprecated)
   - Logo/Icon upload (optional)

2. **Validation**:
   - Software name must be unique
   - Version format validation
   - At least one lab must be selected
   - All required fields must be filled
   - File size limit for logo (5MB)
   - Logo file type: jpg, png, gif

3. **Success/Error Messages**:
   - "Software added successfully"
   - "Software name already exists"
   - "Please select at least one lab"

#### Bulk Upload

1. **File Upload**:
   - Drag & drop area
   - Browse button
   - Supported formats: CSV, Excel (.xlsx)

2. **Template Download**:
   - Provide CSV template with correct columns
   - Pre-filled example rows

3. **Validation Before Import**:
   - Check all required columns present
   - Check for duplicate names
   - Validate lab IDs exist
   - Validate category values
   - Show validation errors/warnings

4. **Preview**:
   - Display first N rows (5-10)
   - Show total count
   - Allow review before final import
   - Option to go back and fix file

5. **Import Process**:
   - Batch insert to database
   - Show progress indicator
   - Display success count and any errors
   - Rollback on critical error

#### Manage Software

1. **Table Display**:
   - All software in searchable, sortable table
   - Columns: Name, Version, Category, Labs, License, Status, Actions
   - Pagination (10, 25, 50 rows)

2. **Search & Filter**:
   - Search by name (realtime)
   - Filter by category
   - Filter by status
   - Filter by lab

3. **Bulk Operations**:
   - Select multiple software
   - Delete multiple at once
   - Change status for multiple

4. **Individual Operations**:
   - Click row to edit
   - Edit button
   - Delete button with confirmation
   - View details modal

5. **Lab Assignment Management**:
   - Edit which labs have this software
   - Easy toggle assignment
   - View assignment summary

### Backend Requirements

#### API Endpoints

```php
// Get all software (for display/management)
GET /server/actions/adminGetSoftware.php

Parameters:
  - category (optional)
  - status (optional)
  - lab_id (optional)
  - search (optional)
  - page (default: 1)
  - per_page (default: 10)

Response:
{
  "success": true,
  "data": {
    "software": [
      {
        "software_id": 1,
        "name": "Visual Studio",
        "version": "2022",
        "category": "IDE",
        "license_type": "Proprietary",
        "description": "...",
        "status": "active",
        "labs": [1, 2],
        "logo_path": "/images/software/vs.png",
        "created_at": "2024-01-15",
        "updated_at": "2024-02-10"
      }
    ],
    "total_count": 45
  }
}

// Create software
POST /server/actions/adminCreateSoftware.php

Body:
{
  "name": "Visual Studio",
  "version": "2022",
  "category": "IDE",
  "license_type": "Proprietary",
  "description": "...",
  "lab_ids": [1, 2],
  "status": "active",
  "logo_file": (file upload)
}

Response:
{
  "success": true,
  "message": "Software created successfully",
  "software_id": 1
}

// Update software
PUT /server/actions/adminUpdateSoftware.php

Body:
{
  "software_id": 1,
  "name": "Visual Studio",
  "version": "2023",
  // ... other fields
}

// Delete software
DELETE /server/actions/adminDeleteSoftware.php

Parameters:
  - software_id

Response:
{
  "success": true,
  "message": "Software deleted"
}

// Bulk import
POST /server/actions/adminBulkImportSoftware.php

Body: (multipart/form-data)
  - file: CSV/Excel file

Response:
{
  "success": true,
  "message": "Import successful",
  "imported_count": 15,
  "failed_count": 0,
  "errors": []
}

// Validate import
POST /server/actions/adminValidateSoftwareImport.php

Body: (multipart/form-data)
  - file: CSV/Excel file

Response:
{
  "success": true,
  "valid": true,
  "total_records": 15,
  "preview": [
    // First 5 records
  ],
  "errors": []
}
```

#### Database Schema

```sql
CREATE TABLE software (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  version VARCHAR(50) NOT NULL,
  category ENUM('IDE', 'Database', 'Office', 'Tools', 'Development', 'Other') NOT NULL,
  license_type ENUM('Proprietary', 'Open Source', 'Educational', 'Freeware', 'Other') DEFAULT 'Proprietary',
  description TEXT,
  logo_path VARCHAR(255),
  status ENUM('active', 'inactive', 'deprecated') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

CREATE TABLE software_labs (
  software_id INT,
  lab_id INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (software_id, lab_id),
  FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
);
```

### React Component Structure

```jsx
SoftwareManagement.jsx (Main)
├── Tabs.jsx (Navigation)
├── SingleEntryTab.jsx
│   ├── SoftwareForm.jsx
│   └── Validation messages
├── BulkUploadTab.jsx
│   ├── FileUploadArea.jsx
│   ├── TemplateDownload.jsx
│   ├── PreviewTable.jsx
│   └── ImportProgress.jsx
├── ManageSoftwareTab.jsx
│   ├── SearchFilter.jsx
│   ├── SoftwareTable.jsx
│   └── Pagination.jsx
└── LoadingOverlay.jsx
```

### CSV Template Example

```csv
name,version,category,labs,license_type,description,status
Visual Studio,2022,IDE,"1,2",Proprietary,Full-featured IDE for .NET development,active
SQL Server,2022,Database,"1,2,3",Proprietary,Enterprise database management system,active
Python,3.10,Tools,1,Open Source,Programming language interpreter,active
NetBeans,12.6,IDE,3,Open Source,Free and open-source IDE,active
Microsoft Office,2021,Office,"1,2,3",Proprietary,Productivity suite,deprecated
Postman,10.0,Tools,"1,2",Freeware,API testing and development tool,active
Git,2.40,Tools,1,Open Source,Version control system,active
Docker,4.8,Tools,2,Open Source,Container platform,active
Node.js,18.0,Development,2,Open Source,JavaScript runtime,active
Maven,3.9,Tools,"2,3",Open Source,Build automation tool for Java,active
```

---

## Additional Considerations

### Development Priority

1. **High**: Generate Reports, Reservation Management (Admin)
2. **Medium**: Software Management, Analytics
3. **Lower**: Additional analytics features

### Database Relationships

Ensure these tables exist and are properly related:
- `students` - Student information
- `admin_users` - Admin accounts
- `labs` - Lab information
- `sessions` - Session records
- `reservations` - Reservation data
- `software` - Software catalog
- `software_labs` - Junction table for software-lab assignments

### Security Considerations

- Validate all file uploads (CSV, Excel, Logo images)
- Prevent SQL injection in all queries
- Authenticate admin access to these pages
- Log all admin actions (create, delete, approve/decline)
- Validate file sizes (logos: 5MB max, imports: 10MB max)
- Sanitize user inputs

### Performance Optimization

- Paginate large result sets (Reports, Logs, Software)
- Index frequently searched columns (Name, Date, Student ID)
- Cache analytics data (recalculate hourly/daily)
- Use background jobs for bulk imports and report generation
- Lazy load charts and large data tables

### Testing Requirements

- Unit tests for data validation
- Integration tests for API endpoints
- UI/UX testing for all new pages
- Performance testing for large datasets
- Security testing for file uploads

