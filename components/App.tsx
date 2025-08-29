
"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import MorningBriefing from '@/components/MorningBriefing';
import { 
    XIcon, MemoryIcon, PlusIcon, TrashIcon, SparklesIcon,
    SidebarLeftIcon, LogIcon, UsersIcon, CodeIcon, BookmarkListIcon, SettingsIcon,
    FullscreenIcon, ExitFullscreenIcon, ClearIcon, KnowledgeIcon,
    KeyboardIcon,
    PromptsIcon,
    RefreshIcon,
    MinusIcon,
    BrainIcon,
} from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/providers/AppProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import dynamic from 'next/dynamic';
import LogOutputPanel from './LogOutputPanel';
import ContextMenu, { MenuItem } from './ContextMenu';
import UniversalProgressIndicator from './UniversalProgressIndicator';

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

const BrainCenter = dynamic(() => import('@/components/brain_center/BrainCenter'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Brain Center...</p></div>
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
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Prompts Hub...</p></div>
});

type ModalType = 'contactsHub' | 'memoryCenter' | 'devCenter' | 'globalSettings' | 'bookmarks' | 'addKnowledge' | 'shortcuts' | 'promptsHub' | 'brainCenter' | null;

// FIX: Removed `React.FC` to fix framer-motion type inference issue.
const App = () => {
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number; y: number } }>({ isOpen: false, position: { x: 0, y: 0 } });
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const { 
        createNewConversation, 
        currentConversation,
        deleteConversation,
        generateConversationTitle,
        clearMessages,
        messages,
        isLoading,
        isSidebarOpen,
        setSidebarOpen,
        isLogPanelOpen,
        setLogPanelOpen,
    } = useAppContext();

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY } });
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };
    
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useKeyboardShortcuts({
        'mod+n': createNewConversation,
        'mod+k': () => setActiveModal('memoryCenter'),
        'escape': () => {
            if (activeModal) setActiveModal(null);
            if (contextMenu.isOpen) setContextMenu(prev => ({ ...prev, isOpen: false }));
        }
    });

    const contextMenuItems: MenuItem[] = [
        { label: 'New Chat', action: createNewConversation, icon: PlusIcon, disabled: isLoading },
        { label: 'Refresh Application', action: () => window.location.reload(), icon: RefreshIcon },
        { label: 'Toggle Fullscreen', action: toggleFullscreen, icon: isFullscreen ? ExitFullscreenIcon : FullscreenIcon },
        { label: 'Close Modal', action: () => setActiveModal(null), icon: XIcon, disabled: !activeModal },
        { isSeparator: true },
        { label: 'Generate Title', action: () => currentConversation && generateConversationTitle(currentConversation.id), icon: SparklesIcon, disabled: !currentConversation || messages.length < 2 },
        { label: 'Clear Messages', action: () => currentConversation && window.confirm('Are you sure you want to clear all messages in this conversation?') && clearMessages(currentConversation.id), icon: ClearIcon, disabled: !currentConversation || messages.length === 0 },
        { label: 'Delete Conversation', action: () => currentConversation && window.confirm('Are you sure you want to delete this conversation?') && deleteConversation(currentConversation.id), icon: TrashIcon, disabled: !currentConversation },
        { isSeparator: true },
        { label: 'Add Knowledge Snippet', action: () => setActiveModal('addKnowledge'), icon: KnowledgeIcon },
        { label: 'Open Brain Center', action: () => setActiveModal('brainCenter'), icon: BrainIcon },
        { label: 'Open Memory Center', action: () => setActiveModal('memoryCenter'), icon: MemoryIcon },
        { label: 'Open Contacts Hub', action: () => setActiveModal('contactsHub'), icon: UsersIcon },
        { label: 'Open Prompts Hub', action: () => setActiveModal('promptsHub'), icon: PromptsIcon },
        { isSeparator: true },
        { label: 'View Bookmarks', action: () => setActiveModal('bookmarks'), icon: BookmarkListIcon },
        { label: 'Keyboard Shortcuts', action: () => setActiveModal('shortcuts'), icon: KeyboardIcon },
        { label: 'Global Settings', action: () => setActiveModal('globalSettings'), icon: SettingsIcon },
        { label: 'SoulyDev Center', action: () => setActiveModal('devCenter'), icon: CodeIcon },
    ];

    return (
        <main onContextMenu={handleContextMenu} className="flex h-screen w-screen bg-gray-900 overflow-hidden">
            <UniversalProgressIndicator />
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 288, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="flex-shrink-0 h-full"
                    >
                        <Sidebar 
                            setMemoryCenterOpen={() => setActiveModal('memoryCenter')}
                            setContactsHubOpen={() => setActiveModal('contactsHub')}
                            setDevCenterOpen={() => setActiveModal('devCenter')}
                            setBrainCenterOpen={() => setActiveModal('brainCenter')}
                            setGlobalSettingsOpen={() => setActiveModal('globalSettings')}
                            setBookmarksOpen={() => setActiveModal('bookmarks')}
                            setPromptsHubOpen={() => setActiveModal('promptsHub')}
                            setLogPanelOpen={setLogPanelOpen}
                            isSidebarOpen={isSidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="flex-1 flex flex-col min-w-0">
                <ChatWindow />
                <LogOutputPanel isOpen={isLogPanelOpen} />
            </div>

            <MorningBriefing />

            {activeModal === 'contactsHub' && <ContactsHub setIsOpen={() => setActiveModal(null)} />}
            {activeModal === 'memoryCenter' && <MemoryCenter setIsOpen={() => setActiveModal(null)} />}
            {activeModal === 'devCenter' && <DevCenter setIsOpen={() => setActiveModal(null)} />}
            {activeModal === 'brainCenter' && <BrainCenter setIsOpen={() => setActiveModal(null)} />}
            {activeModal === 'globalSettings' && <GlobalSettingsModal setIsOpen={() => setActiveModal(null)} />}
            {activeModal === 'bookmarks' && <BookmarksModal isOpen={activeModal === 'bookmarks'} setIsOpen={() => setActiveModal(null)} />}
            {activeModal === 'addKnowledge' && <AddKnowledgeModal isOpen={activeModal === 'addKnowledge'} onClose={() => setActiveModal(null)} />}
            {activeModal === 'shortcuts' && <ShortcutsModal isOpen={activeModal === 'shortcuts'} onClose={() => setActiveModal(null)} />}
            {activeModal === 'promptsHub' && <PromptsHub setIsOpen={() => setActiveModal(null)} />}
            
            <ContextMenu items={contextMenuItems} position={contextMenu.position} isOpen={contextMenu.isOpen} onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))} />
        </main>
    );
};

export default App;
