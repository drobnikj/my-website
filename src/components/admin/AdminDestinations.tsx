import { useState, useEffect } from 'react';
import { api, type Destination, type CreateDestinationDto } from '../../services/api';
import './AdminDestinations.css';

const CONTINENTS = [
  { name: 'Europe', emoji: '🏰' },
  { name: 'Asia', emoji: '⛩️' },
  { name: 'North America', emoji: '🗽' },
  { name: 'South America', emoji: '🌎' },
  { name: 'Africa', emoji: '🦁' },
  { name: 'Oceania', emoji: '🏝️' },
];

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDestinations();
  }, []);

  async function loadDestinations() {
    try {
      setIsLoading(true);
      const data = await api.getDestinations();
      setDestinations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load destinations');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete destination "${name}"? This will also delete all its photos.`)) {
      return;
    }
    try {
      await api.deleteDestination(id);
      setDestinations((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete destination');
    }
  }

  function handleEdit(destination: Destination) {
    setEditingId(destination.id);
    setShowForm(true);
  }

  function handleFormClose(newDestination?: Destination) {
    setShowForm(false);
    setEditingId(null);
    if (newDestination) {
      if (editingId) {
        setDestinations((prev) =>
          prev.map((d) => (d.id === editingId ? newDestination : d))
        );
      } else {
        setDestinations((prev) => [...prev, newDestination]);
      }
    }
  }

  if (isLoading) {
    return <div className="admin-content-loading">Loading destinations...</div>;
  }

  const editingDestination = editingId
    ? destinations.find((d) => d.id === editingId)
    : undefined;

  return (
    <div className="admin-destinations">
      <header className="admin-content-header">
        <div>
          <h1 className="admin-content-title">Destinations</h1>
          <p className="admin-content-subtitle">
            Manage travel destinations and their metadata
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="admin-btn admin-btn-primary"
        >
          ➕ Add Destination
        </button>
      </header>

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
          <button onClick={() => setError('')} className="admin-alert-close">
            ✕
          </button>
        </div>
      )}

      {destinations.length === 0 ? (
        <div className="admin-empty-state">
          <span className="admin-empty-state-icon">🗺️</span>
          <h2 className="admin-empty-state-title">No destinations yet</h2>
          <p className="admin-empty-state-desc">
            Start by adding your first travel destination
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="admin-btn admin-btn-primary"
          >
            Add Destination
          </button>
        </div>
      ) : (
        <div className="admin-destinations-grid">
          {destinations.map((dest) => (
            <div key={dest.id} className="admin-destination-card">
              <div className="admin-destination-card-header">
                <h3 className="admin-destination-card-title">
                  {dest.continentEmoji} {dest.name}
                </h3>
                <div className="admin-destination-card-actions">
                  <button
                    onClick={() => handleEdit(dest)}
                    className="admin-btn-icon"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(dest.id, dest.name)}
                    className="admin-btn-icon admin-btn-icon-danger"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="admin-destination-card-desc">{dest.description}</p>
              <div className="admin-destination-card-meta">
                <span className="admin-destination-card-meta-item">
                  📍 {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
                </span>
                <span className="admin-destination-card-meta-item">
                  🌍 {dest.continent}
                </span>
                <span className="admin-destination-card-meta-item">
                  📅 {dest.visitDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DestinationFormModal
          destination={editingDestination}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}

interface DestinationFormModalProps {
  destination?: Destination;
  onClose: (newDestination?: Destination) => void;
}

function DestinationFormModal({ destination, onClose }: DestinationFormModalProps) {
  const [formData, setFormData] = useState<CreateDestinationDto>({
    name: destination?.name || '',
    description: destination?.description || '',
    lat: destination?.lat || 0,
    lng: destination?.lng || 0,
    continent: destination?.continent || 'Europe',
    continentEmoji: destination?.continentEmoji || '🏰',
    visitDate: destination?.visitDate || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField<K extends keyof CreateDestinationDto>(
    field: K,
    value: CreateDestinationDto[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleContinentChange(continentName: string) {
    const continent = CONTINENTS.find((c) => c.name === continentName);
    if (continent) {
      updateField('continent', continent.name);
      updateField('continentEmoji', continent.emoji);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate latitude and longitude bounds
    if (formData.lat < -90 || formData.lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }
    if (formData.lng < -180 || formData.lng > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    setIsSaving(true);

    try {
      if (destination) {
        const updated = await api.updateDestination(destination.id, formData);
        onClose(updated);
      } else {
        const created = await api.createDestination(formData);
        onClose(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save destination');
      setIsSaving(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={() => onClose()}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">
            {destination ? 'Edit Destination' : 'New Destination'}
          </h2>
          <button onClick={() => onClose()} className="admin-modal-close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="name" className="admin-form-label">
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
                className="admin-form-input"
                placeholder="e.g., Prague"
              />
            </div>
          </div>

          <div className="admin-form-field">
            <label htmlFor="description" className="admin-form-label">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              required
              rows={3}
              className="admin-form-textarea"
              placeholder="Short description of the place"
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="lat" className="admin-form-label">
                Latitude * (-90 to 90)
              </label>
              <input
                id="lat"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={formData.lat}
                onChange={(e) => updateField('lat', parseFloat(e.target.value))}
                required
                className="admin-form-input"
                placeholder="50.0755"
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="lng" className="admin-form-label">
                Longitude * (-180 to 180)
              </label>
              <input
                id="lng"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={formData.lng}
                onChange={(e) => updateField('lng', parseFloat(e.target.value))}
                required
                className="admin-form-input"
                placeholder="14.4378"
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="continent" className="admin-form-label">
                Continent *
              </label>
              <select
                id="continent"
                value={formData.continent}
                onChange={(e) => handleContinentChange(e.target.value)}
                required
                className="admin-form-select"
              >
                {CONTINENTS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="visitDate" className="admin-form-label">
                Visit Date *
              </label>
              <input
                id="visitDate"
                type="text"
                value={formData.visitDate}
                onChange={(e) => updateField('visitDate', e.target.value)}
                required
                className="admin-form-input"
                placeholder="e.g., March 2024"
              />
            </div>
          </div>

          {error && <div className="admin-form-error">{error}</div>}

          <div className="admin-form-actions">
            <button
              type="button"
              onClick={() => onClose()}
              className="admin-btn admin-btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : destination ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
