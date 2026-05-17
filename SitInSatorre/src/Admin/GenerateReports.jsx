import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import LoadingScreen from '../components/LoadingScreen'

const Ico = ({ d, d2, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)

const IcoFileText = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
const IcoFileExcel = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
const IcoDownload = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
const IcoPrinter  = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
const IcoCalendar = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
const IcoFilter   = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
const IcoRefresh  = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.5-5.2M20 15a9 9 0 01-14.5 5.2" />

function Avatar({ student, size = 'md' }) {
  const [imgError, setImgError] = useState(false)
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg text-[0.6rem]',
    md: 'w-9 h-9 rounded-xl text-xs',
    lg: 'w-10 h-10 rounded-xl text-sm',
  }
  const initials = `${student?.first_name?.[0] ?? ''}${student?.last_name?.[0] ?? ''}`
  const hasPic = student?.profile_picture && !imgError
  if (hasPic) {
    return (
      <img
        src={student.profile_picture}
        alt={`${student.first_name} ${student.last_name}`}
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} object-cover flex-shrink-0 border-2 border-white shadow-sm`}
      />
    )
  }
  return (
    <div className={`${sizeClasses[size]} bg-[#3c096c] flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-black">{initials}</span>
    </div>
  )
}

export default function GenerateReports() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')

  // Filter States
  const [dateRange, setDateRange] = useState('month') // today, week, month, custom
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedLab, setSelectedLab] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedPurpose, setSelectedPurpose] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const printAreaRef = useRef(null)

  const load = async () => {
    try {
      const list = await authService.adminSitInRecords()
      setRecords(list)
    } catch (err) {
      setError(err.message || 'Failed to load records for report generation')
    }
  }

  useEffect(() => {
    const u = authService.getUser?.() || null
    if (!u || u.role !== 'admin') { navigate('/login'); return }
    ;(async () => {
      try {
        setLoading(true)
        await load()
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate])

  // Get unique lists for filters
  const labsList = useMemo(() => {
    const labs = new Set(records.map(r => r.room).filter(Boolean))
    return ['all', ...Array.from(labs).sort()]
  }, [records])

  const coursesList = useMemo(() => {
    const courses = new Set(records.map(r => r.course).filter(Boolean))
    return ['all', ...Array.from(courses).sort()]
  }, [records])

  const purposesList = useMemo(() => {
    const purposes = new Set(records.map(r => r.purpose).filter(Boolean))
    return ['all', ...Array.from(purposes).sort()]
  }, [records])

  // Apply filters
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Date filter
      const recordDate = new Date(r.started_at)
      const recordDateStr = r.started_at.split(' ')[0] // "YYYY-MM-DD"
      
      let dateMatch = true
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dateRange === 'today') {
        const dStr = today.toISOString().split('T')[0]
        dateMatch = recordDateStr === dStr
      } else if (dateRange === 'week') {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        dateMatch = recordDate >= oneWeekAgo
      } else if (dateRange === 'month') {
        const oneMonthAgo = new Date()
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
        dateMatch = recordDate >= oneMonthAgo
      } else if (dateRange === 'custom') {
        if (startDate) {
          const sDate = new Date(startDate)
          sDate.setHours(0, 0, 0, 0)
          dateMatch = dateMatch && recordDate >= sDate
        }
        if (endDate) {
          const eDate = new Date(endDate)
          eDate.setHours(23, 59, 59, 999)
          dateMatch = dateMatch && recordDate <= eDate
        }
      }

      // 2. Lab filter
      const labMatch = selectedLab === 'all' || r.room === selectedLab

      // 3. Course filter
      const courseMatch = selectedCourse === 'all' || r.course === selectedCourse

      // 4. Purpose filter
      const purposeMatch = selectedPurpose === 'all' || r.purpose === selectedPurpose

      // 5. Text search
      const q = searchQuery.toLowerCase().trim()
      const searchMatch = !q || 
        `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase().includes(q) ||
        String(r.student_id_number || '').toLowerCase().includes(q) ||
        String(r.pc_number || '').toLowerCase().includes(q)

      return dateMatch && labMatch && courseMatch && purposeMatch && searchMatch
    })
  }, [records, dateRange, startDate, endDate, selectedLab, selectedCourse, selectedPurpose, searchQuery])

  // Pagination States & Calculations
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const totalPages = useMemo(() => {
    return Math.ceil(filteredRecords.length / itemsPerPage) || 1
  }, [filteredRecords, itemsPerPage])

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRecords, currentPage, itemsPerPage])

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange, startDate, endDate, selectedLab, selectedCourse, selectedPurpose, searchQuery])

  // Analytics aggregations
  const stats = useMemo(() => {
    const total = filteredRecords.length
    let totalDuration = 0
    const labCounts = {}
    const courseCounts = {}
    const purposeCounts = {}

    filteredRecords.forEach(r => {
      totalDuration += Number(r.duration_minutes || 0)
      if (r.room) labCounts[r.room] = (labCounts[r.room] || 0) + 1
      if (r.course) courseCounts[r.course] = (courseCounts[r.course] || 0) + 1
      if (r.purpose) purposeCounts[r.purpose] = (purposeCounts[r.purpose] || 0) + 1
    })

    // Find top lab
    let topLab = 'N/A'
    let maxLabCount = 0
    Object.entries(labCounts).forEach(([lab, count]) => {
      if (count > maxLabCount) {
        maxLabCount = count
        topLab = lab
      }
    })

    // Find top purpose
    let topPurpose = 'N/A'
    let maxPurposeCount = 0
    Object.entries(purposeCounts).forEach(([p, count]) => {
      if (count > maxPurposeCount) {
        maxPurposeCount = count
        topPurpose = p
      }
    })

    return {
      total,
      avgDuration: total > 0 ? Math.round(totalDuration / total) : 0,
      totalHours: Math.round(totalDuration / 60),
      topLab,
      topPurpose,
      labCounts,
      courseCounts,
      purposeCounts
    }
  }, [filteredRecords])

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return

    const headers = ['Record ID', 'Session ID', 'Student ID', 'First Name', 'Last Name', 'Course', 'Year Level', 'Room', 'PC No.', 'Purpose', 'Started At', 'Ended At', 'Duration (min)', 'Ended By']
    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      r.session_id,
      `"${r.student_id_number}"`,
      `"${r.first_name || ''}"`,
      `"${r.last_name || ''}"`,
      `"${r.course || ''}"`,
      r.year_level || '',
      `"${r.room || ''}"`,
      `"${r.pc_number || ''}"`,
      `"${r.purpose || ''}"`,
      `" ${r.started_at}"`, // Prepended space forces Excel to treat it as a text string instead of a narrow date format
      `" ${r.ended_at}"`,   // Prepended space forces Excel to treat it as a text string instead of a narrow date format
      r.duration_minutes,
      `"${r.ended_by || 'Admin'}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    const dateStr = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `SitIn_Report_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to Excel (Native highly-compatible XML/HTML Spreadsheet format)
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) return

    const headers = ['Record ID', 'Session ID', 'Student ID', 'First Name', 'Last Name', 'Course', 'Year Level', 'Room', 'PC No.', 'Purpose', 'Started At', 'Ended At', 'Duration (min)', 'Ended By']
    
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">'
    html += '<head><meta charset="utf-8"/><style>'
    html += 'table { border-collapse: collapse; width: 100%; }'
    html += 'th { background-color: #3c096c; color: #ffffff; font-weight: bold; border: 1.5px solid #dddddd; padding: 8px; text-align: left; }'
    html += 'td { border: 1px solid #dddddd; padding: 8px; text-align: left; }'
    html += '.text { mso-number-format:"\\@"; }' // Forces text formatting in excel for PC/Student IDs
    html += '</style></head><body><table><thead><tr>'
    headers.forEach(h => {
      html += `<th>${h}</th>`
    })
    html += '</tr></thead><tbody>'

    filteredRecords.forEach((r, idx) => {
      html += '<tr>'
      html += `<td>${idx + 1}</td>`
      html += `<td>${r.session_id}</td>`
      html += `<td class="text">${r.student_id_number}</td>`
      html += `<td>${r.first_name || ''}</td>`
      html += `<td>${r.last_name || ''}</td>`
      html += `<td>${r.course || ''}</td>`
      html += `<td>${r.year_level || ''}</td>`
      html += `<td>${r.room || ''}</td>`
      html += `<td class="text">${r.pc_number || ''}</td>`
      html += `<td>${r.purpose || ''}</td>`
      html += `<td class="text">${r.started_at}</td>`
      html += `<td class="text">${r.ended_at}</td>`
      html += `<td>${r.duration_minutes}</td>`
      html += `<td>${r.ended_by || 'Admin'}</td>`
      html += '</tr>'
    })
    html += '</tbody></table></body></html>'

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().split('T')[0]
    link.download = `SitIn_Report_${dateStr}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }



  if (loading) return <LoadingScreen message="Compiling reports data..." />

  return (
    <div className="py-6 px-2 min-h-auto">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide Navbar, floating togglers, filters, and other interactive tools */
          nav, .no-print, button, select, input, .floating-theme-toggle {
            display: none !important;
          }
          
          /* Remove screen layout constraints */
          body, main, #root {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Force standard spreadsheet table borders and cell backgrounds */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 10px !important;
          }
          th, td {
            border: 1px solid #999999 !important;
            padding: 6px 8px !important;
            font-size: 10px !important;
            text-align: left !important;
            color: #000000 !important;
            background: transparent !important;
          }
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}} />
      <div className="max-w-[95rem] mx-auto flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between no-print">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/40 dark:text-[#c77dff]/60 mb-1">Reports / Analytics</p>
            <h1 className="text-4xl font-black text-[#1a0030] dark:text-white tracking-tight">Generate Reports</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-150 shadow-sm text-xs font-bold text-gray-700 hover:border-[#3c096c]/30 hover:text-[#3c096c] transition-all disabled:opacity-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:text-white"
            >
              <IcoDownload cls="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff9100] text-white shadow-md shadow-[#ff9100]/25 hover:bg-orange-400 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              <IcoFileExcel cls="w-3.5 h-3.5" />
              Export Excel
            </button>
          </div>
        </div>

        {/* ── Print Header (Hidden on screen) ── */}
        <div className="hidden print:block mb-8 no-print">
          <div className="border-b-2 border-gray-300 pb-4 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">Sit-in Activity Report</h1>
              <p className="text-xs text-gray-500 font-semibold mt-1">Generated on {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right text-xs text-gray-500 font-semibold">
              <p>Filter Settings:</p>
              <p className="capitalize">Range: {dateRange} ({dateRange === 'custom' ? `${startDate} to ${endDate}` : 'automatic'})</p>
              <p>Lab: {selectedLab} | Course: {selectedCourse}</p>
            </div>
          </div>
        </div>

        {/* ── Filters Grid ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 no-print dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-zinc-800">
            <IcoFilter cls="w-4 h-4 text-[#ff9100]" />
            <h2 className="text-sm font-black text-[#1a0030] dark:text-white uppercase tracking-wider">Report Filters</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* Date Range Option */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-black uppercase text-gray-400 tracking-widest">Timeframe</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50/50 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              >
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Lab/Room Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-black uppercase text-gray-400 tracking-widest">Lab / Room</label>
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50/50 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              >
                {labsList.map(lab => (
                  <option key={lab} value={lab}>{lab === 'all' ? 'All Labs' : lab}</option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-black uppercase text-gray-400 tracking-widest">Student Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50/50 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              >
                {coursesList.map(course => (
                  <option key={course} value={course}>{course === 'all' ? 'All Courses' : course}</option>
                ))}
              </select>
            </div>

            {/* Purpose Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-black uppercase text-gray-400 tracking-widest">Purpose</label>
              <select
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50/50 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              >
                {purposesList.map(p => (
                  <option key={p} value={p}>{p === 'all' ? 'All Purposes' : p}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-black uppercase text-gray-400 tracking-widest">Search</label>
              <input
                type="text"
                placeholder="Student ID, Name, PC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50/50 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              />
            </div>

          </div>

          {/* Custom Date Pickers */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-50 pt-3 dark:border-zinc-800/40">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.62rem] font-bold uppercase text-gray-400 tracking-wider">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.62rem] font-bold uppercase text-gray-400 tracking-wider">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Key Metrics Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          
          {/* Card 1: Total Sit-ins */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300 flex items-center justify-between dark:bg-zinc-900 dark:border-zinc-800">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-wider text-gray-400 mb-1">Total Sit-ins</p>
              <h3 className="text-3xl font-black text-[#1a0030] dark:text-white tracking-tight">{stats.total}</h3>
              <p className="text-[0.62rem] text-[#ff9100] font-black uppercase tracking-widest mt-1">Within timeframe</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#ff9100]/10 flex items-center justify-center text-[#ff9100]">
              <IcoFileText cls="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Busiest Lab */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300 flex items-center justify-between dark:bg-zinc-900 dark:border-zinc-800">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-wider text-gray-400 mb-1">Busiest Room</p>
              <h3 className="text-xl font-black text-[#3c096c] dark:text-[#c77dff] truncate max-w-[150px]">{stats.topLab}</h3>
              <p className="text-[0.62rem] text-purple-400 font-black uppercase tracking-widest mt-1">Most frequented lab</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#3c096c]/10 flex items-center justify-center text-[#3c096c] dark:bg-zinc-800 dark:text-zinc-200">
              <span className="font-bold text-xs">LAB</span>
            </div>
          </div>

          {/* Card 3: Average Duration */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300 flex items-center justify-between dark:bg-zinc-900 dark:border-zinc-800">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-wider text-gray-400 mb-1">Average Time</p>
              <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{stats.avgDuration} <span className="text-sm font-semibold text-gray-400">min</span></h3>
              <p className="text-[0.62rem] text-indigo-400 font-black uppercase tracking-widest mt-1">Per active session</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 dark:bg-zinc-800 dark:text-indigo-300">
              <IcoCalendar cls="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Top Purpose */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300 flex items-center justify-between dark:bg-zinc-900 dark:border-zinc-800">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-wider text-gray-400 mb-1">Top Purpose</p>
              <h3 className="text-base font-black text-green-600 dark:text-green-400 truncate max-w-[150px]" title={stats.topPurpose}>{stats.topPurpose}</h3>
              <p className="text-[0.62rem] text-green-400 font-black uppercase tracking-widest mt-1">Primary study reason</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 dark:bg-zinc-800 dark:text-green-300">
              <span className="font-bold text-xs">GOAL</span>
            </div>
          </div>

        </div>

        {/* ── Visual Analytics (Charts & Graphs Section) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
          
          {/* Lab Activity Chart */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-sm font-black text-[#1a0030] dark:text-white uppercase tracking-wider mb-4 border-b border-gray-50 pb-2 dark:border-zinc-800/40">Lab Popularity Breakdown</h3>
            <div className="flex flex-col gap-3">
              {Object.keys(stats.labCounts).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No data available for this range</p>
              ) : (
                Object.entries(stats.labCounts).map(([lab, count]) => {
                  const percent = Math.round((count / stats.total) * 100)
                  return (
                    <div key={lab} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        <span>{lab}</span>
                        <span>{count} session{count !== 1 ? 's' : ''} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden dark:bg-zinc-800">
                        <div
                          className="bg-[#ff9100] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Course Activity Chart */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-sm font-black text-[#1a0030] dark:text-white uppercase tracking-wider mb-4 border-b border-gray-50 pb-2 dark:border-zinc-800/40">Active Courses Breakdown</h3>
            <div className="flex flex-col gap-3">
              {Object.keys(stats.courseCounts).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No data available for this range</p>
              ) : (
                Object.entries(stats.courseCounts).map(([course, count]) => {
                  const percent = Math.round((count / stats.total) * 100)
                  return (
                    <div key={course} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        <span>{course}</span>
                        <span>{count} student{count !== 1 ? 's' : ''} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden dark:bg-zinc-800">
                        <div
                          className="bg-[#3c096c] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

        {/* ── Report Table Grid ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 no-print">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center no-print dark:bg-zinc-800/40 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff9100] animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest text-[#1a0030] dark:text-white">Report Preview ({filteredRecords.length} records)</p>
            </div>
            <span className="text-[0.62rem] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Page view only</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-sm">
              <thead>
                <tr>
                  {['No.', 'Student', 'Course / Year', 'Room', 'PC No.', 'Purpose', 'Started At', 'Ended At', 'Duration', 'Ended By'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400 bg-gray-50 border-b border-gray-100 whitespace-nowrap dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-gray-400 dark:text-zinc-500">
                      No matching records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      
                      {/* No. */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40">
                        <span className="text-xs font-black text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2.5 py-1 rounded-full dark:text-[#c77dff] dark:bg-[#c77dff]/10">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </span>
                      </td>

                      {/* Student */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40">
                        <div className="flex items-center gap-3">
                          <Avatar student={r} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-700 truncate dark:text-zinc-300">
                              {`${r.first_name || ''} ${r.last_name || ''}`.trim()}
                            </p>
                            <p className="text-[0.68rem] font-mono text-gray-400 truncate dark:text-zinc-500">
                              {r.student_id_number}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Course / Year */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40 text-xs text-gray-500 dark:text-zinc-400 font-semibold">
                        {r.course} - Year {r.year_level}
                      </td>

                      {/* Room */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40">
                        {r.room
                          ? <span className="text-xs font-bold text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2 py-0.5 rounded-full dark:text-[#c77dff] dark:bg-[#c77dff]/10">{r.room}</span>
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </td>

                      {/* PC No */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40">
                        {r.pc_number ? (
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-150 text-xs font-semibold dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                            {r.pc_number.replace('PC-', '')}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-semibold">—</span>
                        )}
                      </td>

                      {/* Purpose */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40 text-xs text-gray-500 dark:text-zinc-400 max-w-[150px] truncate">
                        {r.purpose || '—'}
                      </td>

                      {/* Started At */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(r.started_at).toLocaleString()}
                      </td>

                      {/* Ended At */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(r.ended_at).toLocaleString()}
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40">
                        <span className="text-xs font-black text-[#ff9100] bg-[#ff9100]/08 border border-[#ff9100]/20 px-2.5 py-1 rounded-full dark:text-[#ff9100] dark:bg-[#ff9100]/10">
                          {r.duration_minutes} min
                        </span>
                      </td>

                      {/* Ended By */}
                      <td className="px-5 py-3.5 border-b border-gray-50 dark:border-zinc-800/40">
                        <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 capitalize">
                          {r.ended_by || 'Admin'}
                        </span>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center no-print dark:bg-zinc-800/40 dark:border-zinc-800">
              <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                Showing <span className="font-bold text-gray-700 dark:text-zinc-200">{Math.min(filteredRecords.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="font-bold text-gray-700 dark:text-zinc-200">{Math.min(filteredRecords.length, currentPage * itemsPerPage)}</span> of <span className="font-bold text-gray-700 dark:text-zinc-200">{filteredRecords.length}</span> records
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Previous
                </button>
                <span className="px-3.5 py-1.5 text-xs font-bold text-gray-600 dark:text-zinc-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Print-Only Excel-Style Table ── */}
        <table className="hidden print:table w-full border-collapse text-[10px] border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">No.</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Session ID</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Student ID</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">First Name</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Last Name</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Course</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Year Level</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Room</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">PC No.</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Purpose</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Started At</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Ended At</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Duration (min)</th>
              <th className="border border-gray-300 px-2 py-1 font-bold text-black">Ended By</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={14} className="border border-gray-300 px-2 py-4 text-center text-gray-500">
                  No matching records found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r, idx) => (
                <tr key={r.id} className="border-b border-gray-200">
                  <td className="border border-gray-300 px-2 py-1 text-center font-bold text-black">{idx + 1}</td>
                  <td className="border border-gray-300 px-2 py-1 text-black">{r.session_id}</td>
                  <td className="border border-gray-300 px-2 py-1 text-black font-mono">{r.student_id_number}</td>
                  <td className="border border-gray-300 px-2 py-1 text-black">{r.first_name || ''}</td>
                  <td className="border border-gray-300 px-2 py-1 text-black">{r.last_name || ''}</td>
                  <td className="border border-gray-300 px-2 py-1 text-black">{r.course || ''}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center text-black">{r.year_level || ''}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center text-black">{r.room || ''}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center text-black">{r.pc_number || ''}</td>
                  <td className="border border-gray-300 px-2 py-1 text-black">{r.purpose || ''}</td>
                  <td className="border border-gray-300 px-2 py-1 text-black whitespace-nowrap">{r.started_at}</td>
                  <td className="border border-gray-300 px-2 py-1 text-black whitespace-nowrap">{r.ended_at}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center text-black font-bold">{r.duration_minutes}</td>
                  <td className="border border-gray-300 px-2 py-1 text-black capitalize">{r.ended_by || 'Admin'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
    </div>
  )
}
