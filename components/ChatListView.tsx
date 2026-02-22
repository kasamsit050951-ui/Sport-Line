import React, { useState } from 'react';
import { Plus, Check, Users, Camera, X } from 'lucide-react';

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string;
  statusText?: string;
  timestamp?: string;
  isOnline?: boolean;
  isUnread?: boolean;
  isGroup?: boolean;
  members?: number;
}

// Generic mock data
const INITIAL_CHATS: ChatUser[] = [
  {
    id: '1',
    name: 'โมด',
    avatarUrl: 'https://scontent-bkk1-1.xx.fbcdn.net/v/t1.15752-9/610523088_1619014532633177_8332212428718522073_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=101&ccb=1-7&_nc_sid=0024fc&_nc_ohc=Mj1Lm4dCu70Q7kNvwE2M218&_nc_oc=AdkLG72AhbZTEB00F9e3ht8lHTntl2XiCBrM1EJHxWROBw3-XMzakafC0npOidbKCQQ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-1.xx&oh=03_Q7cD4gEb2v1wROMPqUt7hXXJ_sFpUmlp-6HAuX9TpwgG0B2M-w&oe=69B411A9',
    statusText: 'Sent 7 minutes ago',
    timestamp: '7 min',
    isOnline: false,
  },
  {
    id: '2',
    name: 'พชร',
    avatarUrl: 'https://scontent-bkk1-1.xx.fbcdn.net/v/t1.15752-9/628247701_4109628906016596_7626032654308115488_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=0024fc&_nc_ohc=V5EMX9rkMZsQ7kNvwFE6XXV&_nc_oc=Adky2DyLElFUHjTDHSYZ5F-oIrOgf71AF-9Rz4BwEGK7-6fWt8ZEwIxh5SPy3WdETFQ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-1.xx&oh=03_Q7cD4gFQeevW7whCatEulS0I3mMtzsawE7LSw7RBmnrCSp_CVQ&oe=69B42982',
    statusText: 'Active Now',
    isOnline: true,
  },
  {
    id: '3',
    name: 'นิว',
    avatarUrl: 'https://scontent-bkk1-2.xx.fbcdn.net/v/t1.15752-9/629703316_1643989240293782_4565751344480766455_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=0024fc&_nc_ohc=mLaUrKUvqHwQ7kNvwGHJjaO&_nc_oc=AdmvmRWIHAUk-g_u9hE9056IzKZ2TTANN6zp76MOHwruaqwpHycJ7zGqOvtDxTzOi9M&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-2.xx&oh=03_Q7cD4gHBKGAMmShKixBkE0ZiwV-hbQ0TYQROwhwmvOuUb_P4Cw&oe=69B417ED',
    statusText: 'Active Now',
    isOnline: true,
  },
  {
    id: '4',
    name: 'หมาก',
    avatarUrl: 'https://scontent-bkk1-1.xx.fbcdn.net/v/t1.15752-9/629958776_1676143067074428_7742444959651936333_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=0024fc&_nc_ohc=4CIX1H_2mCEQ7kNvwG5twT9&_nc_oc=Adk1NU_7LGiMpFVZGjkbOd99SIWatV_xzzc5_rsekU35QdNcDsJBZ354393biqwS8xo&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-1.xx&oh=03_Q7cD4gH9EYV_5Po2r9JyK79lm3bW-XdA9HQL81cq10xDbVb_zw&oe=69B41ACC',
    statusText: 'Active 44 minutes ago',
    timestamp: '44 min',
    isOnline: false,
  },
  {
    id: '5',
    name: 'ไนซ์',
    avatarUrl: 'https://scontent-bkk1-1.xx.fbcdn.net/v/t1.15752-9/629275977_1458479609004296_366514880576972332_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=101&ccb=1-7&_nc_sid=0024fc&_nc_ohc=z3DgPrO478wQ7kNvwFRVpMK&_nc_oc=Adk4C2da2pbtgpxafQ1hnyMxuO-Q1QaWyh0KO0TqhoP13lV7X-a42t0v5qePD6CocOQ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-1.xx&oh=03_Q7cD4gHSZh0j4qoecnMSbLxyw7g_jEaRZ3wvb6SvUFQl-d4FGg&oe=69B42CB5',
    statusText: 'Active 47 minutes ago',
    timestamp: '47 min',
    isOnline: false,
  },
  {
    id: '6',
    name: 'กิว',
    avatarUrl: 'https://scontent-bkk1-2.xx.fbcdn.net/v/t1.15752-9/628049021_1439434794284321_2954792574300492560_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=0024fc&_nc_ohc=VRUIb1Un4tMQ7kNvwGMQpmj&_nc_oc=AdnuNXNTFoXLexwd5J4Fwc9z584cKWZj_wOUs_8JZYMwTav-WKqRa_xRZ8bUVlci35o&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-bkk1-2.xx&oh=03_Q7cD4gEyXw9UG9LtBxHAaTdECfpmdNDTCSTmHZOneAYQG6qCRQ&oe=69B42477',
    statusText: 'Active 7 minutes ago',
    timestamp: '7 min',
    isOnline: false,
  }
];

