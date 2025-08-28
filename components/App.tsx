"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import MorningBriefing from '@/components/MorningBriefing';
import { 
    MenuIcon, XIcon, MemoryIcon, PlusIcon, TrashIcon, SparklesIcon,
    SidebarLeftIcon, LogIcon, UsersIcon, CodeIcon, BookmarkListIcon, SettingsIcon,
    CopyIcon, FullscreenIcon, ExitFullscreenIcon, ClearIcon, KnowledgeIcon,
    KeyboardIcon,
    PromptsIcon,
} from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/providers/AppProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import dynamic from 'next/dynamic';
import LogOutputPanel from './LogOutputPanel';
import ContextMenu, { MenuItem } from './ContextMenu';

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

const AddKnowledgeModal = dynamic(() => import('@/components/AddKnowledgeModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading...</p></div>
});

const ShortcutsModal = dynamic(() => import('@/components/ShortcutsModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading...</p></div>
});

const PromptsHub = dynamic(() => import('@/components/PromptsHub'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Prompts...</p></div>
});


const App = () => {
    const { 
        createNewConversation, 
        currentConversation, 
        deleteConversation, 
        generateConversationTitle,
        clearMessages,
        messages,
        toggleBookmark,
        setCurrentConversation,
    } = useAppContext();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMemoryCenterOpen, setMemoryCenterOpen] = useState(false);
    const [isContactsHubOpen, setContactsHubOpen] = useState(false);
    const [isPromptsHubOpen, setPromptsHubOpen] = useState(false);
    const [isDevCenterOpen, setDevCenterOpen] = useState(false);
    const [isGlobalSettingsOpen, setGlobalSettingsOpen] = useState(false);
    const [isBookmarksOpen, setBookmarksOpen] = useState(false);
    const [isLogPanelOpen, setLogPanelOpen] = useState(false);
    const [isAddKnowledgeOpen, setAddKnowledgeOpen] = useState(false);
    const [isShortcutsOpen, setShortcutsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number; y: number } }>({
        isOpen: false,
        position: { x: 0, y: 0 },
    });

    useKeyboardShortcuts({
        'mod+k': () => setMemoryCenterOpen(prev => !prev),
        'mod+n': () => createNewConversation(),
    });

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };
    
    const runMemoryPipeline = () => {
        if (!currentConversation || messages.length < 2) {
            alert("Need at least one user/model exchange to run memory pipeline.");
            return;
        }
        const lastTwoMessages = messages.slice(-2);
        const textToAnalyze = lastTwoMessages.map(m => m.content).join('\n');
        
        fetch('/api/memory/pipeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textToAnalyze })
        })
        .then(res => res.json())
        .then(data => alert(`Memory pipeline run successfully! New knowledge upserted: ${data.newKnowledgeUpserted}`))
        .catch(err => alert(`Memory pipeline trigger failed: ${err.message}`));
    };
    
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
        });
    };

    const lastModelMessage = messages.filter(m => m.role === 'model').pop();

    const menuItems: MenuItem[] = [
        { label: 'Application', isSeparator: true },
        { label: 'New Conversation', icon: PlusIcon, action: createNewConversation },
        { label: 'Toggle Sidebar', icon: SidebarLeftIcon, action: () => setSidebarOpen(p => !p) },
        { label: 'Toggle Log Panel', icon: LogIcon, action: () => setLogPanelOpen(p => !p) },
        { label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen', icon: isFullscreen ? ExitFullscreenIcon : FullscreenIcon, action: toggleFullscreen },
        { label: 'Conversation', isSeparator: true },
        { label: 'Generate Title', icon: SparklesIcon, action: () => currentConversation && generateConversationTitle(currentConversation.id), disabled: !currentConversation },
        { label: 'Clear Messages', icon: ClearIcon, action: () => currentConversation && clearMessages(currentConversation.id), disabled: !currentConversation },
        { label: 'Close Conversation', icon: XIcon, action: () => setCurrentConversation(null), disabled: !currentConversation },
        { label: 'Delete Conversation', icon: TrashIcon, action: () => currentConversation && deleteConversation(currentConversation.id), disabled: !currentConversation },
        { label: 'Message Actions', isSeparator: true },
        { label: 'Copy Last Response', icon: CopyIcon, action: () => lastModelMessage && navigator.clipboard.writeText(lastModelMessage.content), disabled: !lastModelMessage },
        { label: 'Bookmark Last Response', icon: BookmarkListIcon, action: () => lastModelMessage && toggleBookmark(lastModelMessage.id), disabled: !lastModelMessage },
        { label: 'Memory & Knowledge', isSeparator: true },
        { label: 'Run Memory Pipeline', icon: MemoryIcon, action: runMemoryPipeline, disabled: !currentConversation || messages.length < 2 },
        { label: 'Add Knowledge Snippet', icon: KnowledgeIcon, action: () => setAddKnowledgeOpen(true) },
        { label: 'Quick Access', isSeparator: true },
        { label: 'Open Memory Center', icon: MemoryIcon, action: () => setMemoryCenterOpen(true) },
        { label: 'Open Contacts Hub', icon: UsersIcon, action: () => setContactsHubOpen(true) },
        { label: 'Open Prompts Hub', icon: PromptsIcon, action: () => setPromptsHubOpen(true) },
        { label: 'Open Dev Center', icon: CodeIcon, action: () => setDevCenterOpen(true) },
        { label: 'Open Bookmarks', icon: BookmarkListIcon, action: () => setBookmarksOpen(true) },
        { label: 'Help', isSeparator: true },
        { label: 'Keyboard Shortcuts', icon: KeyboardIcon, action: () => setShortcutsOpen(true) },
        { label: 'Global Settings', icon: SettingsIcon, action: () => setGlobalSettingsOpen(true) },
    ];

    return (
        <>
            <MorningBriefing />
            <div className="flex h-screen bg-gray-900 text-gray-200 font-sans overflow-hidden" onContextMenu={handleContextMenu}>
                <AnimatePresence>
                    {isSidebarOpen && (
                         <motion.div
                            initial={{ x: '-100%', width: 0 }}
                            animate={{ x: 0, width: '16rem' }} // 16rem is w-64
                            exit={{ x: '-100%', width: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="fixed inset-y-0 left-0 z-30 bg-gray-800 md:relative md:flex-shrink-0"
                        >
                           <Sidebar 
                                setMemoryCenterOpen={setMemoryCenterOpen}
                                setContactsHubOpen={setContactsHubOpen} 
                                setPromptsHubOpen={setPromptsHubOpen}
                                setDevCenterOpen={setDevCenterOpen}
                                setGlobalSettingsOpen={setGlobalSettingsOpen}
                                setBookmarksOpen={setBookmarksOpen}
                                setLogPanelOpen={setLogPanelOpen}
                                isSidebarOpen={isSidebarOpen}
                                setSidebarOpen={setSidebarOpen}
                           />
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>

                <div className="flex-1 flex flex-col relative">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute top-4 left-4 z-40 md:hidden p-2 rounded-md bg-gray-700 hover:bg-gray-600">
                        {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                    
                    <ChatWindow />
                    <LogOutputPanel isOpen={isLogPanelOpen} />
                </div>
                
                <AnimatePresence>
                    {isMemoryCenterOpen && <MemoryCenter setIsOpen={setMemoryCenterOpen} />}
                    {isContactsHubOpen && <ContactsHub setIsOpen={setContactsHubOpen} />}
                    {isPromptsHubOpen && <PromptsHub setIsOpen={setPromptsHubOpen} />}
                    {isDevCenterOpen && <DevCenter setIsOpen={setDevCenterOpen} />}
                    {isGlobalSettingsOpen && <GlobalSettingsModal setIsOpen={setGlobalSettingsOpen} />}
                    {isBookmarksOpen && <BookmarksModal isOpen={isBookmarksOpen} setIsOpen={setBookmarksOpen} />}
                    {isAddKnowledgeOpen && <AddKnowledgeModal isOpen={isAddKnowledgeOpen} onClose={() => setAddKnowledgeOpen(false)} />}
                    {isShortcutsOpen && <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setShortcutsOpen(false)} />}
                </AnimatePresence>
                
                <ContextMenu 
                    items={menuItems} 
                    isOpen={contextMenu.isOpen} 
                    position={contextMenu.position} 
                    onClose={() => setContextMenu({ ...contextMenu, isOpen: false })} 
                />
            </div>
        </>
    );
};

export default App;