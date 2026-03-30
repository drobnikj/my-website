import { useState } from 'react';
import './AdminPage.css';
import DestinationsManager from '../components/admin/DestinationsManager';
import PhotosManager from '../components/admin/PhotosManager';

type Tab = 'destinations' | 'photos';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('destinations');

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>✈️ Admin Panel</h1>
        <p className="admin-subtitle">Manage destinations and photos</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'destinations' ? 'active' : ''}`}
          onClick={() => setActiveTab('destinations')}
        >
          🗺️ Destinations
        </button>
        <button
          className={`admin-tab ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          📸 Photos
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'destinations' && <DestinationsManager />}
        {activeTab === 'photos' && <PhotosManager />}
      </div>
    </div>
  );
}
