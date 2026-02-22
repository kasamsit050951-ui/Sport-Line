import React, { useState, useRef, useEffect } from 'react';
import { User, SportType } from '../types';
import { SPORTS_LIST } from '../constants';
import { Camera, ArrowLeft, LogOut, Shield, Bell, HelpCircle, ChevronRight, Loader2, Mail, Database, CheckCircle, AlertTriangle, RefreshCw, Trash2, Eye, EyeOff, MapPin, Navigation, Star } from 'lucide-react';
import { db, auth, firebase } from '../firebase';
import { encodeGeohash } from '../utils/geospatial';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onClose: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onClose, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setFormData(user);
    }
  }, [isEditing, user]);

  // Image Processing Helper
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData(prev => ({ ...prev, avatarUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // 1. Validation
    if (!formData.displayName?.trim()) {
      alert("Display Name is required");
      return;
    }
    if (!formData.username?.trim()) {
      alert("Username is required");
      return;
    }

    setIsSaving(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You are not currently signed in.");
      }

      // 2. Prepare Data (Clean undefined values)
      const userDataToSave = {
        displayName: formData.displayName || "",
        username: formData.username || "",
        email: formData.email || "", 
        bio: formData.bio || "",
        gender: formData.gender || "Prefer not to say",
        preferredSports: formData.preferredSports || [],
        avatarUrl: formData.avatarUrl || "",
        skillLevel: formData.skillLevel || "Intermediate",
        locationMode: formData.locationMode || "static",
        isVisible: formData.isVisible !== undefined ? formData.isVisible : true,
        staticCoords: formData.staticCoords || { lat: 16.4322, lng: 102.8236 },
        geohash: encodeGeohash(formData.staticCoords.lat, formData.staticCoords.lng, 10),
        uid: currentUser.uid
      };

      // 3. Firestore Write
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT: Save operation took too long.")), 10000)
      );
      
      await Promise.race([
        db.collection('users').doc(currentUser.uid).set(userDataToSave, { merge: true }),
        timeoutPromise
      ]);
      
      console.log("Profile updated successfully");
      setIsEditing(false);

    } catch (error: any) {
      console.error("Save failed:", error);
      let errorMessage = "Failed to save profile.";
      
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Check Firestore Security Rules.";
      } else if (error.message.includes("TIMEOUT")) {
        errorMessage = "Connection Timed Out. Please check your internet.";
      } else if (error.code === 'unavailable') {
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Testing Read/Write... (10s timeout)');
    
    try {
        if (!auth.currentUser) throw new Error("Not logged in");
        if (!navigator.onLine) throw new Error("You appear to be offline.");

        // TIMEOUT WRAPPER
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("TIMEOUT: Database did not respond.")), 10000)
        );

        // Step 1: Test READ (usually faster)
        // We read a non-existent doc just to see if we can reach the server
        const readPromise = db.collection('connection_test').doc('ping').get();
        await Promise.race([readPromise, timeoutPromise]);

        // Step 2: Test WRITE
        const writePromise = db.collection('connection_test').add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            uid: auth.currentUser.uid,
            test: true,
            platform: navigator.userAgent
        });

        await Promise.race([writePromise, timeoutPromise]);

        setTestStatus('success');
        setTestMessage('Success! Read & Write operational.');
    } catch (error: any) {
        console.error("Connection Test Failed:", error);
        setTestStatus('error');
        
        if (error.message.includes("TIMEOUT")) {
            setTestMessage("TIMEOUT: Firewall blocking connection. Try 'Reset Cache'.");
        } else if (error.code === 'permission-denied') {
            setTestMessage('PERMISSION DENIED: Update Firestore Rules in Console.');
        } else if (error.code === 'unavailable' || error.message.includes("offline")) {
            setTestMessage('OFFLINE: Check your internet connection.');
        } else {
            setTestMessage(`ERROR: ${error.message}`);
        }
    }
  };

  const handleResetCache = async () => {
      if (!confirm("This will refresh the app and clear local database data. Continue?")) return;
      
      try {
          // Terminate connection and clear persistence
          await db.terminate();
          await db.clearPersistence();
          window.location.reload();
      } catch (e: any) {
          alert("Error resetting cache: " + e.message);
          window.location.reload(); // Reload anyway
      }
  };

  const toggleSport = (sport: SportType) => {
    setFormData(prev => {
      const current = prev.preferredSports || [];
      if (current.includes(sport)) {
        return { ...prev, preferredSports: current.filter(s => s !== sport) };
      } else {
        return { ...prev, preferredSports: [...current, sport] };
      }
    });
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-white z-[2000] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Edit Header */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <button 
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
            className="text-gray-500 font-medium hover:text-gray-900"
          >
            Cancel
          </button>
          <h2 className="text-lg font-bold">Edit Profile</h2>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="text-blue-600 font-bold hover:text-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Save'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div 
              className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-50 shadow-sm cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <img 
                src={formData.avatarUrl || 'https://via.placeholder.com/150'} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                 <Camera className="text-white" size={32} />
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm font-semibold text-blue-600"
            >
              Change Photo
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
              <input 
                type="text"
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:bg-white focus:border-blue-500 transition-all"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
              <input 
                type="text"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:bg-white focus:border-blue-500 transition-all"
                placeholder="Username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input 
                type="email"
                value={formData.email || ''}
                disabled
                className="w-full p-4 bg-gray-100 border border-gray-200 rounded-xl font-medium outline-none text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1 ml-1">Email cannot be changed here.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
              <textarea 
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                placeholder="About you..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
              <div className="relative">
                <select 
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:bg-white focus:border-blue-500 appearance-none"
                >
                  <option>Prefer not to say</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400" size={20} />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
              <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                <Shield size={16} /> Privacy & Location
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {formData.isVisible ? <Eye className="text-blue-600" size={20} /> : <EyeOff className="text-gray-400" size={20} />}
                  <div>
                    <p className="text-sm font-bold text-gray-800">Public Visibility</p>
                    <p className="text-[10px] text-gray-500">Allow others to find you on the map</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFormData({...formData, isVisible: !formData.isVisible})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.isVisible ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isVisible ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {formData.locationMode === 'live' ? <Navigation className="text-blue-600" size={20} /> : <MapPin className="text-gray-400" size={20} />}
                  <div>
                    <p className="text-sm font-bold text-gray-800">Location Mode</p>
                    <p className="text-[10px] text-gray-500">{formData.locationMode === 'live' ? 'Real-time telemetry enabled' : 'Using fixed static coordinates'}</p>
                  </div>
                </div>
                <div className="flex bg-white rounded-lg p-1 border border-blue-200">
                  <button 
                    onClick={() => setFormData({...formData, locationMode: 'static'})}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${formData.locationMode === 'static' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                  >
                    Static
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, locationMode: 'live'})}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${formData.locationMode === 'live' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                  >
                    Live
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Skill Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setFormData({...formData, skillLevel: level})}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                      formData.skillLevel === level 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    <Star size={12} fill={formData.skillLevel === level ? 'currentColor' : 'none'} />
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sports Interests</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS_LIST.filter(s => s.type !== 'All').map(sport => {
                  const isSelected = formData.preferredSports?.includes(sport.type);
                  return (
                    <button
                      key={sport.type}
                      onClick={() => toggleSport(sport.type)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all flex items-center gap-2 ${
                        isSelected 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {sport.icon}
                      {sport.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View Mode
  return (
    <div className="fixed inset-0 bg-gray-50 z-[2000] flex flex-col animate-in slide-in-from-right duration-300">
       <div className="px-4 py-4 border-b border-gray-200 flex items-center gap-4 bg-white sticky top-0">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white p-8 mb-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 bg-gray-100">
                <img src={user.avatarUrl || 'https://via.placeholder.com/150'} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
            <p className="text-gray-500">@{user.username}</p>
            {user.email && (
                 <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm">
                    <Mail size={12} />
                    <span>{user.email}</span>
                 </div>
            )}
            {user.bio && <p className="mt-4 text-gray-600 text-sm italic">"{user.bio}"</p>}

            <button 
                onClick={() => setIsEditing(true)}
                className="mt-6 px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-colors"
            >
                Edit Profile
            </button>
        </div>

        <div className="bg-white border-t border-b border-gray-200 mb-6">
            <MenuButton icon={<Shield size={20} />} label="Privacy Policy" />
            <MenuButton icon={<Bell size={20} />} label="Notifications" />
            <MenuButton icon={<HelpCircle size={20} />} label="Support" />
        </div>

        {/* Diagnostic Tool */}
        <div className="px-6 mb-6">
             <div className="bg-gray-100 rounded-xl p-4">
                 <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                     <Database size={16} /> Connection Diagnostics
                 </h3>
                 <p className="text-xs text-gray-500 mb-3">Troubleshoot database connectivity issues.</p>
                 
                 {testStatus !== 'idle' && (
                     <div className={`text-xs p-2 rounded mb-3 ${
                         testStatus === 'success' ? 'bg-green-100 text-green-700' :
                         testStatus === 'error' ? 'bg-red-100 text-red-700' :
                         'bg-blue-50 text-blue-600'
                     }`}>
                         {testStatus === 'testing' && <Loader2 className="inline animate-spin mr-2 w-3 h-3" />}
                         {testStatus === 'success' && <CheckCircle className="inline mr-2 w-3 h-3" />}
                         {testStatus === 'error' && <AlertTriangle className="inline mr-2 w-3 h-3" />}
                         {testMessage}
                     </div>
                 )}

                 <div className="flex gap-2">
                     <button 
                        onClick={handleTestConnection}
                        disabled={testStatus === 'testing'}
                        className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                     >
                        <RefreshCw size={12} className={testStatus === 'testing' ? 'animate-spin' : ''} />
                        Test Connection
                     </button>
                     <button 
                        onClick={handleResetCache}
                        title="Clear local database cache and reload"
                        className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"
                     >
                        <Trash2 size={12} />
                        Reset Cache
                     </button>
                 </div>
             </div>
        </div>
        
        <div className="px-6 pb-6">
            <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 transition-colors rounded-xl font-bold"
            >
                <LogOut size={20} />
                <span>Log Out</span>
            </button>
        </div>
        
        <div className="p-4 text-center text-xs text-gray-400">
            v3.0.1 (Simplified)
        </div>
      </div>
    </div>
  );
};

const MenuButton = ({ icon, label }: { icon: any, label: string }) => (
    <button className="w-full flex items-center gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left last:border-0">
        <div className="text-gray-400">{icon}</div>
        <span className="text-gray-700 font-medium">{label}</span>
        <ChevronRight className="ml-auto text-gray-300" size={16} />
    </button>
);

export default SettingsView;