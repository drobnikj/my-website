import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import type { TravelPlace } from '../data/travels';
import TravelModal from './TravelModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useDestinations } from '../hooks/useDestinations';
import { transformDestinationsToPlaces } from '../api/transformers';

interface TravelMapProps {
  className?: string;
  filterYear?: number | null;
}

function createPhotoIcon(thumbUrl: string): L.DivIcon {
  return L.divIcon({
    className: 'photo-marker',
    html: `<div class="photo-marker-inner"><img src="${thumbUrl}" alt="" loading="lazy" /></div>`,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });
}

function getTileUrl(): string {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
}

export default function TravelMap({ className, filterYear }: TravelMapProps) {
  const { language } = useLanguage();
  const { data: destinations } = useDestinations(
    filterYear ? { year: filterYear } : undefined,
  );

  const travelPlaces = useMemo(() => {
    if (!destinations) return [];
    return transformDestinationsToPlaces(destinations, language);
  }, [destinations, language]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<TravelPlace | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, -20],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    const tileLayer = L.tileLayer(getTileUrl(), {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    const observer = new MutationObserver(() => {
      if (tileLayerRef.current) {
        tileLayerRef.current.setUrl(getTileUrl());
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when filterYear or travelPlaces changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    const clusterGroup = L.markerClusterGroup({
      iconCreateFunction(cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="photo-cluster"><span>${count}</span></div>`,
          className: 'photo-cluster-wrapper',
          iconSize: [48, 48],
        });
      },
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });

    for (const place of travelPlaces) {
      const marker = L.marker([place.lat, place.lng], {
        icon: createPhotoIcon(place.thumbs[0]),
      });
      marker.on('click', () => setSelectedPlace(place));
      clusterGroup.addLayer(marker);
    }

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
  }, [travelPlaces]);

  return (
    <>
      <div ref={mapRef} className={`travel-map ${className || ''}`} />
      {selectedPlace && (
        <TravelModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      )}
    </>
  );
}
