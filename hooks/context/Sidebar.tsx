import React from 'react';
import { useAppContext } from './AppContext';
import { PlusIcon, MemoryIcon, CodeIcon, UsersIcon } from '../components/Icons';

interface SidebarProps {
    setMemoryCenterOpen: (isOpen: boolean) => void;
    setDevCenterOpen: (isOpen: boolean) => void;
    setContactsHubOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setMemoryCenterOpen, setDevCenterOpen, setContactsHubOpen }) => {
    const { conversations, currentConversation, setCurrentConversation, createNewConversation } = useAppContext();

    const menuItems = [
        { label: 'Memory Center', icon: MemoryIcon, action: () => setMemoryCenterOpen(true) },
        { label: 'Contacts Hub', icon: UsersIcon, action: () => setContactsHubOpen(true) },
        { label: 'Dev Center', icon: CodeIcon, action: () => setDevCenterOpen(true) },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-800 p-3">
            <button
                onClick={createNewConversation}
                className="flex items-center justify-center w-full p-2 mb-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                New Chat
            </button>
            <div className="space-y-2 mb-4 border-b border-gray-700 pb-4">
                 {menuItems.map(item => (
                     <button
                        key={item.label}
                        onClick={item.action}
                        className="flex items-center w-full p-2 text-sm font-semibold text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </button>
                 ))}
                 
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recent</h2>
                <ul className="space-y-1">
                    {conversations.map(convo => (
                        <li key={convo.id}>
                            <button
                                onClick={() => setCurrentConversation(convo)}
                                className={`w-full text-left p-2 rounded-md text-sm truncate ${currentConversation?.id === convo.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                            >
                                {convo.title}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-2 border-t border-gray-700">
                <p className="text-lg font-bold text-gray-100">SoulyCore</p>
                <p className="text-xs text-gray-400">Your AI with Memory</p>
            </div>
        </div>
    );
};

export default Sidebar;