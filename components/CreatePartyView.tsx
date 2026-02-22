import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { Party, SportType } from '../types';
import { SPORTS_LIST, KHON_KAEN_CENTER, DEFAULT_CITY } from '../constants';
import { X, MapPin, Calendar, Clock, Users, Search, Loader2 } from 'lucide-react';
import { db, firebase } from '../firebase';
import { encodeGeohash } from '../utils/geospatial';

// Declare google global to avoid TS namespace errors
declare var google: any;

interface CreatePartyViewProps {
  onClose: () => void;
  onCreate: (party: Party) => void;
  userLocation: { lat: number; lng: number };
  currentUser: string;
  // Prop from centralized loader
  isLoaded: boolean;
}

// Map configuration
const mapContainerStyle = {
  width: '100%',
  height: '200px',
  borderRadius: '12px'
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

// --- SUB-COMPONENTS ---

const LocationSection: React.FC<{
  selectedLocation: { lat: number; lng: number };
  setSelectedLocation: (loc: { lat: number; lng: number }) => void;
  displayLocationName: string;
  setDisplayLocationName: (name: string) => void;
  setPlaceId: (id: string) => void;
  isLoaded: boolean;
}> = ({ selectedLocation, setSelectedLocation, displayLocationName, setDisplayLocationName, setPlaceId, isLoaded }) => {
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const mapRef = useRef<any>(null);

  // Initialize Autocomplete Service
  useEffect(() => {
    if (isLoaded && !autocompleteService.current && typeof google !== 'undefined') {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Handle Text Search (Google Places Autocomplete)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!locationQuery.trim() || locationQuery.length < 3 || !autocompleteService.current) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      
      try {
        const request = {
            input: locationQuery,
            location: new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng),
            radius: 5000, // Bias to 5km radius
        };

        autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                setSuggestions(predictions);
            } else {
                setSuggestions([]);
            }
            setIsSearching(false);
        });
      } catch (error) {
        console.error('Error fetching places:', error);
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [locationQuery, selectedLocation, isLoaded]);

  const handleSelectSuggestion = (prediction: any) => {
    setDisplayLocationName(prediction.structured_formatting.main_text);
    setPlaceId(prediction.place_id);
    setLocationQuery('');
    setSuggestions([]);

    // We need to get the geometry (lat/lng) for this place ID
    if (!placesService.current && mapRef.current) {
        // Create a temporary PlacesService using the map instance (or a dummy div if map not ready)
        placesService.current = new google.maps.places.PlacesService(mapRef.current);
    }

    if (placesService.current) {
        placesService.current.getDetails({
            placeId: prediction.place_id,
            fields: ['geometry', 'name']
        }, (place: any, status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry && place.geometry.location) {
                setSelectedLocation({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
            }
        });
    }
  };

  const handleMapClick = useCallback((e: any) => {
    if (e.latLng) {
      setSelectedLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      setDisplayLocationName("Custom Pinned Location");
      setPlaceId(""); // Clear place ID if picking manually
    }
  }, [setSelectedLocation, setDisplayLocationName, setPlaceId]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">Match Location</label>
      
      {/* Map Display */}
      <div className="relative border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={selectedLocation}
            zoom={15}
            options={mapOptions}
            onClick={handleMapClick}
            onLoad={(map) => {
                mapRef.current = map;
                placesService.current = new google.maps.places.PlacesService(map);
            }}
          >
            <MarkerF position={selectedLocation} />
          </GoogleMap>
        ) : (
          <div style={mapContainerStyle} className="bg-gray-100 flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Selected Location Card */}
      <div className="bg-blue-50 p-3 rounded-xl flex items-center gap-3 border border-blue-100">
        <MapPin className="text-blue-600 shrink-0" size={20} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-blue-900 truncate">{displayLocationName}</p>
          <p className="text-xs text-blue-600 truncate">
            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          className="w-full pl-10 p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
          placeholder="Search verified venues (Google Maps)..."
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
        />
        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={18} />}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-20 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden mt-[-10px] w-[calc(100%-2rem)] max-h-60 overflow-y-auto">
          {suggestions.map((place) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(place)}
              className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-none"
            >
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                    {place.structured_formatting.main_text}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {place.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Powered by Google Footer */}
      {suggestions.length > 0 && (
          <div className="flex justify-end px-2">
               <span className="text-[10px] text-gray-400">Powered by Google</span>
          </div>
      )}
    </div>
  );
};

