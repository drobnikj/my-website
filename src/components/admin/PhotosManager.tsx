import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import './PhotosManager.css';

interface Photo {
  id: string;
  destination_id: string;
  full_url: string;
  thumb_url: string;
  blur_url: string | null;
  caption_en: string | null;
  caption_cs: string | null;
  sort_order: number;
  is_visible: number;
  created_at: string;
}

interface Destination {
  id: string;
  name_en: string;
  name_cs: string;
}

export default function PhotosManager() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    if (selectedDestination) {
      fetchPhotos();
    } else {
      setPhotos([]);
    }
  }, [selectedDestination]);

  const fetchDestinations = async () => {
    try {
      const response = await fetch('/api/destinations');
      if (!response.ok) throw new Error('Failed to fetch destinations');
      const result = await response.json();
      setDestinations(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchPhotos = async () => {
    if (!selectedDestination) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/destinations/${selectedDestination}`);
      if (!response.ok) throw new Error('Failed to fetch photos');
      const result = await response.json();
      setPhotos(result.data.photos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!selectedDestination) {
      setError('Please select a destination first');
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      await uploadPhoto(file);
    }
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('destination_id', selectedDestination);
      formData.append('sort_order', '0');
      formData.append('is_visible', 'true');

      const response = await fetch('/admin/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      await fetchPhotos();
      queryClient.invalidateQueries({ queryKey: ['destinations', selectedDestination] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const updatePhoto = async (photo: Photo) => {
    try {
      const response = await fetch(`/admin/photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption_en: photo.caption_en || null,
          caption_cs: photo.caption_cs || null,
          sort_order: photo.sort_order,
          is_visible: photo.is_visible === 1,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Update failed');
      }

      await fetchPhotos();
      setEditingPhoto(null);
      queryClient.invalidateQueries({ queryKey: ['destinations', selectedDestination] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deletePhoto = async (id: string) => {
    if (!confirm('Delete this photo?')) return;

    try {
      const response = await fetch(`/admin/photos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Delete failed');
      }

      await fetchPhotos();
      queryClient.invalidateQueries({ queryKey: ['destinations', selectedDestination] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const movePhoto = async (photo: Photo, direction: 'up' | 'down') => {
    const currentIndex = photos.findIndex(p => p.id === photo.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= photos.length) return;

    const newPhotos = [...photos];
    [newPhotos[currentIndex], newPhotos[swapIndex]] = [newPhotos[swapIndex], newPhotos[currentIndex]];

    // Update sort_order for both photos
    newPhotos[currentIndex].sort_order = currentIndex;
    newPhotos[swapIndex].sort_order = swapIndex;

    setPhotos(newPhotos);

    // Save to server
    try {
      await Promise.all([
        fetch(`/admin/photos/${newPhotos[currentIndex].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: currentIndex }),
        }),
        fetch(`/admin/photos/${newPhotos[swapIndex].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: swapIndex }),
        }),
      ]);
      queryClient.invalidateQueries({ queryKey: ['destinations', selectedDestination] });
    } catch (err) {
      setError('Failed to update sort order');
      fetchPhotos(); // Revert on error
    }
  };

  return (
    <div className="photos-manager">
      <div className="manager-header">
        <h2>📸 Photos</h2>
        <div className="destination-selector">
          <label htmlFor="destination-select">Destination:</label>
          <select
            id="destination-select"
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
          >
            <option value="">Select a destination</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name_en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {selectedDestination && (
        <>
          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <div className="upload-icon">📤</div>
            <p className="upload-text">
              {uploading ? 'Uploading...' : 'Drop images here or click to browse'}
            </p>
            <p className="upload-hint">Supports JPG, PNG, WebP</p>
          </div>

          {loading ? (
            <div className="loading">Loading photos...</div>
          ) : photos.length === 0 ? (
            <div className="empty-state">
              <p>No photos yet. Upload some!</p>
            </div>
          ) : (
            <div className="photos-grid">
              {photos.map((photo, index) => (
                <div key={photo.id} className="photo-card">
                  <div className="photo-preview">
                    <img
                      src={`/api/images/${photo.thumb_url}`}
                      alt={photo.caption_en || 'Photo'}
                      loading="lazy"
                    />
                    <div className="photo-overlay">
                      {photo.is_visible === 0 && (
                        <span className="badge badge-hidden">Hidden</span>
                      )}
                    </div>
                  </div>

                  {editingPhoto?.id === photo.id ? (
                    <div className="photo-edit-form">
                      <input
                        type="text"
                        placeholder="Caption (EN)"
                        value={editingPhoto.caption_en || ''}
                        onChange={(e) =>
                          setEditingPhoto({ ...editingPhoto, caption_en: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Caption (CS)"
                        value={editingPhoto.caption_cs || ''}
                        onChange={(e) =>
                          setEditingPhoto({ ...editingPhoto, caption_cs: e.target.value })
                        }
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editingPhoto.is_visible === 1}
                          onChange={(e) =>
                            setEditingPhoto({
                              ...editingPhoto,
                              is_visible: e.target.checked ? 1 : 0,
                            })
                          }
                        />
                        Visible
                      </label>
                      <div className="form-actions-inline">
                        <button
                          className="btn-small btn-primary"
                          onClick={() => updatePhoto(editingPhoto)}
                        >
                          Save
                        </button>
                        <button
                          className="btn-small btn-secondary"
                          onClick={() => setEditingPhoto(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="photo-info">
                      <p className="photo-caption">
                        {photo.caption_en || <em>No caption</em>}
                      </p>
                    </div>
                  )}

                  <div className="photo-actions">
                    <button
                      className="btn-icon"
                      onClick={() => movePhoto(photo, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ⬆️
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => movePhoto(photo, 'down')}
                      disabled={index === photos.length - 1}
                      title="Move down"
                    >
                      ⬇️
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => setEditingPhoto(photo)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => deletePhoto(photo.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