interface ChatListViewProps {
  onSelectChat: (user: ChatUser) => void;
}

const ChatListView: React.FC<ChatListViewProps> = ({ onSelectChat }) => {
  const [chats, setChats] = useState<ChatUser[]>(INITIAL_CHATS);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends');

  // Friends list (mocking contacts from existing non-group chats)
  const contacts = INITIAL_CHATS.filter(c => !c.isGroup);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
        setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    
    const newGroup: ChatUser = {
        id: Date.now().toString(),
        name: groupName,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random&color=fff`,
        statusText: `Group created with ${selectedIds.length} members`,
        timestamp: 'Just now',
        isGroup: true,
        members: selectedIds.length + 1, // +1 for self
        isOnline: true
    };

    setChats([newGroup, ...chats]);
    setIsCreatingGroup(false);
    setGroupName('');
    setSelectedIds([]);
    setActiveTab('groups'); // Auto switch to groups tab
  };

  // Filter chats based on active tab
  const filteredChats = chats.filter(chat => {
    if (activeTab === 'groups') return chat.isGroup;
    return !chat.isGroup;
  });

  if (isCreatingGroup) {
    return (
        <div className="w-full h-full bg-white flex flex-col font-sans animate-in slide-in-from-bottom duration-300">
            {/* Create Group Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <button onClick={() => setIsCreatingGroup(false)} className="text-gray-500 hover:text-gray-800 font-medium">
                    Cancel
                </button>
                <h2 className="text-lg font-bold">New Group</h2>
                <button 
                    onClick={handleCreateGroup}
                    disabled={!groupName.trim() || selectedIds.length === 0}
                    className={`font-bold transition-colors ${!groupName.trim() || selectedIds.length === 0 ? 'text-gray-300' : 'text-blue-600'}`}
                >
                    Create
                </button>
            </div>

            <div className="p-6 bg-white border-b border-gray-100">
                <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 shadow-sm shrink-0">
                        {groupName ? (
                             <span className="text-xl font-bold">{groupName[0].toUpperCase()}</span>
                        ) : (
                             <Camera size={24} />
                        )}
                     </div>
                     <input 
                        type="text" 
                        placeholder="Group Name"
                        className="flex-1 text-lg font-semibold outline-none placeholder-gray-400 bg-transparent"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        autoFocus
                     />
                </div>
            </div>

            <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                Select Members ({selectedIds.length})
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
                {contacts.map(contact => {
                    const isSelected = selectedIds.includes(contact.id);
                    return (
                        <button 
                            key={contact.id}
                            onClick={() => toggleSelection(contact.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none"
                        >
                            <div className="relative">
                                <img src={contact.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                                {isSelected && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                                        <Check size={10} strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-800 text-base">{contact.name}</span>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                {isSelected && <Check size={14} className="text-white" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans">
      {/* Header */}
      <div className="pt-4 pb-2 px-4 bg-white sticky top-0 z-10 flex items-center justify-between">
         <h1 className="text-2xl font-bold text-black">Chats</h1>
         <button 
            onClick={() => setIsCreatingGroup(true)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-2 px-3"
         >
            <Plus size={20} />
            <span className="text-sm font-semibold">New Group</span>
         </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-100 bg-white sticky top-[60px] z-10">
        <button 
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 text-sm font-bold text-center transition-all border-b-2 ${
                activeTab === 'friends' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
            Friends
        </button>
        <button 
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-3 text-sm font-bold text-center transition-all border-b-2 ${
                activeTab === 'groups' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
            Groups
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col pb-24">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-left active:bg-gray-100"
              >
                {/* Avatar Container */}
                <div className="relative flex-shrink-0">
                  <div className={`w-[60px] h-[60px] rounded-full overflow-hidden bg-gray-200 border border-gray-100 ${chat.isGroup ? 'p-1' : ''}`}>
                      <img src={chat.avatarUrl} alt={chat.name} className={`w-full h-full object-cover ${chat.isGroup ? 'rounded-full' : ''}`} />
                  </div>
                  
                  {/* Online Status Dot */}
                  {chat.isOnline && !chat.isGroup && (
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#31a24c] border-2 border-white rounded-full"></div>
                  )}
                  
                  {/* Group Icon Indicator */}
                  {chat.isGroup && (
                     <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                          <Users size={12} className="text-blue-500 fill-blue-50" />
                     </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-[17px] font-semibold text-black truncate leading-tight">
                          {chat.name}
                      </h3>
                      {chat.timestamp && (
                          <span className="text-[12px] text-gray-400 font-normal ml-2 flex-shrink-0">{chat.timestamp}</span>
                      )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-[15px] text-gray-500 font-light truncate leading-tight">
                    <span className={`truncate ${chat.isUnread ? 'font-bold text-black' : ''}`}>{chat.statusText}</span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                    {activeTab === 'friends' ? <Users size={32} /> : <Users size={32} />}
                </div>
                <p className="text-gray-500 font-medium">No {activeTab} yet</p>
                {activeTab === 'groups' && (
                    <button 
                        onClick={() => setIsCreatingGroup(true)}
                        className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                    >
                        Create a Group
                    </button>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListView;