import { useState } from 'react';
import Head from 'next/head';
import ExcelUpload from '@/components/ExcelUpload';
import TimetableInput from '@/components/TimetableInput';
import SeatingPlanOutput from '@/components/SeatingPlanOutput';

export default function Home() {
  const [timetableData, setTimetableData] = useState(null);
  const [seatingPlan, setSeatingPlan] = useState(null);
  const [inputMode, setInputMode] = useState('excel'); // 'excel' or 'manual'

  const handleTimetableSubmit = (data) => {
    setTimetableData(data);
    // Process the timetable data to generate seating plan
    processSeatingPlan(data);
  };

  const handleExcelData = (data) => {
    setTimetableData(data);
    // Process the timetable data to generate seating plan
    processSeatingPlan(data);
  };

  const processSeatingPlan = (data) => {
    // Extract day-wise schedule from timetable
    const dayWiseSchedule = {};
    
    data.subjects.forEach(subject => {
      subject.schedule.forEach(slot => {
        const { date, rooms } = slot;
        if (!dayWiseSchedule[date]) {
          dayWiseSchedule[date] = [];
        }
        dayWiseSchedule[date].push({
          subjectName: subject.name,
          subjectCode: subject.code,
          rooms: rooms.map(room => ({
            roomNumber: room.number,
            studentCount: room.studentCount,
            aggregatedStudentCount: room.aggregatedStudentCount, // Preserve the aggregated count used for faculty assignment
            faculties: room.faculties || []
          }))
        });
      });
    });

    setSeatingPlan({
      examTitle: data.examTitle,
      university: data.university,
      dateRange: data.dateRange,
      schedule: dayWiseSchedule
    });
  };

  return (
    <>
      <Head>
        <title>Examination Timetable & Seating Plan</title>
        <meta name="description" content="Manage examination timetables and seating arrangements" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="container">
        <h1 className="main-title">Examination Timetable & Seating Plan Management</h1>
        
        <div className="input-mode-toggle">
          <button 
            className={`toggle-btn ${inputMode === 'excel' ? 'active' : ''}`}
            onClick={() => setInputMode('excel')}
          >
            📁 Upload Excel
          </button>
          <button 
            className={`toggle-btn ${inputMode === 'manual' ? 'active' : ''}`}
            onClick={() => setInputMode('manual')}
          >
            ✏️ Manual Entry
          </button>
        </div>

        <div className="content-wrapper">
          {inputMode === 'excel' ? (
            <ExcelUpload onDataParsed={handleExcelData} />
          ) : (
            <TimetableInput onSubmit={handleTimetableSubmit} />
          )}
          {seatingPlan && <SeatingPlanOutput data={seatingPlan} />}
        </div>
      </main>
    </>
  );
}
