import { Party, User, SportType } from './types';
import React from 'react';
import {Footprints, Bike, PersonStanding, Activity} from 'lucide-react';

// --- APP CONFIGURATION ---
export const APP_CONFIG = {
  // ✨ CONFIGURATION: Main Logo (Large) - Used in Landing Center and Login Form
  logoUrl: "https://cdn.discordapp.com/attachments/1198199524955529287/1470809699958919291/1770738733559.png?ex=698df746&is=698ca5c6&hm=2c2249e709caf864a287b0c1145dd09525d32289f48584b4f59a964041e7efeb&", 
  
  // ✨ CONFIGURATION: Header Logo (Small) - Used in Top Left Bar
  headerLogoUrl: "https://cdn.discordapp.com/attachments/1198199524955529287/1470810545341989091/1770738946579.png?ex=698d4f50&is=698bfdd0&hm=534c334a6a7a63aa0bd083392cf964f756f80f50228e2605e22118bafa359de1&", 

  appName: "Sport Line",
  primaryGradient: "bg-gradient-to-r from-red-500 to-pink-600",
  textGradient: "bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-600"
};

// Default map center (Khon Kaen as requested)
export const KHON_KAEN_CENTER = { lat: 16.4322, lng: 102.8236 };
export const DEFAULT_CENTER = KHON_KAEN_CENTER; 
export const DEFAULT_CITY = "Khon Kaen";

export const INITIAL_USER: User = {
  uid: "",
  username: "calyxohm",
  displayName: "CalyxOhm",
  email: "calyxohm@example.com",
  avatarUrl: "https://picsum.photos/200/200",
  bio: "Just a sports fan! Love meeting new people for a game.",
  gender: "Prefer not to say",
  preferredSports: ['Football', 'Badminton'],
  skillLevel: 'Intermediate',
  locationMode: 'static',
  staticCoords: KHON_KAEN_CENTER,
  isVisible: true,
  geohash: "",
};

// ✨ CUSTOMIZATION: Helper for consistent icon sizing
// Replace the 'src' string with your own image URL
const SportIcon = ({ src }: { src: string }) => (
  <img src={src} className="w-5 h-5 object-contain" alt="sport-icon" />
);

