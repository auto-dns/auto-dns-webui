import RecordList from './pages/RecordList';
import './styles/App.css';

export default function App() {
  return (
    <div className="records-container">
      <h1>DNS Records</h1>
      <RecordList/>
    </div>
  );
}
