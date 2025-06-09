import React, { useEffect, useState } from 'react';
import RecordTable from './components/RecordTable'; // ✅ use it!
import { Record } from './types';
import './App.css';

function App() {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    fetch('/api/records')
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error('Failed to fetch records:', err));
  }, []);

  return (
    <div className="records-container">
      <h1>DNS Records</h1>
      <RecordTable records={records} /> {/* ✅ renders your table */}
    </div>
  );
}

export default App;