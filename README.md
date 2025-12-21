# Examination Timetable & Seating Plan Management System

A Next.js web application for managing examination timetables and generating seating plans with day-wise subject scheduling and room-wise student allocation.

## Features

## Features

- **Excel File Upload**: Upload existing timetable Excel files (.xlsx, .xls) for automatic processing
- **Intelligent Parsing**: Automatically extracts subjects, dates, rooms, and student counts from Excel
- **Manual Data Entry**: Alternative form-based input for creating timetables from scratch
- **Timetable Input**: Easy-to-use form for entering exam details, subjects, dates, and room allocations
- **Dynamic Data Entry**: Add multiple subjects, schedule slots, and rooms as needed
- **Seating Plan Generation**: Automatically generates a formatted seating plan from timetable data
- **Day-wise Organization**: Displays which subjects are scheduled on which dates
- **Room-wise Allocation**: Shows student count for each room and subject
- **Print/PDF Export**: Print-friendly layout for physical distribution
- **Professional Layout**: Mimics traditional examination seating plan sheets

## Technology Stack

- **Framework**: Next.js 14
- **Language**: JavaScript (ES6)
- **Excel Processing**: xlsx library
- **Styling**: CSS3
- **Runtime**: Node.js

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd "teacher assignment"
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Method 1: Upload Excel Files (Recommended)

1. **Click "Upload Excel" tab** at the top of the page

2. **Upload Timetable File**:
   - Click "Choose Timetable File" button
   - Select your timetable Excel file (.xlsx or .xls)
   - This file should contain subjects and their scheduled dates

3. **Upload Seating Plan File**:
   - Click "Choose Seating Plan File" button
   - Select your seating plan Excel file (.xlsx or .xls)
   - This file should contain room numbers and student allocations

4. The system will automatically merge both files and generate the final seating plan

**Timetable File Format:**
- First column: Subject codes and names
- Subsequent columns: Dates or date codes when each subject is scheduled
- Example: IM-711MA Consumer Behavior with dates in columns

**Seating Plan File Format:**
- First column: Subject codes and names (matching timetable)
- Header row: Room numbers (101, 102, 103, etc.)
- Data cells: Number of students in each room for each subject

### Method 2: Manual Entry

1. **Click "Manual Entry" tab**

### Entering Timetable Data

1. **Exam Details**: 
   - Enter the exam title (e.g., "End Semester Examination")
   - Add university/institute name
   - Specify the date range

2. **Adding Subjects**:
   - Enter subject code (e.g., IM-711MA)
   - Enter subject name (e.g., Consumer Behavior)
   - Click "Add Subject" to add more subjects

3. **Schedule Slots**:
   - For each subject, add schedule slots
   - Enter the date or date code (e.g., 201, 202)
   - Add room numbers and student counts for each slot
   - Click "Add Schedule Slot" for multiple dates

4. **Generate Plan**:
   - Click "Generate Seating Plan" to create the output
   - The system will organize data by date and room

### Viewing and Printing

- The generated seating plan displays in a table format
- **Date Selector**: Use the dropdown to view seating plans for:
  - **All Dates**: Shows the complete schedule across all exam dates
  - **Specific Date**: Select any date to view only that day's seating arrangement
- Each row shows a subject with student counts across different rooms and dates
- Total students per room per date are calculated at the bottom
- Click "Print / Save as PDF" to export the seating plan
- The date selector is automatically hidden when printing

## Project Structure

```
teacher assignment/
├── .github/
│   └── copilot-instructions.md
├── components/
│   ├── ExcelUpload.js          # Excel file upload and parsing
│   ├── TimetableInput.js       # Form for entering timetable data
│   └── SeatingPlanOutput.js    # Display component for seating plan
├── pages/
│   ├── _app.js                 # Next.js app wrapper
│   ├── _document.js            # HTML document structure
│   └── index.js                # Main page component
├── styles/
│   └── globals.css             # Global styles
├── .gitignore
├── jsconfig.json               # JavaScript configuration (ES6)
├── next.config.js              # Next.js configuration
├── package.json                # Project dependencies
└── README.md                   # This file
```

## Building for Production

```bash
npm run build
npm start
```

## Customization

### Styling
- Modify `styles/globals.css` to change colors, fonts, and layout
- Print styles are defined in the `@media print` section

### Data Processing
- Edit `processSeatingPlan()` function in `pages/index.js` to customize data transformation logic
- Modify table generation logic in `components/SeatingPlanOutput.js` for different layouts

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please create an issue in the repository.
