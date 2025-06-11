import React, { useEffect, useState } from 'react';
import RecordList from './pages/RecordList';
import { Record } from './types';
import './styles/App.css';

function App() {
  return (
    <div className="records-container">
      <h1>DNS Records</h1>
      <RecordList/>
    </div>
  );
}

export default App;