import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { TravelPlace } from '../data/travels';
import TravelModal from '../components/TravelModal';
import './TravelsPage.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useDestinations } from '../hooks/useDestinations';
import { transformDestinationsToPlaces } from '../api/transformers';

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
  const { t, language } = useLanguage();
  const [selectedPlace, setSelectedPlace] = useState<TravelPlace | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Fetch destinations from API with optional year filter
  const { data: destinations, isLoading, error } = useDestinations(
    selectedYear ? { year: selectedYear } : undefined,
  );

  // Transform API data to TravelPlace format
  const travelPlaces = useMemo(() => {
    if (!destinations) return [];
    return transformDestinationsToPlaces(destinations, language);
  }, [destinations, language]);

  const totalPhotos = useMemo(
    () => travelPlaces.reduce((sum, p) => sum + p.photos.length, 0),
    [travelPlaces],
  );
  const continents = useMemo(
    () => new Set(travelPlaces.map((p) => p.continent)).size,
    [travelPlaces],
  );

  // Get available years from all destinations (not just filtered)
  const { data: allDestinations } = useDestinations();
  const availableYears = useMemo(() => {
    if (!allDestinations) return [];
    return [...new Set(allDestinations.map((d) => d.year))].sort((a, b) => b - a);
  }, [allDestinations]);

  const stats = useMemo(
    () => [
      { label: t('travels.stats.destinations'), value: travelPlaces.length, icon: '🌍' },
      { label: t('travels.stats.continents'), value: continents, icon: '✈️' },
      { label: t('travels.stats.photos'), value: totalPhotos, icon: '📸' },
      { label: t('travels.stats.memories'), value: '∞', icon: '💙' },
    ],
    [t, travelPlaces.length, continents, totalPhotos],
  );

  const scrollRef = useScrollReveal([travelPlaces]);

  // Loading state
  if (isLoading && !destinations) {
    return (
      <div className="travels-page">
        <div className="travel-map-loading">
          {t('travels.loading-map')}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="travels-page">
        <div className="travel-error">
          <span className="travel-error-icon">⚠️</span>
          <h2>{t('travels.error.title')}</h2>
          <p>{error instanceof Error ? error.message : 'Failed to load destinations'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="travels-page" ref={scrollRef}>
      <section className="travels-hero">
        <span className="travels-hero-emoji">🧳</span>
        <h1 className="travels-hero-title">
          {t('travels.hero.title.part1')}{' '}
          <span className="travels-hero-accent">{t('travels.hero.title.part2')}</span>
        </h1>
        <p className="travels-hero-subtitle">{t('travels.hero.subtitle')}</p>
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
        <Suspense
          fallback={
            <div className="travel-map-loading travels-map-full">
              {t('travels.loading-map')}
            </div>
          }
        >
          <TravelMap className="travels-map-full" filterYear={selectedYear} />
        </Suspense>
      </section>

      <section className="travels-destinations">
        <h2 className="travels-destinations-title">{t('travels.destinations-title')}</h2>

        <div className="year-filter">
          <button
            className={`year-chip${selectedYear === null ? ' active' : ''}`}
            onClick={() => setSelectedYear(null)}
            disabled={isLoading}
          >
            {t('travels.year-filter.all')}
          </button>
          {availableYears.map((year) => (
            <button
              key={year}
              className={`year-chip${selectedYear === year ? ' active' : ''}`}
              onClick={() => setSelectedYear(year)}
              disabled={isLoading}
            >
              {year}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="destinations-loading">{t('travels.loading-destinations')}</div>
        ) : (
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
                    <span className="destination-card-view">{t('travels.card.view')}</span>
                  </div>
                </div>
                <div className="destination-card-info">
                  <div className="destination-card-header">
                    <h3 className="destination-card-name">
                      {place.continentEmoji} {place.name}
                    </h3>
                    <span className="destination-card-photos">
                      {place.photos.length} {t('travels.card.photos')}
                    </span>
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
        )}
      </section>

      {selectedPlace && (
        <TravelModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      )}
    </div>
  );
}
