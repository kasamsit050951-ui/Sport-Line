import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, Mic, X, MapPin, Loader2 } from 'lucide-react';
import { SportType } from '../types';
import { SPORTS_LIST, APP_CONFIG } from '../constants';

// Declare google global to avoid TS namespace errors
declare var google: any;

interface TopBarProps {
  selectedSport: SportType;
  onSelectSport: (sport: SportType) => void;
  userAvatar: string;
  onAvatarClick: () => void;
  onLocationSelect: (lat: number, lng: number) => void;
  // Prop from centralized loader
  isLoaded: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ selectedSport, onSelectSport, userAvatar, onAvatarClick, onLocationSelect, isLoaded }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<any>(null);

  const displayLogo = APP_CONFIG.headerLogoUrl || APP_CONFIG.logoUrl;

  // Initialize Autocomplete Service when maps script is loaded
  useEffect(() => {
    if (isLoaded && !autocompleteService.current && typeof google !== 'undefined') {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Google Places Search
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim() || query.length < 3 || !autocompleteService.current) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const request = {
            input: query,
        };

        autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                setSuggestions(predictions);
                setIsOpen(true);
            } else {
                setSuggestions([]);
            }
            setIsLoading(false);
        });
      } catch (error) {
        console.error('Error fetching places:', error);
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [query, isLoaded]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocation = (place: any) => {
    // We need to fetch geometry for the selected place
    const mapDiv = document.createElement('div');
    const service = new google.maps.places.PlacesService(mapDiv);

    service.getDetails({
        placeId: place.place_id,
        fields: ['geometry', 'name']
    }, (result: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result.geometry) {
            const lat = result.geometry.location.lat();
            const lng = result.geometry.location.lng();
            
            onLocationSelect(lat, lng);
            setQuery(result.name || place.structured_formatting.main_text);
            setIsOpen(false);
            setSuggestions([]);
        }
    });
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] flex flex-col pointer-events-none" ref={wrapperRef}>
      {/* Search Bar Container */}
      <div className="w-full px-4 pt-4 pointer-events-auto relative">
        <div className={`bg-white shadow-lg flex items-center p-3 gap-3 border border-gray-100 transition-all duration-200 ${isOpen && suggestions.length > 0 ? 'rounded-t-2xl rounded-b-none' : 'rounded-full'}`}>
          
          <Menu className="text-gray-500 cursor-pointer min-w-[24px]" size={24} />
          
          {displayLogo && (
            <div className="h-8 w-auto flex items-center border-r border-gray-200 pr-3 mr-1">
                <img src={displayLogo} alt="App Logo" className="h-full object-contain" />
            </div>
          )}

          <div className="flex-1 flex items-center relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
              placeholder="Search places..."
              className="w-full outline-none text-gray-700 text-base placeholder-gray-500 bg-transparent"
            />
          </div>
          
          {isLoading && <Loader2 className="animate-spin text-gray-400" size={20} />}
          
          {!isLoading && query && (
            <button onClick={clearSearch} className="p-1 hover:bg-gray-100 rounded-full">
               <X className="text-gray-500" size={20} />
            </button>
          )}

          {!query && <Mic className="text-gray-500 cursor-pointer" size={20} />}
          
          <button onClick={onAvatarClick} className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 ml-1">
            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 bg-white shadow-xl border-t border-gray-100 rounded-b-2xl overflow-hidden flex flex-col pointer-events-auto max-h-60 overflow-y-auto">
            {suggestions.map((place) => (
              <button
                key={place.place_id}
                onClick={() => handleSelectLocation(place)}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-none"
              >
                <div className="mt-0.5 bg-gray-100 p-2 rounded-full">
                    <MapPin size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {place.structured_formatting.main_text}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {place.structured_formatting.secondary_text}
                  </p>
                </div>
              </button>
            ))}
            <div className="p-2 bg-gray-50 text-right">
                <span className="text-[10px] text-gray-400">Powered by Google</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Chips Container */}
      <div className={`w-full pl-4 mt-3 overflow-x-auto no-scrollbar pointer-events-auto pb-2 transition-opacity duration-200 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex gap-2 pr-4 min-w-max">
          {SPORTS_LIST.map((sport) => {
            const isSelected = selectedSport === sport.type;
            return (
              <button
                key={sport.type}
                onClick={() => onSelectSport(sport.type)}
                className={`
                  flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors shadow-sm border
                  ${isSelected 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}
                `}
              >
                {sport.icon}
                {sport.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopBar;