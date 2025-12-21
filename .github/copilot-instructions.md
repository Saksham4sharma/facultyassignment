# Next.js Examination Timetable and Seating Plan Management System

## Project Overview
A Next.js application for managing examination timetables and seating arrangements with day-wise subject scheduling and room-wise student allocation.

## Key Features
- **Dual Excel Upload**: Separate uploads for timetable and seating plan files
- **Smart Parsing**: Extracts and merges data from both Excel files
- **Automatic Generation**: Creates final seating plan by combining timetable dates with room allocations
- **Manual Entry**: Alternative form-based input option
- **Print/Export**: Professional output format for printing

## Progress
- ✅ Created Next.js project structure
- ✅ Configured ES6 and Next.js
- ✅ Built timetable management features
- ✅ Implemented seating plan visualization
- ✅ Added xlsx library for Excel parsing
- ✅ Created dual file upload system (timetable + seating plan)
- ✅ Implemented separate parsers for each file type
- ✅ Built data merging logic for final output generation

## Setup Instructions
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Access application at http://localhost:3000

## Usage
1. Upload timetable Excel file (subjects with scheduled dates)
2. Upload seating plan Excel file (room numbers with student counts)
3. System automatically merges data and generates output sheet
