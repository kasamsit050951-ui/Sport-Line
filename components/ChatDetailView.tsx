import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, Info, Send, Image as ImageIcon, Smile } from 'lucide-react';
import { ChatUser } from './ChatListView';

interface ChatDetailViewProps {
  chatUser: ChatUser;
  onBack: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

const ChatDetailView: React.FC<ChatDetailViewProps> = ({ chatUser, onBack }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hey! Are you free for a match today?', sender: 'them', timestamp: '10:30 AM' },
    { id: '2', text: 'Yeah, I was thinking about playing badminton.', sender: 'me', timestamp: '10:32 AM' },
    { id: '3', text: 'Great! Where do you usually play?', sender: 'them', timestamp: '10:33 AM' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  return (
    <div className="fixed inset-0 bg-white z-[2000] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shadow-sm bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-2 text-blue-600 rounded-full hover:bg-blue-50">
            <ArrowLeft size={24} />
          </button>
          <div className="relative">
             <img src={chatUser.avatarUrl} alt={chatUser.name} className="w-10 h-10 rounded-full object-cover" />
             {chatUser.isOnline && !chatUser.isGroup && (
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
             )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-none">{chatUser.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {chatUser.isGroup 
                ? `${chatUser.members || 2} members` 
                : (chatUser.isOnline ? 'Active now' : chatUser.statusText)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-blue-600">
          <Phone size={24} />
          <Video size={24} />
          <Info size={24} />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        <div className="text-center text-xs text-gray-400 my-4">Today</div>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'them' && (
               <img src={chatUser.avatarUrl} className="w-8 h-8 rounded-full self-end mr-2 mb-1" />
            )}
            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-[15px] ${
              msg.sender === 'me' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-3 pb-safe">
        <button className="text-blue-600 p-2 hover:bg-gray-100 rounded-full">
            <ImageIcon size={24} />
        </button>
        <form onSubmit={handleSend} className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
            <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
            />
            <button type="button" className="text-gray-400">
                <Smile size={24} />
            </button>
        </form>
        <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="text-blue-600 p-2 hover:bg-blue-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Send size={24} />
        </button>
      </div>
    </div>
  );
};

export default ChatDetailView;