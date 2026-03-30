import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import './DestinationsManager.css';

interface Destination {
  id: string;
  name_en: string;
  name_cs: string;
  description_en: string;
  description_cs: string;
  lat: number;
  lng: number;
  continent: string;
  visited_at_year: number;
  visited_from?: string;
  visited_to?: string;
  created_at?: string;
  updated_at?: string;
}

const CONTINENTS = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
];

const emptyDestination: Omit<Destination, 'created_at' | 'updated_at'> = {
  id: '',
  name_en: '',
  name_cs: '',
  description_en: '',
  description_cs: '',
  lat: 0,
  lng: 0,
  continent: 'Europe',
  visited_at_year: new Date().getFullYear(),
  visited_from: '',
  visited_to: '',
};

export default function DestinationsManager() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyDestination);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/destinations');
      if (!response.ok) throw new Error('Failed to fetch destinations');
      const result = await response.json();
      setDestinations(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/admin/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          visited_from: formData.visited_from || null,
          visited_to: formData.visited_to || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create destination');
      }

      await fetchDestinations();
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      setShowForm(false);
      setFormData(emptyDestination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/admin/destinations/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update destination');
      }

      await fetchDestinations();
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      setEditingId(null);
      setShowForm(false);
      setFormData(emptyDestination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete destination "${id}"? This will also delete all photos.`)) {
      return;
    }

    try {
      const response = await fetch(`/admin/destinations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete destination');
      }

      await fetchDestinations();
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const startEdit = (dest: Destination) => {
    setEditingId(dest.id);
    setFormData(dest);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData(emptyDestination);
    setError(null);
  };

  if (loading) {
    return <div className="loading">Loading destinations...</div>;
  }

  return (
    <div className="destinations-manager">
      <div className="manager-header">
        <h2>🗺️ Destinations ({destinations.length})</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            ➕ Add Destination
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showForm && (
        <form className="destination-form" onSubmit={editingId ? handleUpdate : handleCreate}>
          <h3>{editingId ? '✏️ Edit Destination' : '➕ New Destination'}</h3>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="id">ID (lowercase, hyphens only) *</label>
              <input
                id="id"
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                pattern="[a-z0-9-]+"
                required
                disabled={!!editingId}
              />
            </div>
            <div className="form-field">
              <label htmlFor="continent">Continent *</label>
              <select
                id="continent"
                value={formData.continent}
                onChange={(e) => setFormData({ ...formData, continent: e.target.value })}
                required
              >
                {CONTINENTS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="name_en">Name (English) *</label>
              <input
                id="name_en"
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="name_cs">Name (Czech) *</label>
              <input
                id="name_cs"
                type="text"
                value={formData.name_cs}
                onChange={(e) => setFormData({ ...formData, name_cs: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="description_en">Description (English) *</label>
            <textarea
              id="description_en"
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="description_cs">Description (Czech) *</label>
            <textarea
              id="description_cs"
              value={formData.description_cs}
              onChange={(e) => setFormData({ ...formData, description_cs: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="lat">Latitude (-90 to 90) *</label>
              <input
                id="lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                min="-90"
                max="90"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="lng">Longitude (-180 to 180) *</label>
              <input
                id="lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                min="-180"
                max="180"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="visited_at_year">Year Visited *</label>
              <input
                id="visited_at_year"
                type="number"
                value={formData.visited_at_year}
                onChange={(e) => setFormData({ ...formData, visited_at_year: parseInt(e.target.value) })}
                min="1900"
                max="2100"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="visited_from">From (optional)</label>
              <input
                id="visited_from"
                type="date"
                value={formData.visited_from || ''}
                onChange={(e) => setFormData({ ...formData, visited_from: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="visited_to">To (optional)</label>
              <input
                id="visited_to"
                type="date"
                value={formData.visited_to || ''}
                onChange={(e) => setFormData({ ...formData, visited_to: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="destinations-grid">
        {destinations.map((dest) => (
          <div key={dest.id} className="destination-card">
            <div className="destination-header">
              <h3>{dest.name_en}</h3>
              <span className="destination-year">{dest.visited_at_year}</span>
            </div>
            <p className="destination-continent">{dest.continent}</p>
            <p className="destination-coords">
              📍 {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
            </p>
            <p className="destination-description">{dest.description_en}</p>
            <div className="destination-actions">
              <button className="btn-icon" onClick={() => startEdit(dest)} title="Edit">
                ✏️
              </button>
              <button className="btn-icon btn-danger" onClick={() => handleDelete(dest.id)} title="Delete">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
