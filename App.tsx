import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import MapView from './components/MapView';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import CreatePartyView from './components/CreatePartyView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import ChatListView, { ChatUser } from './components/ChatListView';
import ChatDetailView from './components/ChatDetailView';
import { Party, SportType, User } from './types';
import { INITIAL_USER, DEFAULT_CENTER } from './constants';
import { Crosshair, Loader2, Sparkles } from 'lucide-react';
import { auth, db, firebase } from './firebase'; // Import firebase for compat utilities
import { User as FirebaseUser } from 'firebase/auth';
import { calculateHaversineDistance, encodeGeohash, applyJitter } from './utils/geospatial';
import { rankCandidates, RankedUser } from './services/geminiService';

// Declare google for global access
declare var google: any;

// Define libraries outside component to prevent re-render loop
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const [isServerDataLoaded, setIsServerDataLoaded] = useState(false);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  
  const [selectedSport, setSelectedSport] = useState<SportType>('All');
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [parties, setParties] = useState<Party[]>([]);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [rankedCandidates, setRankedCandidates] = useState<RankedUser[]>([]);
  const [isRanking, setIsRanking] = useState(false);
  
  // Store travel times separately to avoid re-rendering loops
  const [travelTimes, setTravelTimes] = useState<Record<string, string>>({});

  const [currentTab, setCurrentTab] = useState<'explore' | 'create' | 'settings' | 'chat'>('explore');
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  
  // Chat Navigation State
  const [selectedChatUser, setSelectedChatUser] = useState<ChatUser | null>(null);

  // Rate limiting for distance matrix
  const lastMatrixCall = useRef<number>(0);

  // --- GOOGLE MAPS LOADER (Centralized) ---
  const rawApiKey = ((import.meta as any).env && (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY) || '';
  const apiKey = rawApiKey.replace(/['"]/g, '').trim();

  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES
  });

  // --- 1. Auth Listener ---
  useEffect(() => {
    if (!auth) {
        console.error("Authentication service is not available.");
        setIsLoadingAuth(false);
        return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setAuthUser(currentUser);
      
      if (currentUser) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(INITIAL_USER);
        setIsServerDataLoaded(true);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // --- 2. Real-time User Profile Listener ---
  useEffect(() => {
    if (authUser && db) {
        const unsubscribeUser = db.collection('users').doc(authUser.uid).onSnapshot((docSnap) => {
            if (docSnap.exists) {
                const userData = docSnap.data() as User;
                setUser(userData);
            } else {
                setUser({
                    ...INITIAL_USER,
                    displayName: authUser.displayName || 'User',
                    username: authUser.email?.split('@')[0] || 'user',
                    avatarUrl: authUser.photoURL || INITIAL_USER.avatarUrl
                });
            }
            setIsServerDataLoaded(true);
        }, (error) => {
            console.error("Error fetching server data:", error);
            setIsServerDataLoaded(true);
        });

        return () => unsubscribeUser();
    }
  }, [authUser]);

  // --- 3. Real-time Parties Listener ---
  useEffect(() => {
    if (!isAuthenticated || !db) return;

    const unsubscribeParties = db.collection('parties')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const partiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Party[];
        setParties(partiesData);
    });

    return () => unsubscribeParties();
  }, [isAuthenticated]);

  // --- 3.1. Real-time Candidate Discovery (Tier 1: Geohash) ---
  useEffect(() => {
    if (!isAuthenticated || !db || !user.uid) return;

    // Perform Geohash-based range query (simplified for demo as prefix match)
    // In a real app, you'd use a library like geofire-common
    const centerGeohash = encodeGeohash(mapCenter.lat, mapCenter.lng, 4); // 4 chars ~20km

    const unsubscribeCandidates = db.collection('users')
      .where('isVisible', '==', true)
      .where('geohash', '>=', centerGeohash)
      .where('geohash', '<=', centerGeohash + '\uf8ff')
      .limit(20)
      .onSnapshot((snapshot) => {
        const usersData = snapshot.docs
          .map(doc => doc.data() as User)
          .filter(u => u.uid !== user.uid); // Exclude self
        setCandidates(usersData);
      });

    return () => unsubscribeCandidates();
  }, [isAuthenticated, mapCenter, user.uid]);

  // --- 4. TIER 2: Spatial Refinement & AI Ranking ---
  const processedCandidates = useMemo(() => {
    // Apply Haversine and Jitter for privacy
    return candidates.map(c => {
      const coords = c.locationMode === 'live' ? { lat: c.staticCoords.lat, lng: c.staticCoords.lng } : c.staticCoords;
      const dist = calculateHaversineDistance(mapCenter.lat, mapCenter.lng, coords.lat, coords.lng);
      
      // Apply jitter to candidate coordinates before sending to MapView
      const blurredCoords = applyJitter(coords.lat, coords.lng);
      
      return { 
        ...c, 
        distance: dist,
        displayCoords: blurredCoords 
      };
    }).filter(c => c.distance! < 50); // 50km radius
  }, [candidates, mapCenter]);

  // Trigger AI Ranking when candidates change
  useEffect(() => {
    if (processedCandidates.length > 0 && !isRanking) {
      const runRanking = async () => {
        setIsRanking(true);
        const ranked = await rankCandidates(user, processedCandidates);
        setRankedCandidates(ranked);
        setIsRanking(false);
      };
      runRanking();
    } else if (processedCandidates.length === 0) {
      setRankedCandidates([]);
    }
  }, [processedCandidates, user]);

  // --- 4. TIER 2: Spatial Refinement (Distance Sorting) ---
  const sortedParties = useMemo(() => {
    let filtered = selectedSport === 'All' 
        ? parties 
        : parties.filter(p => p.sport === selectedSport);
    
    // Calculate distance for each party relative to current map center
    const withDistance = filtered.map(party => {
        const dist = calculateHaversineDistance(
            mapCenter.lat, 
            mapCenter.lng, 
            party.latitude, 
            party.longitude
        );
        // Inject travel time if we have it calculated
        const time = travelTimes[party.id];
        return { ...party, distance: dist, travelTime: time };
    });

    // Sort by distance (ASC)
    return withDistance.sort((a, b) => a.distance - b.distance);
  }, [parties, selectedSport, mapCenter, travelTimes]);

  // --- 5. TIER 3: Distance Matrix (Travel Time) Logic ---
  useEffect(() => {
    // Only fetch if google maps is loaded and we have parties
    if (!isMapsLoaded || typeof google === 'undefined' || !google.maps || !google.maps.DistanceMatrixService) return;
    if (sortedParties.length === 0) return;

    // Debounce: Only call every 5 seconds max to avoid quota limits
    const now = Date.now();
    if (now - lastMatrixCall.current < 5000) return;
    lastMatrixCall.current = now;

    // Take top 10 closest parties to calculate precise time for
    const topCandidates = sortedParties.slice(0, 10);
    const destinations = topCandidates.map(p => ({ lat: p.latitude, lng: p.longitude }));

    // If we already have times for all these, skip
    const allHaveTime = topCandidates.every(p => travelTimes[p.id]);
    if (allHaveTime && topCandidates.length > 0) return;

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: [mapCenter],
        destinations: destinations,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
    }, (response: any, status: any) => {
        if (status === 'OK' && response.rows[0].elements) {
            const results = response.rows[0].elements;
            const newTimes: Record<string, string> = {};
            
            results.forEach((element: any, index: number) => {
                if (element.status === 'OK' && element.duration) {
                    const partyId = topCandidates[index].id;
                    newTimes[partyId] = element.duration.text;
                }
            });

            // Update state safely
            setTravelTimes(prev => ({ ...prev, ...newTimes }));
        }
    });

  }, [sortedParties, mapCenter, isMapsLoaded]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setIsServerDataLoaded(true);
  };

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
    }
    setCurrentTab('explore');
    setSelectedChatUser(null);
    setIsServerDataLoaded(false);
  };

  if (isLoadingAuth) {
     return (
        <div className="w-full h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
     );
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (!isServerDataLoaded) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-gray-400 text-sm font-medium">Syncing with server...</p>
        </div>
     );
  }

  const handleTabChange = (tab: 'explore' | 'create' | 'settings' | 'chat') => {
    setCurrentTab(tab);
    if (tab !== 'chat') {
        setSelectedChatUser(null);
    }
  };

  const handleCreateParty = (newParty: Party) => {
    setCurrentTab('explore');
    setMapCenter({ lat: newParty.latitude, lng: newParty.longitude });
  };

  const handleJoinParty = async (partyId: string) => {
    if (!db) return;
    try {
        await db.collection('parties').doc(partyId).update({
            members: firebase.firestore.FieldValue.arrayUnion(user.username),
            playersCurrent: (parties.find(p => p.id === partyId)?.playersCurrent || 0) + 1
        });
    } catch (error) {
        console.error("Error joining party:", error);
    }
  };

  const handleRecenter = () => {
    // Small jitter to force map refresh if needed
    setMapCenter({ ...DEFAULT_CENTER, lat: DEFAULT_CENTER.lat + (Math.random() * 0.001) });
  };
  
  const handleLocationSelect = (lat: number, lng: number) => {
    setMapCenter({ lat, lng });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50 flex flex-col font-sans">
      
      {/* Map Layer */}
      <div className="absolute inset-0 top-0 bottom-[72px] z-0">
        <MapView 
            parties={sortedParties} 
            candidates={rankedCandidates}
            center={mapCenter} 
            currentUser={user.username}
            onJoinParty={handleJoinParty}
            isLoaded={isMapsLoaded}
            loadError={mapsLoadError}
        />
      </div>

      {/* Floating UI Elements */}
      {currentTab === 'explore' && (
        <>
          <TopBar 
            selectedSport={selectedSport} 
            onSelectSport={setSelectedSport}
            userAvatar={user.avatarUrl}
            onAvatarClick={() => setCurrentTab('settings')}
            onLocationSelect={handleLocationSelect}
            isLoaded={isMapsLoaded}
          />

          <button 
            onClick={handleRecenter}
            className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-lg text-gray-600 hover:text-blue-600 z-[1000] border border-gray-100"
          >
            <Crosshair size={24} />
          </button>
        </>
      )}

      {/* Overlay Views */}
      {currentTab === 'create' && (
        <CreatePartyView 
          onClose={() => setCurrentTab('explore')} 
          onCreate={handleCreateParty}
          userLocation={mapCenter}
          currentUser={user.username}
          isLoaded={isMapsLoaded}
        />
      )}

      {currentTab === 'settings' && (
        <SettingsView 
          user={user}
          onUpdateUser={() => {}} 
          onClose={() => setCurrentTab('explore')}
          onLogout={handleLogout}
        />
      )}

      {/* Chat Views */}
      {currentTab === 'chat' && (
        <div className="absolute inset-0 bottom-[72px] z-[1000] bg-white">
            {selectedChatUser ? (
                <ChatDetailView 
                    chatUser={selectedChatUser} 
                    onBack={() => setSelectedChatUser(null)} 
                />
            ) : (
                <ChatListView 
                    onSelectChat={setSelectedChatUser} 
                />
            )}
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav currentTab={currentTab} onChangeTab={handleTabChange} />

    </div>
  );
}

export default App;