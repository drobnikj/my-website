import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { travelPlaces } from '../data/travels';
import type { TravelPlace } from '../data/travels';
import TravelModal from '../components/TravelModal';
import './TravelsPage.css';

const TravelMap = lazy(() => import('../components/TravelMap'));

const totalPhotos = travelPlaces.reduce((sum, p) => sum + p.photos.length, 0);
const continents = new Set(travelPlaces.map(p => p.continent)).size;

const stats = [
  { label: 'Destinations', value: travelPlaces.length, icon: '🌍' },
  { label: 'Continents', value: continents, icon: '✈️' },
  { label: 'Drone Photos', value: totalPhotos, icon: '📸' },
  { label: 'Memories', value: '∞', icon: '💙' },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );

    const items = el.querySelectorAll('.reveal-item');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function TravelsPage() {
  const [selectedPlace, setSelectedPlace] = useState<TravelPlace | null>(null);
  const scrollRef = useScrollReveal();

  return (
    <div className="travels-page" ref={scrollRef}>
      <section className="travels-hero">
        <span className="travels-hero-emoji">🧳</span>
        <h1 className="travels-hero-title">
          The world from{' '}
          <span className="travels-hero-accent">above</span>
        </h1>
        <p className="travels-hero-subtitle">
          Exploring the world with a drone — one flight at a time. Here are the places I've captured from the sky.
        </p>
      </section>

      <section className="travels-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="travels-stat reveal-item">
            <span className="travels-stat-icon">{stat.icon}</span>
            <span className="travels-stat-value">{stat.value}</span>
            <span className="travels-stat-label">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="travels-map-section">
        <Suspense fallback={<div className="travel-map-loading travels-map-full">Loading map…</div>}>
          <TravelMap className="travels-map-full" />
        </Suspense>
      </section>

      <section className="travels-destinations">
        <h2 className="travels-destinations-title">
          🗺️ Destinations
        </h2>
        <div className="destinations-grid">
          {travelPlaces.map((place, index) => (
            <div
              key={place.id}
              className="destination-card reveal-item"
              style={{ animationDelay: `${index * 0.08}s` }}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlace(place)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPlace(place);
                }
              }}
            >
              <div className="destination-card-img-wrapper">
                <img
                  src={place.thumbs[0]}
                  alt={place.name}
                  className="destination-card-img"
                  loading="lazy"
                />
                <div className="destination-card-overlay">
                  <span className="destination-card-view">View gallery →</span>
                </div>
              </div>
              <div className="destination-card-info">
                <div className="destination-card-header">
                  <h3 className="destination-card-name">
                    {place.continentEmoji} {place.name}
                  </h3>
                  <span className="destination-card-photos">{place.photos.length} photos</span>
                </div>
                <p className="destination-card-desc">{place.description}</p>
                <span className="destination-card-continent">{place.continent}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedPlace && (
        <TravelModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      )}
    </div>
  );
}
