import { useState } from 'react';

const TimetableInput = ({ onSubmit }) => {
  const [examTitle, setExamTitle] = useState('End Semester Examination');
  const [university, setUniversity] = useState('International Institute of Professional Studies\nD.A. University, Indore');
  const [dateRange, setDateRange] = useState('November - December 2025 (08.12.2025)');
  const [subjects, setSubjects] = useState([
    { id: 1, name: '', code: '', schedule: [{ date: '', rooms: [{ number: '', studentCount: '' }] }] }
  ]);

  const addSubject = () => {
    setSubjects([...subjects, { 
      id: Date.now(), 
      name: '', 
      code: '',
      schedule: [{ date: '', rooms: [{ number: '', studentCount: '' }] }] 
    }]);
  };

  const removeSubject = (id) => {
    setSubjects(subjects.filter(subject => subject.id !== id));
  };

  const updateSubject = (id, field, value) => {
    setSubjects(subjects.map(subject => 
      subject.id === id ? { ...subject, [field]: value } : subject
    ));
  };

  const addScheduleSlot = (subjectId) => {
    setSubjects(subjects.map(subject => 
      subject.id === subjectId 
        ? { ...subject, schedule: [...subject.schedule, { date: '', rooms: [{ number: '', studentCount: '' }] }] }
        : subject
    ));
  };

  const updateScheduleSlot = (subjectId, slotIndex, field, value) => {
    setSubjects(subjects.map(subject => 
      subject.id === subjectId 
        ? {
            ...subject,
            schedule: subject.schedule.map((slot, idx) => 
              idx === slotIndex ? { ...slot, [field]: value } : slot
            )
          }
        : subject
    ));
  };

  const addRoom = (subjectId, slotIndex) => {
    setSubjects(subjects.map(subject => 
      subject.id === subjectId 
        ? {
            ...subject,
            schedule: subject.schedule.map((slot, idx) => 
              idx === slotIndex 
                ? { ...slot, rooms: [...slot.rooms, { number: '', studentCount: '' }] }
                : slot
            )
          }
        : subject
    ));
  };

  const updateRoom = (subjectId, slotIndex, roomIndex, field, value) => {
    setSubjects(subjects.map(subject => 
      subject.id === subjectId 
        ? {
            ...subject,
            schedule: subject.schedule.map((slot, sIdx) => 
              sIdx === slotIndex 
                ? {
                    ...slot,
                    rooms: slot.rooms.map((room, rIdx) => 
                      rIdx === roomIndex ? { ...room, [field]: value } : room
                    )
                  }
                : slot
            )
          }
        : subject
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      examTitle,
      university,
      dateRange,
      subjects
    });
  };

  return (
    <div className="input-section">
      <h2>Enter Timetable Data</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Exam Title:</label>
          <input 
            type="text" 
            value={examTitle} 
            onChange={(e) => setExamTitle(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>University/Institute:</label>
          <textarea 
            value={university} 
            onChange={(e) => setUniversity(e.target.value)}
            className="form-control"
            rows="2"
          />
        </div>

        <div className="form-group">
          <label>Date Range:</label>
          <input 
            type="text" 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="subjects-section">
          <h3>Subjects</h3>
          {subjects.map((subject, subjectIdx) => (
            <div key={subject.id} className="subject-card">
              <div className="subject-header">
                <h4>Subject {subjectIdx + 1}</h4>
                {subjects.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeSubject(subject.id)}
                    className="btn-remove"
                  >
                    Remove Subject
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subject Code:</label>
                  <input 
                    type="text" 
                    value={subject.code} 
                    onChange={(e) => updateSubject(subject.id, 'code', e.target.value)}
                    className="form-control"
                    placeholder="e.g., IM-711MA"
                  />
                </div>
                <div className="form-group">
                  <label>Subject Name:</label>
                  <input 
                    type="text" 
                    value={subject.name} 
                    onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                    className="form-control"
                    placeholder="e.g., Consumer Behavior"
                  />
                </div>
              </div>

              <div className="schedule-section">
                <h5>Schedule Slots</h5>
                {subject.schedule.map((slot, slotIdx) => (
                  <div key={slotIdx} className="schedule-slot">
                    <div className="form-group">
                      <label>Date:</label>
                      <input 
                        type="text" 
                        value={slot.date} 
                        onChange={(e) => updateScheduleSlot(subject.id, slotIdx, 'date', e.target.value)}
                        className="form-control"
                        placeholder="e.g., 201 (room/date code)"
                      />
                    </div>

                    <div className="rooms-section">
                      <h6>Rooms</h6>
                      {slot.rooms.map((room, roomIdx) => (
                        <div key={roomIdx} className="room-row">
                          <input 
                            type="text" 
                            value={room.number} 
                            onChange={(e) => updateRoom(subject.id, slotIdx, roomIdx, 'number', e.target.value)}
                            className="form-control"
                            placeholder="Room No."
                          />
                          <input 
                            type="number" 
                            value={room.studentCount} 
                            onChange={(e) => updateRoom(subject.id, slotIdx, roomIdx, 'studentCount', e.target.value)}
                            className="form-control"
                            placeholder="Students"
                          />
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => addRoom(subject.id, slotIdx)}
                        className="btn-add-small"
                      >
                        + Add Room
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addScheduleSlot(subject.id)}
                  className="btn-add"
                >
                  + Add Schedule Slot
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addSubject} className="btn-add-subject">
            + Add Subject
          </button>
        </div>

        <button type="submit" className="btn-submit">
          Generate Seating Plan
        </button>
      </form>
    </div>
  );
};

export default TimetableInput;
