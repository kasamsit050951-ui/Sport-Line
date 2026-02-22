import React, { useState } from 'react';
import { User } from '../types';
import { Loader2, ArrowLeft, Menu, Flame, AlertCircle } from 'lucide-react';
import { APP_CONFIG, DEFAULT_CENTER } from '../constants';
import { auth, googleProvider, db } from '../firebase';
import { encodeGeohash } from '../utils/geospatial';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'signup'>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Additional fields for signup
  const [username, setUsername] = useState('');

  const displayHeaderLogo = APP_CONFIG.headerLogoUrl || APP_CONFIG.logoUrl;

  // Helper to ensure user document exists in Firestore
  const ensureUserDocument = async (authUser: any, additionalData: any = {}) => {
    if (!db) throw new Error("Database not initialized");
    
    let userSnap;
    try {
        userSnap = await db.collection('users').doc(authUser.uid).get();
    } catch (err) {
        console.warn("Could not fetch user profile (likely offline). Using Auth profile fallback.", err);
        // Fallback: Return a temporary user object based on Auth data
        return {
            username: additionalData.username || authUser.email?.split('@')[0] || 'user',
            displayName: authUser.displayName || additionalData.username || 'Sports Fan',
            email: authUser.email || "",
            avatarUrl: authUser.photoURL || `https://ui-avatars.com/api/?name=${authUser.displayName || 'User'}&background=random`,
            bio: "Ready to play!",
            gender: "Prefer not to say",
            preferredSports: []
        } as User;
    }

    if (!userSnap.exists) {
      const newUser: User = {
        uid: authUser.uid,
        username: additionalData.username || authUser.email?.split('@')[0] || 'user',
        displayName: authUser.displayName || additionalData.username || 'Sports Fan',
        email: authUser.email || "", // Save email
        avatarUrl: authUser.photoURL || `https://ui-avatars.com/api/?name=${authUser.displayName || 'User'}&background=random`,
        bio: "Ready to play!",
        gender: "Prefer not to say",
        preferredSports: [],
        skillLevel: 'Intermediate',
        locationMode: 'static',
        staticCoords: DEFAULT_CENTER,
        isVisible: true,
        geohash: encodeGeohash(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, 10)
      };
      
      try {
        await db.collection('users').doc(authUser.uid).set(newUser);
      } catch (writeErr: any) {
        console.error("Failed to create user profile in DB:", writeErr);
        if (writeErr.code === 'permission-denied') {
             alert("⚠️ Account created, but Profile saving failed.\n\nDatabase Permission Denied. Check Firebase Console > Firestore Database > Rules.");
        }
      }
      return newUser;
    } else {
        // User exists: Update latest email and avatar from Google Auth if available
        // This ensures the "Gmail saving" requirement is robust
        const userData = userSnap.data() as User;
        const updates: any = {};
        
        if (authUser.email && userData.email !== authUser.email) {
            updates.email = authUser.email;
            userData.email = authUser.email;
        }
        
        if (authUser.photoURL && userData.avatarUrl !== authUser.photoURL) {
            // Only update avatar if it hasn't been manually set to something else custom
            // For now, we sync it to keep it fresh
            updates.avatarUrl = authUser.photoURL;
            userData.avatarUrl = authUser.photoURL;
        }

        if (Object.keys(updates).length > 0) {
            try {
                await db.collection('users').doc(authUser.uid).set(updates, { merge: true });
            } catch (e) {
                // Ignore write errors for updates
            }
        }
        return userData;
    }
  };

  const formatError = (err: any) => {
    console.error("Auth Error Object:", err);
    if (err.code === 'auth/unauthorized-domain') {
      return "Domain not allowed. Go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add this domain.";
    }
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/user-cancelled') {
      return "Login cancelled. If you did not close the popup, you likely need to add this domain/IP (e.g., 127.0.0.1) to Firebase Console > Authentication > Settings > Authorized Domains.";
    }
    if (err.code === 'auth/email-already-in-use') {
      return "This email is already registered. Please log in.";
    }
    if (err.code === 'auth/invalid-credential') {
      return "Invalid email or password.";
    }
    if (err.code === 'auth/popup-blocked') {
        return "Popup blocked. Please allow popups for this site.";
    }
    if (err.code === 'auth/operation-not-allowed') {
        return "Google Sign-In is not enabled. Go to Firebase Console > Authentication > Sign-in method and enable Google.";
    }
    if (err.message && err.message.includes('offline')) {
        return "You are offline. Please check your internet connection.";
    }
    return err.message ? err.message.replace('Firebase: ', '') : "An unknown error occurred.";
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (!auth) {
        setError("Firebase configuration missing. Cannot log in.");
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const userProfile = await ensureUserDocument(userCredential.user);
      onLogin(userProfile);
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!auth) {
        setError("Firebase configuration missing. Cannot sign up.");
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      // Update Auth Profile
      await userCredential.user?.updateProfile({
        displayName: username
      });
      
      const userProfile = await ensureUserDocument(userCredential.user, { username });
      onLogin(userProfile);
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    if (!auth || !googleProvider) {
        setError("Firebase configuration missing.");
        setIsLoading(false);
        return;
    }

    try {
        const result = await auth.signInWithPopup(googleProvider);
        const userProfile = await ensureUserDocument(result.user);
        onLogin(userProfile);
    } catch (err: any) {
        setError(formatError(err));
        setIsLoading(false);
    }
  };

  const resetForm = () => {
    setError(null);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  // --- LANDING SCREEN (First View) ---
  if (viewMode === 'landing') {
    return (
      <div className="relative w-full h-full min-h-screen overflow-hidden flex flex-col font-sans bg-white">
        
        {/* Top Bar */}
        <div className="relative z-10 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {displayHeaderLogo && (
                    <img src={displayHeaderLogo} alt="Logo" className="h-8 object-contain" />
                )}
            </div>
            <button className="text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <Menu size={28} />
            </button>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="flex flex-col items-center animate-in zoom-in duration-500">
                {APP_CONFIG.logoUrl ? (
                   <img 
                      src={APP_CONFIG.logoUrl} 
                      alt={APP_CONFIG.appName} 
                      className="w-80 md:w-96 h-auto object-contain drop-shadow-xl mb-6"
                   />
                ) : (
                   <>
                     <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 transform -rotate-6 ${APP_CONFIG.primaryGradient}`}>
                          <Flame className="text-white fill-white" size={64} />
                     </div>
                     <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase drop-shadow-sm">
                         Sport<span className="text-red-500">Line</span>
                     </h1>
                   </>
                )}
            </div>
        </div>

        {/* Bottom Actions */}
        <div className="relative z-10 px-6 pb-12 w-full max-w-md mx-auto space-y-4">
            <button 
                onClick={() => { setViewMode('signup'); resetForm(); }}
                className={`w-full py-3.5 rounded-full text-white font-bold text-lg tracking-wide shadow-lg transform active:scale-95 transition-transform ${APP_CONFIG.primaryGradient}`}
            >
                Create Account
            </button>

            <button 
                onClick={() => { setViewMode('login'); resetForm(); }}
                className="w-full py-3.5 rounded-full bg-transparent border-2 border-gray-200 text-gray-700 font-bold text-lg tracking-wide hover:bg-gray-50 transform active:scale-95 transition-all"
            >
                Log In
            </button>
        </div>
      </div>
    );
  }

  // --- LOGIN / SIGNUP FORM (Overlay) ---
  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-white flex flex-col font-sans">
       
       <div className="px-4 py-4 flex items-center">
            <button 
                onClick={() => setViewMode('landing')}
                className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
                <ArrowLeft size={28} />
            </button>
       </div>

       <div className="flex-1 px-8 flex flex-col items-center pt-4 overflow-y-auto">
            <div className="mb-4">
                {APP_CONFIG.logoUrl ? (
                    <img src={APP_CONFIG.logoUrl} alt="Logo" className="h-24 w-auto object-contain drop-shadow-md" />
                ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${APP_CONFIG.primaryGradient}`}>
                        <Flame className="text-white fill-white" size={32} />
                    </div>
                )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {viewMode === 'login' ? 'Welcome Back!' : 'Create Account'}
            </h2>

            <div className="w-full max-w-sm space-y-6 pb-8">
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-full border border-gray-300 bg-white text-gray-700 font-bold text-base shadow-sm hover:bg-gray-50 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <span className="relative bg-white px-4 text-sm text-gray-500 font-medium">or</span>
                </div>

                {error && (
                    <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2 text-red-600 text-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={viewMode === 'login' ? handleLoginSubmit : handleSignupSubmit} className="space-y-4">
                    
                    {viewMode === 'signup' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Display Name</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-gray-900 font-medium"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-gray-900 font-medium"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-gray-900 font-medium"
                            placeholder="••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 rounded-full text-white font-bold text-lg tracking-wide shadow-lg transform active:scale-95 transition-transform ${APP_CONFIG.primaryGradient}`}
                    >
                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (viewMode === 'login' ? 'Log In' : 'Create Account')}
                    </button>
                </form>
            </div>
       </div>
    </div>
  );
};

export default LoginView;