const SportSelectionSection: React.FC<{
  selectedSport: SportType;
  setSelectedSport: (sport: SportType) => void;
}> = ({ selectedSport, setSelectedSport }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">Sport Category</label>
      <div className="grid grid-cols-2 gap-2">
        {SPORTS_LIST.map(sport => (
          <button
            key={sport.type}
            type="button"
            onClick={() => setSelectedSport(sport.type)}
            className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all
              ${selectedSport === sport.type 
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {sport.icon}
            {sport.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const CreatePartyView: React.FC<CreatePartyViewProps> = ({ onClose, onCreate, currentUser, isLoaded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    sport: 'Football' as SportType,
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:00',
    playersMax: 10
  });

  const [selectedLocation, setSelectedLocation] = useState(KHON_KAEN_CENTER);
  const [displayLocationName, setDisplayLocationName] = useState(DEFAULT_CITY);
  const [placeId, setPlaceId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        // TIER 1: Compute Geohash for Spatial Indexing
        const geohash = encodeGeohash(selectedLocation.lat, selectedLocation.lng);

        const partyData = {
          ...formData,
          playersCurrent: 1,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          venueName: displayLocationName || "Pinned Location",
          placeId: placeId || "", 
          geohash: geohash, 
          host: currentUser,
          members: [currentUser],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Create a promise that rejects after 10 seconds
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("TIMEOUT: Creation timed out. Check your connection.")), 10000)
        );

        const docRef = await Promise.race([
            db.collection('parties').add(partyData),
            timeoutPromise
        ]) as any; // Type assertion needed due to race
        
        const newParty: Party = {
            id: docRef.id,
            ...partyData
        };
        
        onCreate(newParty);
    } catch (error: any) {
        console.error("Error creating party: ", error);
        
        if (error.message && error.message.includes("TIMEOUT")) {
             alert("⚠️ Request Timed Out.\n\nThe server is not responding. Please check your internet connection and try again.");
        } else if (error.code === 'permission-denied') {
            alert("⚠️ Database Permission Denied.\n\nThe app cannot save your party because the database is locked.\n\nPlease go to Firebase Console > Firestore Database > Rules and change 'allow write: if false;' to 'allow write: if request.auth != null;'.");
        } else {
            alert(`Failed to create party. Error: ${error.message || "Unknown error"}`);
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[2000] flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Host a Game</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 no-scrollbar">
        <form id="create-party-form" onSubmit={handleSubmit} className="space-y-8 max-w-md mx-auto">
          
          <LocationSection 
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            displayLocationName={displayLocationName}
            setDisplayLocationName={setDisplayLocationName}
            setPlaceId={setPlaceId}
            isLoaded={isLoaded}
          />

          <SportSelectionSection 
            selectedSport={formData.sport}
            setSelectedSport={(sport) => setFormData({...formData, sport})}
          />

          <div className="space-y-5 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Party Title</label>
              <input 
                required
                type="text" 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                placeholder="e.g. Khon Kaen Weekly Match"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea 
                rows={3}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all resize-none font-medium"
                placeholder="Details, rules, or requirements..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    required
                    type="date" 
                    className="w-full pl-10 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="time" 
                      className="w-full pl-10 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="time" 
                      className="w-full pl-10 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Players</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="number" 
                    min="2"
                    max="50"
                    className="w-full pl-10 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white"
                    value={formData.playersMax}
                    onChange={(e) => setFormData({...formData, playersMax: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-10">
        <button 
          type="submit" 
          form="create-party-form"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Party'}
        </button>
      </div>
    </div>
  );
};

export default CreatePartyView;