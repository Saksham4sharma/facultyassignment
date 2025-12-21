import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

const SeatingPlanOutput = ({ data }) => {
  const printRef = useRef();
  
  // Get all unique dates and sort them
  const allDates = Object.keys(data.schedule).sort();
  
  // State for selected date (default to 'all' or first date)
  const [selectedDate, setSelectedDate] = useState('all');
  
  // Filter dates based on selection
  const dates = selectedDate === 'all' ? allDates : [selectedDate];

  const handleDownloadFacultyExcel = () => {
    // Create Faculty Assignment Sheet only
    const facultyWsData = [];
    facultyWsData.push(['Faculty Invigilation Duty Assignment']);
    facultyWsData.push([`${data.examTitle} ${data.dateRange}`]);
    if (selectedDate !== 'all') {
      facultyWsData.push([`Showing assignments for: ${selectedDate}`]);
    }
    facultyWsData.push([]); // Empty row
    
    // Add headers for faculty sheet
    facultyWsData.push(['Date', 'Room No.', 'Subject Code', 'Subject Name', 'Total Students', 'Faculty Assigned', 'Type']);
    
    // Add faculty assignment data
    dates.forEach(date => {
      data.schedule[date].forEach(subject => {
        subject.rooms.forEach(room => {
          if (room.faculties && room.faculties.length > 0) {
            room.faculties.forEach(faculty => {
              facultyWsData.push([
                date,
                room.roomNumber,
                subject.subjectCode,
                subject.subjectName,
                room.studentCount,
                `${faculty.name} (${faculty.post})`,
                faculty.type || 'Outsourced'
              ]);
            });
          } else {
            // Room with no faculty assigned
            facultyWsData.push([
              date,
              room.roomNumber,
              subject.subjectCode,
              subject.subjectName,
              room.studentCount,
              'NO FACULTY ASSIGNED',
              '-'
            ]);
          }
        });
      });
    });
    
    const wb = XLSX.utils.book_new();
    const facultyWs = XLSX.utils.aoa_to_sheet(facultyWsData);
    
    // Set column widths for faculty sheet
    facultyWs['!cols'] = [
      { wch: 15 }, // Date
      { wch: 12 }, // Room
      { wch: 15 }, // Subject Code
      { wch: 35 }, // Subject Name
      { wch: 15 }, // Total Students
      { wch: 40 }, // Faculty Assigned
      { wch: 12 }  // Type
    ];
    
    // Apply styling to header row
    const range = XLSX.utils.decode_range(facultyWs['!ref']);
    const headerRowIndex = selectedDate !== 'all' ? 4 : 3;
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
      if (facultyWs[cellAddress]) {
        facultyWs[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'D3D3D3' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    }
    
    // Add faculty worksheet to workbook
    XLSX.utils.book_append_sheet(wb, facultyWs, 'Faculty Assignment');
    
    // Generate filename
    const filename = selectedDate === 'all' 
      ? 'Faculty_Assignment_All_Dates.xlsx' 
      : `Faculty_Assignment_${selectedDate}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
  };

  const handleDownloadExcel = () => {
    // Create worksheet data
    const wsData = [];
    
    // Add header rows
    wsData.push([data.university]);
    wsData.push([`${data.examTitle} ${data.dateRange}`]);
    if (selectedDate !== 'all') {
      wsData.push([`Showing seating plan for: ${selectedDate}`]);
    }
    wsData.push([]); // Empty row
    
    // Add table headers - Room numbers row
    const headerRow1 = ['Subject'];
    allRooms.forEach(room => {
      headerRow1.push(room);
    });
    wsData.push(headerRow1);
    
    // Add subject rows
    matrix.forEach(row => {
      const dataRow = [`${row.subject.code}\n${row.subject.name}`];
      allRooms.forEach(room => {
        let totalForRoom = 0;
        dates.forEach(date => {
          const key = `${date}-${room}`;
          const cellData = row.cells[key];
          if (cellData) {
            totalForRoom += parseInt(cellData.studentCount) || 0;
          }
        });
        dataRow.push(totalForRoom || '');
      });
      wsData.push(dataRow);
    });
    
    // Add total row
    const totalRow = ['Total Students'];
    allRooms.forEach(room => {
      let total = 0;
      dates.forEach(date => {
        total += getTotalForDateRoom(date, room);
      });
      totalRow.push(total);
    });
    wsData.push(totalRow);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    const colWidths = [{ wch: 30 }]; // Subject column
    allRooms.forEach(() => {
      colWidths.push({ wch: 12 }); // Room columns
    });
    ws['!cols'] = colWidths;
    
    // Apply styling to cells
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        // Header rows (university and exam title)
        if (R < 4) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }
        
        // Table headers and total row
        const headerRowIndex = selectedDate !== 'all' ? 4 : 4;
        if (R === headerRowIndex || ws[cellAddress].v === 'Total Students') {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'D3D3D3' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          };
        }
      }
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Seating Plan');
    
    // Create Faculty Assignment Sheet
    const facultyWsData = [];
    facultyWsData.push(['Faculty Invigilation Duty Assignment']);
    facultyWsData.push([`${data.examTitle} ${data.dateRange}`]);
    if (selectedDate !== 'all') {
      facultyWsData.push([`Showing assignments for: ${selectedDate}`]);
    }
    facultyWsData.push([]); // Empty row
    
    // Add headers for faculty sheet
    facultyWsData.push(['Date', 'Room No.', 'Subject Code', 'Subject Name', 'Total Students', 'Faculty Assigned', 'Type']);
    
    // Add faculty assignment data
    dates.forEach(date => {
      data.schedule[date].forEach(subject => {
        subject.rooms.forEach(room => {
          if (room.faculties && room.faculties.length > 0) {
            room.faculties.forEach(faculty => {
              facultyWsData.push([
                date,
                room.roomNumber,
                subject.subjectCode,
                subject.subjectName,
                room.studentCount,
                `${faculty.name} (${faculty.post})`,
                faculty.type || 'Outsourced'
              ]);
            });
          }
        });
      });
    });
    
    const facultyWs = XLSX.utils.aoa_to_sheet(facultyWsData);
    
    // Set column widths for faculty sheet
    facultyWs['!cols'] = [
      { wch: 15 }, // Date
      { wch: 12 }, // Room
      { wch: 15 }, // Subject Code
      { wch: 35 }, // Subject Name
      { wch: 15 }, // Total Students
      { wch: 40 }, // Faculty Assigned
      { wch: 12 }  // Type
    ];
    
    // Add faculty worksheet to workbook
    XLSX.utils.book_append_sheet(wb, facultyWs, 'Faculty Assignment');
    
    // Generate filename
    const filename = selectedDate === 'all' 
      ? 'Seating_Plan_All_Dates.xlsx' 
      : `Seating_Plan_${selectedDate}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
  };

  // Get all unique room numbers from all subjects
  const getAllRooms = () => {
    const roomsSet = new Set();
    dates.forEach(date => {
      data.schedule[date].forEach(subject => {
        subject.rooms.forEach(room => {
          roomsSet.add(room.roomNumber);
        });
      });
    });
    return Array.from(roomsSet).sort();
  };

  const allRooms = getAllRooms();

  // Create a matrix: subjects x dates x rooms
  const createMatrix = () => {
    const matrix = [];
    const allSubjects = [];
    
    // Collect all unique subjects
    dates.forEach(date => {
      data.schedule[date].forEach(subject => {
        const existingSubject = allSubjects.find(s => s.code === subject.subjectCode);
        if (!existingSubject) {
          allSubjects.push({
            code: subject.subjectCode,
            name: subject.subjectName
          });
        }
      });
    });

    // Build matrix
    allSubjects.forEach(subject => {
      const row = {
        subject: subject,
        cells: {}
      };
      
      dates.forEach(date => {
        const subjectData = data.schedule[date].find(s => s.subjectCode === subject.code);
        if (subjectData) {
          allRooms.forEach(roomNumber => {
            const roomData = subjectData.rooms.find(r => r.roomNumber === roomNumber);
            if (roomData) {
              const key = `${date}-${roomNumber}`;
              row.cells[key] = {
                studentCount: roomData.studentCount,
                faculties: roomData.faculties || []
              };
            }
          });
        }
      });
      
      matrix.push(row);
    });

    return { matrix, allSubjects };
  };

  const { matrix } = createMatrix();

  // Calculate total students per room per date
  const getTotalForDateRoom = (date, roomNumber) => {
    let total = 0;
    data.schedule[date].forEach(subject => {
      const room = subject.rooms.find(r => r.roomNumber === roomNumber);
      if (room) {
        total += parseInt(room.studentCount) || 0;
      }
    });
    return total;
  };

  return (
    <div className="output-section">
      <div className="output-header">
        <h2>Generated Seating Plan</h2>
        <div className="header-controls">
          <div className="date-selector">
            <label htmlFor="date-select">Select Date: </label>
            <select 
              id="date-select" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-select-dropdown"
            >
              <option value="all">All Dates</option>
              {allDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
          <div className="download-buttons">
            <button onClick={handleDownloadExcel} className="btn-download">
              📥 Download Seating Plan
            </button>
            <button onClick={handleDownloadFacultyExcel} className="btn-download btn-download-faculty">
              👥 Download Faculty Assignment
            </button>
          </div>
        </div>
      </div>

      <div ref={printRef} className="seating-plan-sheet">
        <div className="sheet-header">
          <h3>{data.university}</h3>
          <h4>{data.examTitle} {data.dateRange}</h4>
          {selectedDate !== 'all' && (
            <p className="selected-date-info">Showing seating plan for: <strong>{selectedDate}</strong></p>
          )}
        </div>

        <div className="table-wrapper">
          <table className="seating-table">
            <thead>
              <tr>
                <th className="subject-column">Subject</th>
                {dates.map(date => (
                  allRooms.map(room => (
                    <th key={`${date}-${room}`} className="room-column">
                      {room}
                    </th>
                  ))
                ))}
              </tr>
              <tr className="date-row">
                <td></td>
                {dates.map(date => (
                  <td key={date} colSpan={allRooms.length} className="date-cell">
                    {date}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => (
                <tr key={idx}>
                  <td className="subject-cell">
                    <div className="subject-info">
                      <div className="subject-code">{row.subject.code}</div>
                      <div className="subject-name">{row.subject.name}</div>
                    </div>
                  </td>
                  {dates.map(date => (
                    allRooms.map(room => {
                      const key = `${date}-${room}`;
                      const cellData = row.cells[key];
                      return (
                        <td key={key} className={cellData ? 'filled-cell' : 'empty-cell'}>
                          {cellData ? cellData.studentCount : ''}
                        </td>
                      );
                    })
                  ))}
                </tr>
              ))}
              <tr className="total-row">
                <td className="total-label">Total Students</td>
                {dates.map(date => (
                  allRooms.map(room => (
                    <td key={`total-${date}-${room}`} className="total-cell">
                      {getTotalForDateRoom(date, room)}
                    </td>
                  ))
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty Assignment Sheet */}
      <div className="seating-plan-sheet faculty-assignment-sheet">
        <div className="sheet-header">
          <h3>Faculty Invigilation Duty Assignment</h3>
          <h4>{data.examTitle} {data.dateRange}</h4>
          {selectedDate !== 'all' && (
            <p className="selected-date-info">Showing assignments for: <strong>{selectedDate}</strong></p>
          )}
        </div>

        <div className="table-wrapper">
          <table className="seating-table faculty-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Room No.</th>
                <th>Subject</th>
                <th>Total Students</th>
                <th>Faculty Assigned</th>
              </tr>
            </thead>
            <tbody>
              {dates.map(date => {
                const dateRows = [];
                data.schedule[date].forEach(subject => {
                  subject.rooms.forEach(room => {
                    if (room.faculties && room.faculties.length > 0) {
                      dateRows.push(
                        <tr key={`${date}-${room.roomNumber}-${subject.subjectCode}`}>
                          <td>{date}</td>
                          <td>{room.roomNumber}</td>
                          <td>
                            <div className="subject-info">
                              <div className="subject-code">{subject.subjectCode}</div>
                              <div className="subject-name">{subject.subjectName}</div>
                            </div>
                          </td>
                          <td>{room.studentCount}</td>
                          <td>
                            <div className="faculty-assignment-list">
                              {room.faculties.map((faculty, idx) => (
                                <div key={idx} className={`assigned-faculty ${faculty.type === 'Inhouse' ? 'faculty-inhouse' : 'faculty-outsourced'}`}>
                                  {faculty.name} ({faculty.post})
                                  <span className="faculty-badge">{faculty.type}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  });
                });
                return dateRows;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SeatingPlanOutput;
