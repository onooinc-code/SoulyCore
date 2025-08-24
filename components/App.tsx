"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import MemoryCenter from './MemoryCenter';
import DevCenter from './dev_center/DevCenter';
import ContactsHub from './ContactsHub';
import { MenuIcon, XIcon, MemoryIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts';
import MorningBriefing from './MorningBriefing';


const App: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMemoryCenterOpen, setMemoryCenterOpen] = useState(false);
    const [isDevCenterOpen, setDevCenterOpen] = useState(false);
    const [isContactsHubOpen, setContactsHubOpen] = useState(false);

    useKeyboardShortcuts({
        'mod+k': () => setMemoryCenterOpen(true),
        'mod+n': () => console.log("New chat shortcut pressed"), // Integrate with createNewConversation
    });

    return (
        <>
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
                                setDevCenterOpen={setDevCenterOpen}
                                setContactsHubOpen={setContactsHubOpen} 
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
                     <div className="absolute top-4 right-4 z-20 hidden md:block">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMemoryCenterOpen(true)} 
                            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 flex items-center gap-2"
                            title="Open Memory Center (Cmd+K)"
                        >
                            <MemoryIcon className="w-5 h-5" />
                            <span>Memory Center</span>
                        </motion.button>
                    </div>
                    <main className="flex-1 overflow-y-auto">
                        <ChatWindow />
                    </main>
                </div>
                
                <AnimatePresence>
                    {isMemoryCenterOpen && <MemoryCenter setIsOpen={setMemoryCenterOpen} />}
                    {isDevCenterOpen && <DevCenter setIsOpen={setDevCenterOpen} />}
                    {isContactsHubOpen && <ContactsHub setIsOpen={setContactsHubOpen} />}
                </AnimatePresence>
            </div>
            <MorningBriefing />
        </>
    );
};

export default App;
