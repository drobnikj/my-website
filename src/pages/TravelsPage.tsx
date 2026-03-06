import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { getTravelPlaces } from '../data/travels';
import type { TravelPlace } from '../data/travels';
import TravelModal from '../components/TravelModal';
import './TravelsPage.css';
import { useLanguage } from '../contexts/LanguageContext';

const TravelMap = lazy(() => import('../components/TravelMap'));

function useScrollReveal(deps: unknown[] = []) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

export default function TravelsPage() {
  const { t } = useLanguage();
  const travelPlaces = useMemo(() => getTravelPlaces(t), [t]);
  const totalPhotos = useMemo(() => travelPlaces.reduce((sum, p) => sum + p.photos.length, 0), [travelPlaces]);
  const continents = useMemo(() => new Set(travelPlaces.map(p => p.continent)).size, [travelPlaces]);
  const availableYears = useMemo(() => [...new Set(travelPlaces.map(p => p.year))].sort((a, b) => b - a), [travelPlaces]);

  const stats = useMemo(() => [
    { label: t('travels.stats.destinations'), value: travelPlaces.length, icon: '🌍' },
    { label: t('travels.stats.continents'), value: continents, icon: '✈️' },
    { label: t('travels.stats.photos'), value: totalPhotos, icon: '📸' },
    { label: t('travels.stats.memories'), value: '∞', icon: '💙' },
  ], [t, travelPlaces.length, continents, totalPhotos]);

  const [selectedPlace, setSelectedPlace] = useState<TravelPlace | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const filteredPlaces = useMemo(
    () => selectedYear === null ? travelPlaces : travelPlaces.filter(p => p.year === selectedYear),
    [selectedYear, travelPlaces],
  );

  const scrollRef = useScrollReveal([filteredPlaces]);

  return (
    <div className="travels-page" ref={scrollRef}>
      <section className="travels-hero">
        <span className="travels-hero-emoji">🧳</span>
        <h1 className="travels-hero-title">
          {t('travels.hero.title.part1')}{' '}
          <span className="travels-hero-accent">{t('travels.hero.title.part2')}</span>
        </h1>
        <p className="travels-hero-subtitle">
          {t('travels.hero.subtitle')}
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
        <Suspense fallback={<div className="travel-map-loading travels-map-full">{t('travels.loading-map')}</div>}>
          <TravelMap className="travels-map-full" filterYear={selectedYear} />
        </Suspense>
      </section>

      <section className="travels-destinations">
        <h2 className="travels-destinations-title">
          {t('travels.destinations-title')}
        </h2>

        <div className="year-filter">
          <button
            className={`year-chip${selectedYear === null ? ' active' : ''}`}
            onClick={() => setSelectedYear(null)}
          >
            {t('travels.year-filter.all')}
          </button>
          {availableYears.map((year) => (
            <button
              key={year}
              className={`year-chip${selectedYear === year ? ' active' : ''}`}
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </button>
          ))}
        </div>

        <div className="destinations-grid">
          {filteredPlaces.map((place, index) => (
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
                  <span className="destination-card-view">{t('travels.card.view')}</span>
                </div>
              </div>
              <div className="destination-card-info">
                <div className="destination-card-header">
                  <h3 className="destination-card-name">
                    {place.continentEmoji} {place.name}
                  </h3>
                  <span className="destination-card-photos">{place.photos.length} {t('travels.card.photos')}</span>
                </div>
                <p className="destination-card-desc">{place.description}</p>
                <div className="destination-card-tags">
                  <span className="destination-card-continent">{place.continent}</span>
                  <span className="destination-card-year">{place.year}</span>
                </div>
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