export const SPORTS_LIST: { type: SportType; label: string; icon: React.ReactNode }[] = [
  { 
    type: 'All', 
    label: 'All Sports', 
    icon: <Activity size={16} /> 
  },
  { 
    type: 'Football', 
    label: 'Football', 
    icon: <SportIcon src="https://scontent-bkk1-2.xx.fbcdn.net/v/t1.15752-9/625479480_2815063875508348_1299433945545769362_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=105&ccb=1-7&_nc_sid=0024fc&_nc_ohc=v3-EB4dP75YQ7kNvwHDY7a8&_nc_oc=AdlW8YJk08k4iz1Fi_cEm8GxVe5n2b4jgL6WD_0p9TfwhNBkap9GQRrk-IoWrNMhNpo&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-2.xx&oh=03_Q7cD4gFFjsrVyQtmqe-uCsPtXFiTT7_hbsGlZyhO2GXdo9AjeQ&oe=69B412EE" /> 
  },
  { 
    type: 'Basketball', 
    label: 'Basketball', 
    icon: <SportIcon src="https://scontent-bkk1-2.xx.fbcdn.net/v/t1.15752-9/628227202_1207636497744026_8656495493284332119_n.jpg?stp=dst-jpg_p480x480_tt6&_nc_cat=107&ccb=1-7&_nc_sid=0024fc&_nc_ohc=fr9BePp1DqwQ7kNvwFQfVgh&_nc_oc=AdntcUkMbz9PpP4XsqzksrGU-DvNl-Nv9jx-vhiHFLokarE8mTq_xsoYmYMUFjr78Ho&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-2.xx&oh=03_Q7cD4gHdnLgeW_7pCwrTS33g_kmEyshQ-G5Z7EgfJ_gTjvAFtQ&oe=69B415CD" /> 
  },
  { 
    type: 'Badminton', 
    label: 'Badminton', 
    icon: <SportIcon src="https://scontent-bkk1-1.xx.fbcdn.net/v/t1.15752-9/627373711_2462168940868197_3866383048095157629_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=0024fc&_nc_ohc=Ux-M_wiHfHsQ7kNvwFeTIk2&_nc_oc=AdmCn-bCVQfpvLy3M341LNrcRUiFcjPwAsLybA_WHbK6QrWnqFVqX3SXjHu9oDJex5k&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-1.xx&oh=03_Q7cD4gFlVOWPqR3Ttk8JQ5JudTscHWiGOVNUsugxWk01E2LB2Q&oe=69B40E80" /> 
  },
  { 
    type: 'Tennis', 
    label: 'Tennis', 
    icon: <SportIcon src="https://scontent-bkk1-2.xx.fbcdn.net/v/t1.15752-9/627853533_890411217073725_4490951804069085752_n.jpg?stp=dst-jpg_p480x480_tt6&_nc_cat=107&ccb=1-7&_nc_sid=0024fc&_nc_ohc=5-Vuhlgbho8Q7kNvwEfAFJa&_nc_oc=Admu07Q8xMVvmxEEQOkYtFkan54aHucyC0-GX3OaFYkjdCYezKBejSu16grws0GMGVk&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-2.xx&oh=03_Q7cD4gFKEUDbcLPqqIifXpR3bDNaStQd8PjeFofrEE1vIqUhDw&oe=69B420A5" /> 
  },
  { 
    type: 'Running', 
    label: 'Running', 
    icon: <Footprints size={16}/> 
  },
  { 
    type: 'Cycling', 
    label: 'Cycling', 
    icon: <Bike size={16} /> 
  },
  { 
    type: 'Yoga', 
    label: 'Yoga', 
    icon: <PersonStanding size={16} /> 
  },
];

export const INITIAL_PARTIES: Party[] = [
  {
    id: '1',
    title: 'Evening 5v5 Match',
    sport: 'Football',
    description: 'Casual game, need 2 more players.',
    date: '2023-10-25',
    startTime: '18:00',
    endTime: '20:00',
    playersCurrent: 8,
    playersMax: 10,
    latitude: 16.4322 + 0.002,
    longitude: 102.8236 + 0.002,
    host: 'JohnDoe',
    members: ['JohnDoe', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6', 'Player7', 'Player8']
  },
  {
    id: '2',
    title: 'Morning Badminton',
    sport: 'Badminton',
    description: 'Doubles practice, intermediate level.',
    date: '2023-10-26',
    startTime: '08:00',
    endTime: '10:00',
    playersCurrent: 2,
    playersMax: 4,
    latitude: 16.4322 - 0.003,
    longitude: 102.8236 - 0.001,
    host: 'JaneSmith',
    members: ['JaneSmith', 'Partner1']
  },
  {
    id: '3',
    title: 'Morning Badminton',
    sport: 'Badminton',
    description: 'Doubles practice, intermediate level.',
    date: '2023-10-26',
    startTime: '08:00',
    endTime: '10:00',
    playersCurrent: 2,
    playersMax: 4,
    latitude: 16.4809,
    longitude: 102.8291,
    host: 'JaneSmith',
    members: ['JaneSmith', 'Partner1']
  },
  {
    id: '4',
    title: 'Basketball ห้าๆ',
    sport: 'Basketball',
    description: 'เล่นบาสโหดๆ',
    date: '2025-2-11',
    startTime: '08:00',
    endTime: '10:00',
    playersCurrent: 2,
    playersMax: 10,
    latitude: 16.4813,
    longitude: 102.8312,
    host: 'หมาก',
    members: ['หมาก', 'กิว']
  }
];