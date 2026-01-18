// src/components/MapWithProperties.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type{ Property } from '../types/Property';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { TbBed } from 'react-icons/tb';
import { BiBath } from 'react-icons/bi';
import { MdOutlineDirectionsCar } from 'react-icons/md';

function DynamicMapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15); // smooth zoom/pan to hovered marker
    }
  }, [lat, lng, map]);

  return null;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

type Props = {
  properties: Property[];
  selectedPropertyId: number | null;
  hoveredPropertyId: number | null;
  onMarkerClick: (id: number) => void;
  onMarkerHover: (id: number) => void;
  selectedMarkerProperty: Property | null;
  flyToCoordinates: { lat: number; lng: number } | null;
  mapHeight?: string; 
  mapWidth?: string; 
};


export default function MapWithProperties({
   properties,
   selectedPropertyId,
   hoveredPropertyId,
   onMarkerClick,
   onMarkerHover,
   flyToCoordinates,
   selectedMarkerProperty,
   mapHeight,
  mapWidth,
  }: Props) {
    const defaultCenter: [number, number] = properties.length > 0
    ? [
        properties[0].latitude ?? -36.8485,
        properties[0].longitude ?? 174.7633,
      ]
    : [-36.8485, 174.7633]; // Default to Auckland

    const defaultIcon = L.icon({
      iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
      shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    
    const highlightIcon = new L.Icon({
      iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
      iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
      shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
      iconSize: [30, 45],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      className: 'leaflet-highlight-icon', // we’ll style it below
    });
    
    

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      scrollWheelZoom
      className={`${mapHeight || "h-[600px]"} ${mapWidth || "w-full"} rounded shadow z-0`}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

      />
     
     {flyToCoordinates && (
    <DynamicMapCenter lat={flyToCoordinates.lat} lng={flyToCoordinates.lng} />
  )}

      {properties.map((property) => {
  if (property.latitude == null || property.longitude == null) return null;

  const isHighlighted =
    property.id === selectedPropertyId || property.id === hoveredPropertyId;

  return (
    <Marker
      key={property.id}
      position={[property.latitude, property.longitude]}
      icon={isHighlighted ? highlightIcon : defaultIcon}
      eventHandlers={{
        click: () => onMarkerClick(property.id),
        mouseover: () => onMarkerHover(property.id),
      }}
    >
      {selectedMarkerProperty && (
  <Popup
    closeButton={false}
    autoPan={false}
  >
    <div className="w-48">
      <img
        src={
          selectedMarkerProperty.media.find(m => m.mediaType === 'image')?.url ||
          'https://via.placeholder.com/150'
        }
        alt="property"
        className="w-full h-24 object-cover rounded mb-2"
      />
      <h3 className="text-sm font-semibold text-blue-700">{selectedMarkerProperty.name}</h3>
      <p className="text-xs text-gray-600">{selectedMarkerProperty.address}</p>
      <div className="flex justify-between mt-2 text-sm text-gray-700 font-medium">
        <span className="flex items-center gap-1"><TbBed /> {selectedMarkerProperty.bedrooms}</span>
        <span className="flex items-center gap-1"><BiBath /> {selectedMarkerProperty.bathrooms}</span>
        <span className="flex items-center gap-1"><MdOutlineDirectionsCar /> {selectedMarkerProperty.parkingSpaces}</span>
      </div>
      <p className="mt-1 text-right font-bold text-gray-800">${selectedMarkerProperty.rentAmount}/wk</p>
    </div>
  </Popup>
)}
    </Marker>
  );
})}

    </MapContainer>
  );
}
