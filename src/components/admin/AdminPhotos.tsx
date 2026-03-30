import { useState, useEffect, useRef } from 'react';
import {
  api,
  type Photo,
  type Destination,
  type UploadPhotoDto,
} from '../../services/api';
import './AdminPhotos.css';

export default function AdminPhotos() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDestinationId) {
      loadPhotos(selectedDestinationId);
    }
  }, [selectedDestinationId]);

  // Cleanup blob URLs when photos change or component unmounts
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, [photos]);

  async function loadData() {
    try {
      setIsLoading(true);
      const dests = await api.getDestinations();
      setDestinations(dests);
      if (dests.length > 0 && !selectedDestinationId) {
        setSelectedDestinationId(dests[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPhotos(destinationId: string) {
    try {
      const data = await api.getPhotos(destinationId);
      setPhotos(data.sort((a, b) => a.order - b.order));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    }
  }

  async function handleUploadComplete(newPhotos: Photo[]) {
    setPhotos((prev) => [...prev, ...newPhotos]);
    setShowUploadForm(false);
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Delete this photo?')) return;
    try {
      await api.deletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  }

  async function handleToggleVisibility(photo: Photo) {
    try {
      await api.updatePhoto(photo.id, { visible: !photo.visible });
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, visible: !p.visible } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update photo');
    }
  }

  async function handleReorder(newOrder: Photo[]) {
    const photoIds = newOrder.map((p) => p.id);
    try {
      await api.reorderPhotos(selectedDestinationId, photoIds);
      setPhotos(newOrder.map((p, i) => ({ ...p, order: i })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder photos');
    }
  }

  if (isLoading) {
    return <div className="admin-content-loading">Loading photos...</div>;
  }

  if (destinations.length === 0) {
    return (
      <div className="admin-empty-state">
        <span className="admin-empty-state-icon">🗺️</span>
        <h2 className="admin-empty-state-title">No destinations found</h2>
        <p className="admin-empty-state-desc">
          Please create a destination first before uploading photos
        </p>
      </div>
    );
  }

  const selectedDestination = destinations.find((d) => d.id === selectedDestinationId);

  return (
    <div className="admin-photos">
      <header className="admin-content-header">
        <div>
          <h1 className="admin-content-title">Photos</h1>
          <p className="admin-content-subtitle">
            Upload and manage photos for your destinations
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="admin-btn admin-btn-primary"
          disabled={!selectedDestinationId}
        >
          ⬆️ Upload Photos
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

      <div className="admin-photos-filters">
        <label htmlFor="destination" className="admin-photos-filter-label">
          Destination:
        </label>
        <select
          id="destination"
          value={selectedDestinationId}
          onChange={(e) => setSelectedDestinationId(e.target.value)}
          className="admin-photos-filter-select"
        >
          {destinations.map((dest) => (
            <option key={dest.id} value={dest.id}>
              {dest.continentEmoji} {dest.name}
            </option>
          ))}
        </select>
      </div>

      {photos.length === 0 ? (
        <div className="admin-empty-state admin-empty-state-small">
          <span className="admin-empty-state-icon">📸</span>
          <h3 className="admin-empty-state-title">No photos yet</h3>
          <p className="admin-empty-state-desc">
            Upload photos for {selectedDestination?.name}
          </p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="admin-btn admin-btn-primary"
          >
            Upload Photos
          </button>
        </div>
      ) : (
        <PhotoGrid
          photos={photos}
          onDelete={handleDeletePhoto}
          onToggleVisibility={handleToggleVisibility}
          onReorder={handleReorder}
        />
      )}

      {showUploadForm && selectedDestinationId && (
        <UploadPhotosModal
          destinationId={selectedDestinationId}
          destinationName={selectedDestination?.name || ''}
          onClose={() => setShowUploadForm(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}

interface PhotoGridProps {
  photos: Photo[];
  onDelete: (photoId: string) => void;
  onToggleVisibility: (photo: Photo) => void;
  onReorder: (newOrder: Photo[]) => void;
}

function PhotoGrid({ photos, onDelete, onToggleVisibility, onReorder }: PhotoGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Only update visual state during drag, don't commit changes yet
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    if (draggedIndex === null || draggedIndex === index) return;

    // Now commit the reorder
    const newPhotos = [...photos];
    const draggedItem = newPhotos[draggedIndex];
    newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(index, 0, draggedItem);

    onReorder(newPhotos);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  // Calculate display order for visual feedback during drag
  const displayPhotos = [...photos];
  if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
    const draggedItem = displayPhotos[draggedIndex];
    displayPhotos.splice(draggedIndex, 1);
    displayPhotos.splice(dragOverIndex, 0, draggedItem);
  }

  return (
    <div className="admin-photos-grid">
      {displayPhotos.map((photo, index) => {
        const originalIndex = photos.findIndex((p) => p.id === photo.id);
        return (
          <div
            key={photo.id}
            draggable
            onDragStart={() => handleDragStart(originalIndex)}
            onDragOver={(e) => handleDragOver(e, originalIndex)}
            onDrop={() => handleDrop(originalIndex)}
            onDragEnd={handleDragEnd}
            className={`admin-photo-card${draggedIndex === originalIndex ? ' admin-photo-card-dragging' : ''}`}
          >
          <div className="admin-photo-card-image-wrapper">
            <img
              src={photo.url}
              alt={photo.caption || 'Photo'}
              className="admin-photo-card-image"
            />
            {!photo.visible && (
              <div className="admin-photo-card-hidden-overlay">
                <span>Hidden</span>
              </div>
            )}
            <div className="admin-photo-card-actions">
              <button
                onClick={() => onToggleVisibility(photo)}
                className="admin-photo-card-action"
                title={photo.visible ? 'Hide' : 'Show'}
              >
                {photo.visible ? '👁️' : '🙈'}
              </button>
              <button
                onClick={() => onDelete(photo.id)}
                className="admin-photo-card-action admin-photo-card-action-danger"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
          <div className="admin-photo-card-info">
            <span className="admin-photo-card-order">#{index + 1}</span>
            <p className="admin-photo-card-caption">
              {photo.caption || <em>No caption</em>}
            </p>
          </div>
        </div>
        );
      })}
    </div>
  );
}

interface UploadPhotosModalProps {
  destinationId: string;
  destinationName: string;
  onClose: () => void;
  onUploadComplete: (photos: Photo[]) => void;
}

function UploadPhotosModal({
  destinationId,
  destinationName,
  onClose,
  onUploadComplete,
}: UploadPhotosModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs on unmount or when files change
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  function handleFileSelect(selectedFiles: FileList | null) {
    if (!selectedFiles) return;
    const imageFiles = Array.from(selectedFiles).filter((file) =>
      file.type.startsWith('image/')
    );
    if (imageFiles.length === 0) {
      setError('Please select image files only');
      return;
    }
    
    // Create blob URLs for previews
    const newUrls = imageFiles.map((file) => URL.createObjectURL(file));
    
    setFiles((prev) => [...prev, ...imageFiles]);
    setPreviewUrls((prev) => [...prev, ...newUrls]);
    setError('');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function removeFile(index: number) {
    // Revoke the blob URL before removing
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCaption(index: number, caption: string) {
    setCaptions((prev) => ({ ...prev, [index]: caption }));
  }

  async function handleUpload() {
    if (files.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const uploadedPhotos: Photo[] = [];
      for (let i = 0; i < files.length; i++) {
        const dto: UploadPhotoDto = {
          destinationId,
          file: files[i],
          caption: captions[i] || '',
        };
        const photo = await api.uploadPhoto(dto);
        uploadedPhotos.push(photo);
      }
      onUploadComplete(uploadedPhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos');
      setIsUploading(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Upload Photos</h2>
          <button onClick={onClose} className="admin-modal-close">
            ✕
          </button>
        </div>

        <div className="admin-upload-destination">
          <span className="admin-upload-destination-label">Destination:</span>
          <strong>{destinationName}</strong>
        </div>

        <div
          className={`admin-upload-dropzone${isDragging ? ' admin-upload-dropzone-active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="admin-upload-dropzone-icon">📤</span>
          <p className="admin-upload-dropzone-text">
            Drag & drop photos here, or click to select
          </p>
          <p className="admin-upload-dropzone-hint">
            Supports JPG, PNG, WEBP. Max 10 MB per file.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="admin-upload-input"
          />
        </div>

        {files.length > 0 && (
          <div className="admin-upload-preview">
            <h3 className="admin-upload-preview-title">
              Selected Photos ({files.length})
            </h3>
            <div className="admin-upload-preview-grid">
              {files.map((file, index) => (
                <div key={index} className="admin-upload-preview-item">
                  <div className="admin-upload-preview-image-wrapper">
                    <img
                      src={previewUrls[index]}
                      alt={file.name}
                      className="admin-upload-preview-image"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="admin-upload-preview-remove"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={captions[index] || ''}
                    onChange={(e) => updateCaption(index, e.target.value)}
                    className="admin-upload-preview-caption"
                  />
                  <span className="admin-upload-preview-filename">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="admin-form-error">{error}</div>}

        <div className="admin-form-actions">
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            className="admin-btn admin-btn-primary"
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? `Uploading ${files.length} photos...` : `Upload ${files.length} photos`}
          </button>
        </div>
      </div>
    </div>
  );
}
