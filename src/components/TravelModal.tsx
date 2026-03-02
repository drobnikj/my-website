import { useState, useEffect, useCallback } from 'react';
import type { TravelPlace } from '../data/travels';

interface Props {
  place: TravelPlace;
  onClose: () => void;
}

export default function TravelModal({ place, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const next = useCallback(() => {
    setLoaded(false);
    setActiveIndex((i) => (i + 1) % place.photos.length);
  }, [place.photos.length]);

  const prev = useCallback(() => {
    setLoaded(false);
    setActiveIndex((i) => (i - 1 + place.photos.length) % place.photos.length);
  }, [place.photos.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, next, prev]);

  // Reset index when place changes
  useEffect(() => {
    setActiveIndex(0);
    setLoaded(false);
  }, [place.id]);

  return (
    <div className="travel-modal-overlay" onClick={onClose}>
      <div className="travel-modal" onClick={(e) => e.stopPropagation()}>
        <button className="travel-modal-close" onClick={onClose}>✕</button>
        <h3 className="travel-modal-title">{place.continentEmoji} {place.name}</h3>
        <p className="travel-modal-desc">{place.description}</p>
        <div className="travel-modal-carousel">
          {/* Blur placeholder */}
          {!loaded && place.blurs[activeIndex] && (
            <img
              src={place.blurs[activeIndex]}
              alt=""
              className="carousel-blur"
            />
          )}
          <button className="carousel-btn carousel-prev" onClick={prev}>‹</button>
          <img
            src={place.photos[activeIndex]}
            alt={`${place.name} ${activeIndex + 1}`}
            className="carousel-img-main"
            onLoad={() => setLoaded(true)}
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          />
          <button className="carousel-btn carousel-next" onClick={next}>›</button>
        </div>
        {place.photos.length > 1 && (
          <div className="carousel-dots">
            {place.photos.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === activeIndex ? 'active' : ''}`}
                onClick={() => { setLoaded(false); setActiveIndex(i); }}
              />
            ))}
          </div>
        )}
        <div className="travel-modal-thumbs">
          {place.thumbs.map((thumb, i) => (
            <img
              key={i}
              src={thumb}
              alt={`${place.name} thumb ${i + 1}`}
              className={`thumb ${i === activeIndex ? 'active' : ''}`}
              onClick={() => { setLoaded(false); setActiveIndex(i); }}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
