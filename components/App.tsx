
"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import MorningBriefing from '@/components/MorningBriefing';
import { MenuIcon, XIcon, MemoryIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/providers/AppProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import dynamic from 'next/dynamic';
import LogOutputPanel from './LogOutputPanel';

const ContactsHub = dynamic(() => import('@/components/ContactsHub'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Contacts Hub...</p></div>
});

const MemoryCenter = dynamic(() => import('@/components/MemoryCenter'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Memory Center...</p></div>
});

const DevCenter = dynamic(() => import('@/components/dev_center/DevCenter'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Dev Center...</p></div>
});

const GlobalSettingsModal = dynamic(() => import('@/components/GlobalSettingsModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Settings...</p></div>
});

const BookmarksModal = dynamic(() => import('@/components/BookmarksModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Bookmarks...</p></div>
});

const App: React.FC = () => {
    const { createNewConversation, settings } = useAppContext();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMemoryCenterOpen, setMemoryCenterOpen] = useState(false);
    const [isContactsHubOpen, setContactsHubOpen] = useState(false);
    const [isDevCenterOpen, setDevCenterOpen] = useState(false);
    const [isGlobalSettingsOpen, setGlobalSettingsOpen] = useState(false);
    const [isBookmarksOpen, setBookmarksOpen] = useState(false);
    const [isLogPanelOpen, setLogPanelOpen] = useState(false);
    
    useKeyboardShortcuts({
        'mod+k': () => setMemoryCenterOpen(prev => !prev),
        'mod+n': () => createNewConversation(),
    });

    return (
        <>
            <MorningBriefing />
            <div className="flex h-screen bg-gray-900 text-gray-200 font-sans overflow-hidden">
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 md:relative md:translate-x-0"
                        >
                           <Sidebar 
                                setMemoryCenterOpen={setMemoryCenterOpen}
                                setContactsHubOpen={setContactsHubOpen} 
                                setDevCenterOpen={setDevCenterOpen}
                                setGlobalSettingsOpen={setGlobalSettingsOpen}
                                setBookmarksOpen={setBookmarksOpen}
                                setLogPanelOpen={setLogPanelOpen}
                           />
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>

                <div className="flex-1 flex flex-col relative">
                    <div className="absolute top-4 left-4 z-40 md:hidden">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600">
                            {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    
                    <main className="flex-1 flex flex-col overflow-y-auto">
                        <ChatWindow />
                        <LogOutputPanel isOpen={isLogPanelOpen} />
                    </main>
                </div>
                
                <AnimatePresence>
                    {isMemoryCenterOpen && <MemoryCenter setIsOpen={setMemoryCenterOpen} />}
                    {isContactsHubOpen && <ContactsHub setIsOpen={setContactsHubOpen} />}
                    {isDevCenterOpen && <DevCenter setIsOpen={setDevCenterOpen} />}
                    {isGlobalSettingsOpen && <GlobalSettingsModal setIsOpen={setGlobalSettingsOpen} />}
                    {isBookmarksOpen && <BookmarksModal setIsOpen={setBookmarksOpen} />}
                </AnimatePresence>
            </div>
        </>
    );
};

export default App;