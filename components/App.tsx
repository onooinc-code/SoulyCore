"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
    DashboardIcon,
} from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/providers/AppProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import dynamic from 'next/dynamic';
import LogOutputPanel from './LogOutputPanel';
import ContextMenu, { MenuItem } from './ContextMenu';
import UniversalProgressIndicator from './UniversalProgressIndicator';
import NavigationRail from './NavigationRail';
import ConversationPanel from './ConversationPanel';

const ContactsHub = dynamic(() => import('@/components/ContactsHub'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Contacts Hub...</p></div>
});

const MemoryCenter = dynamic(() => import('@/components/MemoryCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Memory Center...</p></div>
});

const DevCenter = dynamic(() => import('@/components/dev_center/DevCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Dev Center...</p></div>
});

const BrainCenter = dynamic(() => import('@/components/brain_center/BrainCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Brain Center...</p></div>
});

const DashboardCenter = dynamic(() => import('@/components/dashboard/DashboardCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Dashboard...</p></div>
});

const BookmarksModal = dynamic(() => import('@/components/BookmarksModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Bookmarks...</p></div>
});
const GlobalSettingsModal = dynamic(() => import('@/components/GlobalSettingsModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Settings...</p></div>
});
const PromptsHub = dynamic(() => import('@/components/PromptsHub'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Prompts Hub...</p></div>
});
const ShortcutsModal = dynamic(() => import('@/components/ShortcutsModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Shortcuts...</p></div>
});
const AddKnowledgeModal = dynamic(() => import('@/components/AddKnowledgeModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading...</p></div>
});


export const App = () => {
    const { 
        createNewConversation, 
        clearMessages, 
        currentConversation, 
        isConversationPanelOpen, 
        setConversationPanelOpen, 
        isLogPanelOpen,
        setLogPanelOpen,
        changeFontSize,
        activeView,
        setActiveView,
    } = useAppContext();

    const [isGlobalSettingsOpen, setGlobalSettingsOpen] = useState(false);
    const [isBookmarksOpen, setBookmarksOpen] = useState(false);
    const [isShortcutsModalOpen, setShortcutsModalOpen] = useState(false);
    const [isAddKnowledgeModalOpen, setAddKnowledgeModalOpen] = useState(false);
    
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        items: MenuItem[];
    }>({ isOpen: false, position: { x: 0, y: 0 }, items: [] });


    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();

        const menuItems: MenuItem[] = [
            { isSeparator: true },
            { label: 'Toggle Conversation Panel', icon: SidebarLeftIcon, action: () => setConversationPanelOpen(prev => !prev) },
            { label: 'Toggle Log Panel', icon: LogIcon, action: () => setLogPanelOpen(prev => !prev) },
            { label: 'Increase Font Size', icon: PlusIcon, action: () => changeFontSize('increase') },
            { label: 'Decrease Font Size', icon: MinusIcon, action: () => changeFontSize('decrease') },
            { isSeparator: true },
            { isSeparator: true },
            { label: 'New Chat', icon: PlusIcon, action: createNewConversation, disabled: !createNewConversation },
            { label: 'Clear Messages', icon: ClearIcon, action: () => currentConversation && clearMessages(currentConversation.id), disabled: !currentConversation },
            { label: 'Delete Conversation', icon: TrashIcon, action: () => alert("Not implemented"), disabled: !currentConversation },
            { isSeparator: true },
            { isSeparator: true },
            { label: 'Add Knowledge Snippet', icon: KnowledgeIcon, action: () => setAddKnowledgeModalOpen(true) },
            { label: 'Memory Center', icon: MemoryIcon, action: () => setActiveView('memory_center') },
            { isSeparator: true },
            { isSeparator: true },
            { label: 'Dashboard Center', icon: DashboardIcon, action: () => setActiveView('dashboard') },
            { label: 'Brain Center', icon: BrainIcon, action: () => setActiveView('brain_center') },
            { label: 'Contacts Hub', icon: UsersIcon, action: () => setActiveView('contacts_hub') },
            { label: 'Prompts Hub', icon: PromptsIcon, action: () => setActiveView('prompts_hub') },
            { label: 'Dev Center', icon: CodeIcon, action: () => setActiveView('dev_center') },
            { isSeparator: true },
            { isSeparator: true },
            { label: 'Keyboard Shortcuts', icon: KeyboardIcon, action: () => setShortcutsModalOpen(true) },
        ];
        
        setContextMenu({
            isOpen: true,
            position: { x: event.clientX, y: event.clientY },
            items: menuItems,
        });
    };

    useKeyboardShortcuts({
        'mod+n': createNewConversation,
        'mod+k': () => setActiveView('memory_center'),
    });
    
    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardCenter />;
            case 'brain_center': return <BrainCenter />;
            case 'memory_center': return <MemoryCenter />;
            case 'contacts_hub': return <ContactsHub />;
            case 'prompts_hub': return <PromptsHub />;
            case 'dev_center': return <DevCenter />;
            case 'chat':
            default:
                return <ChatWindow />;
        }
    };

    return (
        <div onContextMenu={handleContextMenu} className="font-sans">
            <MorningBriefing />
            <UniversalProgressIndicator />
            <main className="flex h-screen w-screen overflow-hidden bg-gray-900 text-gray-100">
                <NavigationRail 
                    setBookmarksOpen={setBookmarksOpen}
                    setGlobalSettingsOpen={setGlobalSettingsOpen}
                />
                <AnimatePresence>
                    {isConversationPanelOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0, x: -50 }}
                            animate={{ width: 320, opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -50 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="flex-shrink-0"
                        >
                            <ConversationPanel />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col min-w-0 bg-gray-900">
                    {renderActiveView()}
                     <AnimatePresence>
                        {isLogPanelOpen && <LogOutputPanel isOpen={isLogPanelOpen} />}
                    </AnimatePresence>
                </div>

                {isGlobalSettingsOpen && <GlobalSettingsModal setIsOpen={setGlobalSettingsOpen} />}
                {isBookmarksOpen && <BookmarksModal isOpen={isBookmarksOpen} setIsOpen={setBookmarksOpen} />}
                {isShortcutsModalOpen && <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />}
                {isAddKnowledgeModalOpen && <AddKnowledgeModal isOpen={isAddKnowledgeModalOpen} onClose={() => setAddKnowledgeModalOpen(false)} />}
                
                <ContextMenu
                    isOpen={contextMenu.isOpen}
                    position={contextMenu.position}
                    items={contextMenu.items}
                    onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
                />
            </main>
        </div>
    );
};