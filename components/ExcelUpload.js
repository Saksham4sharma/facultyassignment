import { useState } from 'react';
import * as XLSX from 'xlsx';

const ExcelUpload = ({ onDataParsed }) => {
  const [timetableFile, setTimetableFile] = useState('');
  const [seatingPlanFile, setSeatingPlanFile] = useState('');
  const [invigilationFile, setInvigilationFile] = useState('');
  const [timetableData, setTimetableData] = useState(null);
  const [seatingPlanData, setSeatingPlanData] = useState(null);
  const [invigilationData, setInvigilationData] = useState(null);
  const [inhouseFacultyCount, setInhouseFacultyCount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [allocationStats, setAllocationStats] = useState(null);
  const [selectedStatsDate, setSelectedStatsDate] = useState('all');

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fileType === 'timetable') {
      setTimetableFile(file.name);
    } else if (fileType === 'seatingPlan') {
      setSeatingPlanFile(file.name);
    } else {
      setInvigilationFile(file.name);
    }

    setIsProcessing(true);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Parse the Excel sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      console.log(`${fileType} Raw Data:`, jsonData);
      
      // Process based on file type
      if (fileType === 'timetable') {
        const parsedData = parseTimetableData(jsonData);
        console.log('Parsed Timetable:', parsedData);
        setTimetableData(parsedData);
        
        // Don't auto-generate, wait for user to set inhouse count
      } else if (fileType === 'seatingPlan') {
        const parsedData = parseSeatingPlanData(jsonData);
        console.log('Parsed Seating Plan:', parsedData);
        setSeatingPlanData(parsedData);
        
        // Don't auto-generate, wait for user to set inhouse count
      } else {
        const parsedData = parseInvigilationData(jsonData);
        console.log('Parsed Invigilation Data:', parsedData);
        setInvigilationData(parsedData);
        
        // Don't auto-generate, wait for user to click Generate button
      }
    } catch (err) {
      console.error(`Error reading ${fileType} file:`, err);
      setError(`Error reading ${fileType} file. Please ensure it's a valid Excel file.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseTimetableData = (data) => {
    try {
      if (!data || data.length === 0) return null;

      // Extract header information
      let examTitle = 'End Semester Examination';
      let university = 'International Institute of Professional Studies\nD.A. University, Indore';
      let dateRange = 'November - December 2025';

      // Find header row with "Date" and "Subject" columns
      let headerRowIndex = -1;
      let dateColumnIndex = -1;

      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (!row) continue;

        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j]).toLowerCase().trim();
          if (cell === 'date') {
            dateColumnIndex = j;
            headerRowIndex = i;
            break;
          }
        }
        if (headerRowIndex !== -1) break;
      }

      if (headerRowIndex === -1) {
        // Default: assume first row is header, column A is date
        headerRowIndex = 0;
        dateColumnIndex = 0;
      }

      const dataStartRow = headerRowIndex + 1;
      const subjectsMap = new Map(); // Use map to avoid duplicates

      // Parse each row - each row has a date and multiple subjects across columns
      for (let rowIndex = dataStartRow; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!row || !row[dateColumnIndex]) continue;

        let dateCell = String(row[dateColumnIndex]).trim();
        
        // Skip empty dates or special entries like "BREAK", "SUNDAY"
        if (!dateCell || 
            dateCell.toLowerCase().includes('break') || 
            dateCell.toLowerCase().includes('sunday')) {
          continue;
        }

        // Handle Excel date formats
        // Excel might return dates as numbers (serial dates) or formatted strings
        if (!isNaN(dateCell) && dateCell.length > 4) {
          // It's a number (Excel serial date) - convert it
          const excelDate = parseFloat(dateCell);
          const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
          const day = String(jsDate.getDate()).padStart(2, '0');
          const month = String(jsDate.getMonth() + 1).padStart(2, '0');
          const year = jsDate.getFullYear();
          dateCell = `${day}-${month}-${year}`;
        } else if (dateCell.includes('/')) {
          // Handle formats like "25/11/2025" or "25/11/25"
          const parts = dateCell.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            let year = parts[2];
            if (year.length === 2) year = '20' + year;
            dateCell = `${day}-${month}-${year}`;
          }
        }
        // If already in DD-MM-YYYY format, keep it as is
        
        console.log(`Parsed date: ${dateCell} from row ${rowIndex}`);

        // Process all columns after the date column (they contain subjects)
        for (let colIndex = dateColumnIndex + 1; colIndex < row.length; colIndex++) {
          const subjectCell = row[colIndex];
          if (!subjectCell || String(subjectCell).trim() === '') continue;

          const subjectText = String(subjectCell).trim();
          
          // Skip if it's just "Subject" header or empty
          if (subjectText.toLowerCase() === 'subject') continue;

          // Parse subject info
          // Format examples:
          // "MBA (MS) 2Y FT-101 Principles & Practices of Management"
          // "M.Tech (CS) CS-102 Physics-I"
          // "B.Com IB-101N Financial Accounting-I"
          
          let subjectCode = '';
          let subjectName = '';
          let programName = '';

          // Try to extract pattern: "PROGRAM CODE Subject Name"
          // Look for code patterns like FT-101, CS-102, IB-101N, etc.
          const match = subjectText.match(/^(.*?)\s+([A-Z]{1,3}-?\d{3,4}[A-Z]*)\s+(.+)$/i);
          
          if (match) {
            programName = match[1].trim();
            subjectCode = match[2].trim();
            subjectName = match[3].trim();
          } else {
            // Fallback: try to find any code pattern
            const codeMatch = subjectText.match(/([A-Z]{1,3}-?\d{3,4}[A-Z]*)/i);
            if (codeMatch) {
              subjectCode = codeMatch[1];
              const codeIndex = subjectText.indexOf(subjectCode);
              programName = subjectText.substring(0, codeIndex).trim();
              subjectName = subjectText.substring(codeIndex + subjectCode.length).trim();
            } else {
              // If no code found, use the whole text
              subjectCode = subjectText.substring(0, Math.min(20, subjectText.length));
              subjectName = subjectText;
              programName = '';
            }
          }

          // Add or update subject in map
          if (subjectsMap.has(subjectCode)) {
            const existing = subjectsMap.get(subjectCode);
            if (!existing.dates.includes(dateCell)) {
              existing.dates.push(dateCell);
            }
          } else {
            subjectsMap.set(subjectCode, {
              code: subjectCode,
              name: subjectName,
              program: programName,
              dates: [dateCell]
            });
          }
        }
      }

      // Convert map to array
      const subjects = Array.from(subjectsMap.values());

      console.log('All parsed subjects with dates:', subjects.map(s => ({ code: s.code, dates: s.dates })));

      // Calculate date range from parsed dates
      if (subjects.length > 0) {
        const allDates = subjects.flatMap(s => s.dates);
        console.log('All unique dates found:', [...new Set(allDates)].sort());
        if (allDates.length > 0) {
          // Sort dates
          const sortedDates = allDates.sort();
          const firstDate = sortedDates[0];
          const lastDate = sortedDates[sortedDates.length - 1];
          dateRange = `${firstDate} to ${lastDate}`;
        }
      }

      console.log('Parsed Subjects:', subjects);

      return {
        examTitle,
        university,
        dateRange,
        subjects
      };
    } catch (err) {
      console.error('Error parsing timetable:', err);
      return null;
    }
  };

  const parseSeatingPlanData = (data) => {
    try {
      if (!data || data.length === 0) return null;

      // Find header row with "Group", "From Roll No", "To Roll No", "Total Students", "Room No"
      let headerRowIndex = -1;
      let groupColIndex = -1;
      let fromRollColIndex = -1;
      let toRollColIndex = -1;
      let totalStudentsColIndex = -1;
      let roomNoColIndex = -1;

      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (!row) continue;

        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j]).toLowerCase().trim();
          
          if (cell === 'group') groupColIndex = j;
          if (cell.includes('from') && cell.includes('roll')) fromRollColIndex = j;
          if (cell.includes('to') && cell.includes('roll')) toRollColIndex = j;
          if (cell.includes('total') && cell.includes('student')) totalStudentsColIndex = j;
          if (cell.includes('room') && cell.includes('no')) roomNoColIndex = j;
        }

        if (groupColIndex !== -1 && roomNoColIndex !== -1) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        // Default column positions based on your image
        headerRowIndex = 0;
        groupColIndex = 0;
        fromRollColIndex = 1;
        toRollColIndex = 2;
        totalStudentsColIndex = 3;
        roomNoColIndex = 4;
      }

      const dataStartRow = headerRowIndex + 1;
      
      // Structure: { subjectCode: { date: { room: studentCount } } }
      const subjectAllocations = {};

      // Parse each row
      for (let rowIndex = dataStartRow; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!row) continue;

        const group = row[groupColIndex] ? String(row[groupColIndex]).trim() : '';
        const fromRoll = row[fromRollColIndex] ? String(row[fromRollColIndex]).trim() : '';
        const toRoll = row[toRollColIndex] ? String(row[toRollColIndex]).trim() : '';
        const totalStudents = row[totalStudentsColIndex] ? String(row[totalStudentsColIndex]).trim() : '';
        const roomNo = row[roomNoColIndex] ? String(row[roomNoColIndex]).trim() : '';

        if (!fromRoll || !roomNo) continue;

        // Extract subject code from roll number
        // Format: "IB-2K25-1" or "IC-2K25-19" or "IT-2K25-30 (Sec-A)"
        // Extract the subject code part (IB, IC, IT, etc.) and clean it
        
        let subjectCode = '';
        
        // Try to extract code like "IB-2K25", "IC-2K25", "IT-2K25"
        const rollMatch = fromRoll.match(/^([A-Z]{2,3})-?(\d{1}K\d{2})/i);
        if (rollMatch) {
          subjectCode = `${rollMatch[1]}-${rollMatch[2]}`;
        } else {
          // Fallback: try to extract just the prefix (IB, IC, IT, etc.)
          const prefixMatch = fromRoll.match(/^([A-Z]{2,3})/i);
          if (prefixMatch) {
            subjectCode = prefixMatch[1];
          } else {
            // Last resort: take first part before hyphen
            const parts = fromRoll.split('-');
            if (parts.length > 0 && parts[0]) {
              subjectCode = parts[0];
            }
          }
        }

        if (!subjectCode) {
          console.warn(`Could not extract subject code from roll number: ${fromRoll}`);
          continue;
        }

        // For now, we'll use a generic date key since the seating plan doesn't have dates
        // The dates will come from the timetable file
        const genericDate = 'default';

        if (!subjectAllocations[subjectCode]) {
          subjectAllocations[subjectCode] = {};
        }

        if (!subjectAllocations[subjectCode][genericDate]) {
          subjectAllocations[subjectCode][genericDate] = {};
        }

        // If room already exists, add to the count
        if (subjectAllocations[subjectCode][genericDate][roomNo]) {
          const existingCount = parseInt(subjectAllocations[subjectCode][genericDate][roomNo]) || 0;
          const newCount = parseInt(totalStudents) || 0;
          subjectAllocations[subjectCode][genericDate][roomNo] = String(existingCount + newCount);
        } else {
          subjectAllocations[subjectCode][genericDate][roomNo] = totalStudents;
        }
      }

      return {
        roomDateMap: [],
        subjectAllocations
      };
    } catch (err) {
      console.error('Error parsing seating plan:', err);
      return null;
    }
  };

  const parseInvigilationData = (data) => {
    try {
      if (!data || data.length === 0) return null;

      // Find header row with date columns
      let headerRowIndex = -1;
      let sNoColIndex = -1;
      let nameColIndex = -1;
      let postColIndex = -1;
      let dateColumns = [];

      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (!row) continue;

        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j]).toLowerCase().trim();
          if ((cell.includes('s.') && cell.includes('no')) || cell === 's.no.' || cell === 's.no' || cell === 'sno' || cell === 's no') {
            sNoColIndex = j;
            console.log(`Found S.No. column at index ${j}: "${row[j]}"`);
          }
          if (cell.includes('name') && cell.includes('faculty')) {
            nameColIndex = j;
            headerRowIndex = i;
          }
          if (cell === 'post' || cell === 'designation') {
            postColIndex = j;
          }
        }

        if (headerRowIndex !== -1) {
          // Get date columns from header row - start from column after post
          const startCol = postColIndex !== -1 ? postColIndex + 1 : nameColIndex + 2;
          for (let j = startCol; j < row.length; j++) {
            const cellValue = String(row[j]).trim();
            // Check if it's a date (format: 25.11, 26.11, 1.12, etc.)
            if (cellValue && cellValue.match(/^\d{1,2}\.\d{1,2}$/)) {
              dateColumns.push({
                index: j,
                date: cellValue
              });
            }
          }
          break;
        }
      }
      
      console.log('Header found at row:', headerRowIndex);
      console.log('S.No. column index:', sNoColIndex);
      console.log('Name column index:', nameColIndex);
      console.log('Post column index:', postColIndex);
      console.log('Date columns found:', dateColumns);
      
      if (sNoColIndex === -1) {
        console.warn('WARNING: S.No. column not detected! All faculties will be numbered sequentially.');
        console.log('First few rows for debugging:', data.slice(0, Math.min(5, data.length)));
      }

      if (headerRowIndex === -1 || nameColIndex === -1) {
        console.error('Could not find header row in invigilation sheet');
        return null;
      }

      const dataStartRow = headerRowIndex + 1;
      const facultyAvailability = {};

      // Parse each faculty row
      for (let rowIndex = dataStartRow; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!row || !row[nameColIndex]) continue;

        const facultyName = String(row[nameColIndex]).trim();
        const post = postColIndex !== -1 ? String(row[postColIndex]).trim() : '';
        
        // Parse S.No. more robustly
        let sNo;
        if (sNoColIndex !== -1 && row[sNoColIndex]) {
          // Try to extract number from the cell (handles "1", "1.", "1.0", etc.)
          const sNoValue = String(row[sNoColIndex]).trim();
          const numMatch = sNoValue.match(/\d+/);
          sNo = numMatch ? parseInt(numMatch[0]) : rowIndex - dataStartRow + 1;
        } else {
          sNo = rowIndex - dataStartRow + 1;
        }

        if (!facultyName) continue;

        // Only process faculties with "Invig" or "Invig." post
        const isInvigilator = post.toLowerCase().includes('invig');
        if (!isInvigilator) {
          console.log(`Skipping ${facultyName} - Post: ${post} (not an invigilator)`);
          continue;
        }

        console.log(`Parsed faculty: ${facultyName}, S.No: ${sNo} (type: ${typeof sNo}), Post: ${post}`);

        facultyAvailability[facultyName] = {
          name: facultyName,
          post: post,
          sNo: parseInt(sNo), // Ensure it's always stored as integer
          isInhouse: false, // Will be set based on inhouseFacultyCount
          availableDates: []
        };

        // Check availability for each date
        dateColumns.forEach(dateCol => {
          const cellValue = String(row[dateCol.index] || '').trim().toLowerCase();
          // If cell contains 'v' or '√' or 'y' or '✓', faculty is available
          if (cellValue === 'v' || cellValue === '√' || cellValue === 'y' || cellValue === '✓' || cellValue.includes('✓')) {
            // Convert date format from "25.11" to "DD-MM-2025"
            const [day, month] = dateCol.date.split('.');
            const formattedDate = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-2025`;
            facultyAvailability[facultyName].availableDates.push(formattedDate);
          }
        });
        
        console.log(`Faculty ${facultyName} (Invig) available on:`, facultyAvailability[facultyName].availableDates);
      }

      console.log('Parsed Faculty Availability (Invigilators only):', facultyAvailability);

      return {
        facultyAvailability,
        dateColumns
      };
    } catch (err) {
      console.error('Error parsing invigilation data:', err);
      return null;
    }
  };

  const mergeAndGenerate = (timetable, seatingPlan, invigilationData) => {
    try {
      console.log('Merging:', { timetable, seatingPlan });

      // First, group all rooms by date with their total student counts
      const dateRoomMap = {}; // { date: { roomNumber: totalStudents } }

      // Collect all subjects and their rooms per date
      timetable.subjects.forEach(subject => {
        let matchingKey = null;
        // Extract prefix (first 2-3 letters) for matching
        const subjectPrefix = subject.code.match(/^([A-Z]{2,3})/i)?.[1]?.toUpperCase();
        
        console.log(`Looking for match for subject: ${subject.code} (prefix: ${subjectPrefix})`);
        
        // Look for matching allocation in seating plan
        for (const key of Object.keys(seatingPlan.subjectAllocations)) {
          const keyPrefix = key.match(/^([A-Z]{2,3})/i)?.[1]?.toUpperCase();
          
          console.log(`  Checking seating plan key: ${key} (prefix: ${keyPrefix})`);
          
          // Match by prefix (e.g., "FT" matches "FT")
          if (subjectPrefix && keyPrefix && subjectPrefix === keyPrefix) {
            matchingKey = key;
            console.log(`  ✓ MATCHED by prefix: ${subject.code} → ${key}`);
            break;
          }
          
          // Fallback: exact match or contains
          if (key === subject.code || key.includes(subject.code) || subject.code.includes(key)) {
            matchingKey = key;
            console.log(`  ✓ MATCHED by exact/contains: ${subject.code} → ${key}`);
            break;
          }
        }

        const allocations = matchingKey ? seatingPlan.subjectAllocations[matchingKey] : {};
        const roomData = allocations['default'] || {};
        
        if (!matchingKey) {
          console.warn(`No seating plan match found for subject: ${subject.code} (${subject.name})`);
        } else {
          console.log(`Matched subject ${subject.code} with seating plan key: ${matchingKey}`);
        }
        
        // For each date this subject is scheduled
        subject.dates.forEach(date => {
          if (!dateRoomMap[date]) {
            dateRoomMap[date] = {};
          }
          
          // Add room data for this subject
          Object.keys(roomData).forEach(roomNumber => {
            const studentCount = parseInt(roomData[roomNumber]) || 0;
            if (!dateRoomMap[date][roomNumber]) {
              dateRoomMap[date][roomNumber] = 0;
            }
            // Sum up students in the same room (in case multiple subjects use same room)
            dateRoomMap[date][roomNumber] += studentCount;
          });
        });
      });

      console.log('Date-Room Map:', dateRoomMap);

      // Now assign faculties to each unique room per date
      const roomFacultyAssignments = {}; // { date: { roomNumber: [faculties] } }

      Object.keys(dateRoomMap).forEach(date => {
        roomFacultyAssignments[date] = {};
        
        // Get available faculties for this date
        const availableFacultiesForDate = Object.values(invigilationData.facultyAvailability).filter(faculty => 
          faculty.availableDates.includes(date)
        );
        
        const inhouseCount = parseInt(inhouseFacultyCount) || 0;
        
        // Ensure all sNo values are integers for proper comparison
        const inhouseFaculties = availableFacultiesForDate.filter(f => {
          const sNo = parseInt(f.sNo);
          return !isNaN(sNo) && sNo <= inhouseCount;
        });
        const outsourcedFaculties = availableFacultiesForDate.filter(f => {
          const sNo = parseInt(f.sNo);
          return isNaN(sNo) || sNo > inhouseCount;
        });
        
        const roomNumbers = Object.keys(dateRoomMap[date]);
        
        console.log(`\n=== FACULTY ASSIGNMENT FOR ${date} ===`);
        console.log(`Inhouse count setting: ${inhouseCount} (type: ${typeof inhouseCount})`);
        console.log(`Total rooms: ${roomNumbers.length}`);
        console.log(`Available faculties for date (${availableFacultiesForDate.length}):`);
        availableFacultiesForDate.forEach(f => {
          console.log(`  - ${f.name}: S.No=${f.sNo} (type: ${typeof f.sNo}), isInhouse: ${f.sNo <= inhouseCount}`);
        });
        console.log(`Inhouse faculties (${inhouseFaculties.length}):`, inhouseFaculties.map(f => `${f.name} (S.No: ${f.sNo})`));
        console.log(`Outsourced faculties (${outsourcedFaculties.length}):`, outsourcedFaculties.map(f => `${f.name} (S.No: ${f.sNo})`));
        
        // PHASE 1: Assign ONE faculty to EACH room first (prefer inhouse, use outsourced if needed)
        let inhouseIndex = 0;
        let outsourcedIndex = 0;
        
        roomNumbers.forEach(roomNumber => {
          roomFacultyAssignments[date][roomNumber] = [];
          
          if (inhouseIndex < inhouseFaculties.length) {
            // Assign inhouse faculty
            const faculty = inhouseFaculties[inhouseIndex];
            console.log(`  → Room ${roomNumber}: Assigning INHOUSE faculty ${faculty.name} (S.No: ${faculty.sNo})`);
            roomFacultyAssignments[date][roomNumber].push({
              name: faculty.name,
              post: faculty.post,
              type: 'Inhouse'
            });
            inhouseIndex++;
          } else if (outsourcedIndex < outsourcedFaculties.length) {
            // No inhouse available, assign outsourced faculty
            const faculty = outsourcedFaculties[outsourcedIndex];
            console.log(`  → Room ${roomNumber}: Assigning OUTSOURCED faculty ${faculty.name} (S.No: ${faculty.sNo}) - no inhouse available`);
            roomFacultyAssignments[date][roomNumber].push({
              name: faculty.name,
              post: faculty.post,
              type: 'Outsourced'
            });
            outsourcedIndex++;
          } else {
            console.error(`ERROR: Room ${roomNumber} on ${date} - No faculties available at all!`);
          }
        });
        
        // PHASE 2: Assign additional faculties to rooms that need them (31+ students)
        roomNumbers.forEach(roomNumber => {
          const totalStudents = dateRoomMap[date][roomNumber];
          const currentFaculties = roomFacultyAssignments[date][roomNumber].length;
          let additionalNeeded = 0;
          
          // Calculate total needed based on student count
          let totalNeeded = 1;
          if (totalStudents >= 31 && totalStudents <= 50) {
            totalNeeded = 2;
          } else if (totalStudents > 50) {
            totalNeeded = 3;
          }
          
          // Additional needed = total needed - already assigned
          additionalNeeded = totalNeeded - currentFaculties;
          
          // First try to use remaining inhouse faculties
          while (additionalNeeded > 0 && inhouseIndex < inhouseFaculties.length) {
            const faculty = inhouseFaculties[inhouseIndex];
            roomFacultyAssignments[date][roomNumber].push({
              name: faculty.name,
              post: faculty.post,
              type: 'Inhouse'
            });
            inhouseIndex++;
            additionalNeeded--;
          }
          
          // Then use outsourced faculties
          while (additionalNeeded > 0 && outsourcedIndex < outsourcedFaculties.length) {
            const faculty = outsourcedFaculties[outsourcedIndex];
            roomFacultyAssignments[date][roomNumber].push({
              name: faculty.name,
              post: faculty.post,
              type: 'Outsourced'
            });
            outsourcedIndex++;
            additionalNeeded--;
          }
          
          console.log(`Room ${roomNumber} (${totalStudents} students): Assigned ${roomFacultyAssignments[date][roomNumber].length} faculties`);
        });
      });

      console.log('Room Faculty Assignments:', roomFacultyAssignments);

      // Now rebuild subjects with faculty assignments
      const subjects = timetable.subjects.map(subject => {
        let matchingKey = null;
        // Extract prefix (first 2-3 letters) for matching
        const subjectPrefix = subject.code.match(/^([A-Z]{2,3})/i)?.[1]?.toUpperCase();
        
        for (const key of Object.keys(seatingPlan.subjectAllocations)) {
          const keyPrefix = key.match(/^([A-Z]{2,3})/i)?.[1]?.toUpperCase();
          
          // Match by prefix (e.g., "FT" matches "FT")
          if (subjectPrefix && keyPrefix && subjectPrefix === keyPrefix) {
            matchingKey = key;
            break;
          }
          
          // Fallback: exact match or contains
          if (key === subject.code || key.includes(subject.code) || subject.code.includes(key)) {
            matchingKey = key;
            break;
          }
        }

        const allocations = matchingKey ? seatingPlan.subjectAllocations[matchingKey] : {};
        const roomData = allocations['default'] || {};
        
        if (!matchingKey && Object.keys(roomData).length === 0) {
          console.warn(`No rooms found for subject: ${subject.code} (${subject.name})`);
        }
        
        const schedule = subject.dates.map(date => {
          const rooms = Object.keys(roomData).map(roomNumber => {
            const studentCount = parseInt(roomData[roomNumber]) || 0;
            
            // Get the pre-assigned faculties for this room on this date
            // Create a copy to avoid shared references across subjects
            const faculties = roomFacultyAssignments[date] && roomFacultyAssignments[date][roomNumber] 
              ? [...roomFacultyAssignments[date][roomNumber]] 
              : [];
            
            if (faculties.length === 0 && studentCount > 0) {
              console.warn(`No faculties assigned to room ${roomNumber} on ${date} (${studentCount} students)`);
            }
            
            return {
              number: roomNumber,
              studentCount: studentCount,
              faculties: faculties
            };
          });

          return {
            date: date,
            rooms: rooms
          };
        }).filter(slot => slot.rooms.length > 0);

        return {
          id: Date.now() + Math.random(),
          code: subject.code,
          name: subject.name,
          schedule: schedule
        };
      }).filter(subject => subject.schedule.length > 0);

      const mergedData = {
        examTitle: timetable.examTitle,
        university: timetable.university,
        dateRange: timetable.dateRange,
        subjects: subjects
      };

      // Calculate allocation statistics
      const stats = calculateAllocationStats(subjects, invigilationData);
      setAllocationStats(stats);

      console.log('Merged Data:', mergedData);
      console.log('Allocation Stats:', stats);
      onDataParsed(mergedData);
    } catch (err) {
      console.error('Error merging data:', err);
      setError('Error merging timetable and seating plan data.');
    }
  };

  // Calculate faculty allocation statistics
  const calculateAllocationStats = (subjects, invigilationData) => {
    let totalRooms = 0;
    let totalFacultiesNeeded = 0;
    let totalFacultiesAssigned = 0;
    let roomsWithoutInhouse = 0;
    const dateWiseStats = {};

    subjects.forEach(subject => {
      subject.schedule.forEach(slot => {
        const date = slot.date;
        if (!dateWiseStats[date]) {
          dateWiseStats[date] = {
            roomsCount: 0,
            facultiesNeeded: 0,
            facultiesAssigned: 0,
            inhouseAssigned: 0,
            outsourcedAssigned: 0,
            roomsWithoutInhouse: 0,
            availableFaculties: 0
          };
          
          // Count faculties available on this specific date
          if (invigilationData && invigilationData.facultyAvailability) {
            dateWiseStats[date].availableFaculties = Object.values(invigilationData.facultyAvailability)
              .filter(faculty => faculty.availableDates.includes(date))
              .length;
          }
        }

        slot.rooms.forEach(room => {
          totalRooms++;
          dateWiseStats[date].roomsCount++;

          const studentCount = room.studentCount;
          let needed = 1;
          if (studentCount >= 31 && studentCount <= 50) needed = 2;
          else if (studentCount > 50) needed = 3;

          totalFacultiesNeeded += needed;
          dateWiseStats[date].facultiesNeeded += needed;

          if (room.faculties) {
            totalFacultiesAssigned += room.faculties.length;
            dateWiseStats[date].facultiesAssigned += room.faculties.length;

            const hasInhouse = room.faculties.some(f => f.type === 'Inhouse');
            if (!hasInhouse) {
              roomsWithoutInhouse++;
              dateWiseStats[date].roomsWithoutInhouse++;
            }

            room.faculties.forEach(f => {
              if (f.type === 'Inhouse') {
                dateWiseStats[date].inhouseAssigned++;
              } else {
                dateWiseStats[date].outsourcedAssigned++;
              }
            });
          }
        });
      });
    });

    // Count total available faculties (total in system, not date-specific)
    const totalAvailableFaculties = invigilationData ? 
      Object.keys(invigilationData.facultyAvailability).length : 0;

    const shortage = totalFacultiesNeeded - totalFacultiesAssigned;
    const excess = totalAvailableFaculties - totalFacultiesAssigned;

    return {
      totalRooms,
      totalFacultiesNeeded,
      totalFacultiesAssigned,
      totalAvailableFaculties,
      shortage: shortage > 0 ? shortage : 0,
      excess: excess > 0 ? excess : 0,
      roomsWithoutInhouse,
      dateWiseStats
    };
  };

  // Function to assign faculties to a room based on student count and availability
  const assignFaculties = (date, studentCount, facultyAvailability, inhouseCount) => {
    console.log(`Assigning faculties for date: ${date}, student count: ${studentCount}`);
    
    // Determine number of faculties needed
    let facultiesNeeded = 1;
    if (studentCount >= 31 && studentCount <= 50) {
      facultiesNeeded = 2;
    } else if (studentCount > 50) {
      facultiesNeeded = 3;
    }

    console.log(`Faculties needed: ${facultiesNeeded}`);

    // Get available faculties for this date
    const availableFaculties = Object.values(facultyAvailability).filter(faculty => 
      faculty.availableDates.includes(date)
    );

    console.log(`Available faculties for ${date}:`, availableFaculties.map(f => f.name));

    // Separate inhouse and outsourced faculties
    const inhouseFaculties = availableFaculties.filter(f => f.sNo <= inhouseCount);
    const outsourcedFaculties = availableFaculties.filter(f => f.sNo > inhouseCount);

    console.log(`Inhouse count parameter: ${inhouseCount}`);
    console.log(`Faculty sNo values:`, availableFaculties.map(f => `${f.name}: sNo=${f.sNo}`));
    console.log(`Inhouse: ${inhouseFaculties.length}, Outsourced: ${outsourcedFaculties.length}`);

    const assigned = [];

    // RULE: Always assign at least one inhouse faculty first
    if (inhouseFaculties.length > 0) {
      assigned.push({
        name: inhouseFaculties[0].name,
        post: inhouseFaculties[0].post,
        type: 'Inhouse'
      });
      
      // Remove from available pool
      const dateIndex = facultyAvailability[inhouseFaculties[0].name].availableDates.indexOf(date);
      if (dateIndex > -1) {
        facultyAvailability[inhouseFaculties[0].name].availableDates.splice(dateIndex, 1);
      }
      
      facultiesNeeded--;
    } else {
      console.warn(`WARNING: No inhouse faculty available for ${date}!`);
    }

    // Assign remaining faculties (prefer inhouse, then outsourced)
    const remainingInhouse = inhouseFaculties.slice(1);
    const combinedPool = [...remainingInhouse, ...outsourcedFaculties];

    for (let i = 0; i < Math.min(facultiesNeeded, combinedPool.length); i++) {
      const faculty = combinedPool[i];
      assigned.push({
        name: faculty.name,
        post: faculty.post,
        type: faculty.sNo <= inhouseCount ? 'Inhouse' : 'Outsourced'
      });

      // Remove from available pool
      const dateIndex = facultyAvailability[faculty.name].availableDates.indexOf(date);
      if (dateIndex > -1) {
        facultyAvailability[faculty.name].availableDates.splice(dateIndex, 1);
      }
    }

    console.log(`Assigned faculties:`, assigned);

    return assigned;
  };

  const handleClear = (fileType) => {
    if (fileType === 'timetable') {
      setTimetableFile('');
      setTimetableData(null);
      document.getElementById('timetable-upload-input').value = '';
    } else if (fileType === 'seatingPlan') {
      setSeatingPlanFile('');
      setSeatingPlanData(null);
      document.getElementById('seating-upload-input').value = '';
    } else {
      setInvigilationFile('');
      setInvigilationData(null);
      document.getElementById('invigilation-upload-input').value = '';
    }
    setError('');
    setAllocationStats(null);
  };

  const handleGenerateAssignments = () => {
    if (!timetableData || !seatingPlanData || !invigilationData) {
      setError('Please upload all three files before generating assignments.');
      return;
    }

    if (!inhouseFacultyCount || parseInt(inhouseFacultyCount) <= 0) {
      setError('Please specify the inhouse faculty count.');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      // Update inhouse status in faculty availability
      const inhouseCount = parseInt(inhouseFacultyCount);
      Object.values(invigilationData.facultyAvailability).forEach(faculty => {
        faculty.isInhouse = faculty.sNo <= inhouseCount;
      });

      console.log('Generating assignments with inhouse count:', inhouseCount);
      mergeAndGenerate(timetableData, seatingPlanData, invigilationData);
    } catch (err) {
      console.error('Error generating assignments:', err);
      setError('Error generating faculty assignments.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="excel-upload-section">
      <h2>Upload Excel Files</h2>
      <p className="upload-description">
        Upload timetable, seating plan, and invigilation duty files (.xlsx, .xls) to generate the final output
      </p>

      {/* Timetable Upload */}
      <div className="upload-area">
        <h3 className="upload-title">📅 Timetable File</h3>
        <p className="upload-subtitle">Contains subjects with their scheduled exam dates/codes</p>
        
        <input
          id="timetable-upload-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => handleFileUpload(e, 'timetable')}
          style={{ display: 'none' }}
        />
        <label htmlFor="timetable-upload-input" className="upload-button">
          📁 Choose Timetable File
        </label>

        {timetableFile && (
          <div className="file-info">
            <span className="file-name">✓ {timetableFile}</span>
            <button onClick={() => handleClear('timetable')} className="btn-clear">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Seating Plan Upload */}
      <div className="upload-area">
        <h3 className="upload-title">🪑 Seating Plan File</h3>
        <p className="upload-subtitle">Contains room numbers with student counts per subject</p>
        
        <input
          id="seating-upload-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => handleFileUpload(e, 'seatingPlan')}
          style={{ display: 'none' }}
        />
        <label htmlFor="seating-upload-input" className="upload-button">
          📁 Choose Seating Plan File
        </label>

        {seatingPlanFile && (
          <div className="file-info">
            <span className="file-name">✓ {seatingPlanFile}</span>
            <button onClick={() => handleClear('seatingPlan')} className="btn-clear">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Invigilation Upload */}
      <div className="upload-area">
        <h3 className="upload-title">👥 Invigilation Duty File</h3>
        <p className="upload-subtitle">Contains faculty names with their availability dates for invigilation</p>
        
        <input
          id="invigilation-upload-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => handleFileUpload(e, 'invigilation')}
          style={{ display: 'none' }}
        />
        <label htmlFor="invigilation-upload-input" className="upload-button">
          📁 Choose Invigilation File
        </label>

        {invigilationFile && (
          <div className="file-info">
            <span className="file-name">✓ {invigilationFile}</span>
            <button onClick={() => handleClear('invigilation')} className="btn-clear">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Inhouse Faculty Count Input */}
      {invigilationFile && (
        <div className="upload-area inhouse-input-area">
          <h3 className="upload-title">🏢 Inhouse Faculty Configuration</h3>
          <p className="upload-subtitle">Specify how many faculties (by S. No.) are inhouse</p>
          <div className="inhouse-input-group">
            <label htmlFor="inhouse-count">Inhouse Faculty Count (S. No. 1 to):</label>
            <input
              id="inhouse-count"
              type="number"
              min="0"
              value={inhouseFacultyCount}
              onChange={(e) => setInhouseFacultyCount(e.target.value)}
              placeholder="e.g., 15"
              className="inhouse-input"
            />
            <span className="input-hint">Faculties after this number will be considered outsourced</span>
            
            {timetableFile && seatingPlanFile && invigilationFile && (
              <button 
                onClick={handleGenerateAssignments} 
                className="btn-generate"
                disabled={!inhouseFacultyCount || isProcessing}
              >
                🎯 Generate Faculty Assignments
              </button>
            )}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="processing-message">
          Processing files...
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {timetableFile && seatingPlanFile && invigilationFile && !allocationStats && !error && (
        <div className="info-message">
          📋 All files uploaded! Please set the inhouse faculty count and click "Generate Faculty Assignments".
        </div>
      )}

      {allocationStats && (
        <div className="success-message">
          ✓ Faculty assignments generated successfully!
        </div>
      )}

      {/* Allocation Statistics */}
      {allocationStats && (
        <div className="allocation-stats">
          <div className="stats-header">
            <h3>📊 Faculty Allocation Statistics</h3>
            <div className="stats-date-selector">
              <label htmlFor="stats-date-select">View Stats for: </label>
              <select 
                id="stats-date-select" 
                value={selectedStatsDate} 
                onChange={(e) => setSelectedStatsDate(e.target.value)}
                className="stats-date-dropdown"
              >
                <option value="all">All Dates Combined</option>
                {Object.keys(allocationStats.dateWiseStats).sort().map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const stats = selectedStatsDate === 'all' 
              ? {
                  rooms: allocationStats.totalRooms,
                  needed: allocationStats.totalFacultiesNeeded,
                  assigned: allocationStats.totalFacultiesAssigned,
                  available: allocationStats.totalAvailableFaculties,
                  shortage: allocationStats.shortage,
                  excess: allocationStats.excess,
                  roomsWithoutInhouse: allocationStats.roomsWithoutInhouse
                }
              : {
                  rooms: allocationStats.dateWiseStats[selectedStatsDate]?.roomsCount || 0,
                  needed: allocationStats.dateWiseStats[selectedStatsDate]?.facultiesNeeded || 0,
                  assigned: allocationStats.dateWiseStats[selectedStatsDate]?.facultiesAssigned || 0,
                  available: allocationStats.dateWiseStats[selectedStatsDate]?.availableFaculties || 0,
                  shortage: Math.max(0, (allocationStats.dateWiseStats[selectedStatsDate]?.facultiesNeeded || 0) - (allocationStats.dateWiseStats[selectedStatsDate]?.facultiesAssigned || 0)),
                  excess: Math.max(0, (allocationStats.dateWiseStats[selectedStatsDate]?.availableFaculties || 0) - (allocationStats.dateWiseStats[selectedStatsDate]?.facultiesAssigned || 0)),
                  roomsWithoutInhouse: allocationStats.dateWiseStats[selectedStatsDate]?.roomsWithoutInhouse || 0
                };

            return (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Total Rooms</div>
                    <div className="stat-value">{stats.rooms}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Faculties Needed</div>
                    <div className="stat-value">{stats.needed}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Faculties Assigned</div>
                    <div className="stat-value">{stats.assigned}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Available Faculties</div>
                    <div className="stat-value">{stats.available}</div>
                  </div>
                </div>

                {stats.shortage > 0 && (
                  <div className="alert alert-warning">
                    ⚠️ <strong>Faculty Shortage:</strong> {stats.shortage} more faculties needed!
                  </div>
                )}

                {stats.excess > 0 && (
                  <div className="alert alert-success">
                    ✓ <strong>Faculty Excess:</strong> {stats.excess} extra faculties available.
                  </div>
                )}

                {stats.roomsWithoutInhouse > 0 && (
                  <div className="alert alert-danger">
                    🚨 <strong>Warning:</strong> {stats.roomsWithoutInhouse} rooms do not have an inhouse faculty assigned!
                  </div>
                )}

                {stats.roomsWithoutInhouse === 0 && stats.rooms > 0 && (
                  <div className="alert alert-success">
                    ✓ All rooms have at least one inhouse faculty assigned.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      <div className="upload-instructions">
        <h4>File Format Guidelines:</h4>
        
        <div className="instruction-section">
          <strong>Timetable File Format:</strong>
          <ul>
            <li><strong>Column A (Date):</strong> Exam date (e.g., 25-11-2025, 27-11-2025)</li>
            <li><strong>Columns B-H (Subjects):</strong> Multiple subjects can appear across different columns in the same row</li>
            <li>Example: "MBA(MS) 2Y FT-101 Principles and Practices of Management"</li>
            <li>Pattern: Program + Subject Code + Subject Name</li>
            <li>The system extracts all subject codes (e.g., FT-101, CS-102, IB-101N) from each row</li>
            <li>Skips cells containing "BREAK" or "SUNDAY"</li>
          </ul>
        </div>

        <div className="instruction-section">
          <strong>Seating Plan File Format:</strong>
          <ul>
            <li><strong>Column A (Group):</strong> Group name (e.g., Group I, Group II)</li>
            <li><strong>Column B (From Roll No.):</strong> Starting roll number (e.g., IB-2K25-1)</li>
            <li><strong>Column C (To Roll No.):</strong> Ending roll number (e.g., IB-2K25-18)</li>
            <li><strong>Column D (Total Students):</strong> Number of students (e.g., 18, 19)</li>
            <li><strong>Column E (Room No):</strong> Room number (e.g., 102, 103, LH-3)</li>
          </ul>
        </div>

        <div className="instruction-section">
          <strong>Invigilation Duty File Format:</strong>
          <ul>
            <li><strong>Column A (S. No.):</strong> Serial number</li>
            <li><strong>Column B (Name of Faculty):</strong> Faculty name (e.g., Dr. Yaman Srivastava)</li>
            <li><strong>Column C (Post):</strong> Faculty position (e.g., C.R.I., Exam Cont., Supdt., Invig.)</li>
            <li><strong>Date Columns (D onwards):</strong> Dates with availability marked as 'v' or '√'</li>
            <li>Example: Dates like "25.11", "26.11", etc. with 'v' marking availability</li>
            <li><strong>Faculty Assignment Rules:</strong>
              <ul>
                <li>1-30 students: 1 faculty assigned</li>
                <li>31-50 students: 2 faculties assigned</li>
                <li>51+ students: 3 faculties assigned</li>
              </ul>
            </li>
          </ul>
        </div>

        <p className="note">
          <strong>Note:</strong> All three files must be uploaded. The system will match subjects, assign rooms, and automatically allocate faculties based on student count and their availability.
        </p>
      </div>
    </div>
  );
};

export default ExcelUpload;
