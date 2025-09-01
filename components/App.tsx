

"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
    DashboardIcon,
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

const DashboardCenter = dynamic(() => import('@/components/dashboard/DashboardCenter'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Dashboard...</p></div>
});
// FIX: Add missing BookmarksModal, GlobalSettingsModal, PromptsHub, and ShortcutsModal dynamic imports
// to support the reconstructed App component's functionality.
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
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Prompts Hub...</p></div>
});
const ShortcutsModal = dynamic(() => import('@/components/ShortcutsModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Shortcuts...</p></div>
});
// FIX: Added AddKnowledgeModal for the context menu functionality.
const AddKnowledgeModal = dynamic(() => import('@/components/AddKnowledgeModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading...</p></div>
});


// FIX: Reconstructed the missing App component, which is the root of the application's UI.
// This component manages the visibility of all major modals and panels, wires up keyboard shortcuts,
// and orchestrates the main layout between the Sidebar and ChatWindow.
export const App = () => {
    const { 
        createNewConversation, 
        clearMessages, 
        currentConversation, 
        isSidebarOpen, 
        setSidebarOpen, 
        isLogPanelOpen,
        setLogPanelOpen,
        changeFontSize
    } = useAppContext();

    const [isMemoryCenterOpen, setMemoryCenterOpen] = useState(false);
    const [isContactsHubOpen, setContactsHubOpen] = useState(false);
    const [isDevCenterOpen, setDevCenterOpen] = useState(false);
    const [isBrainCenterOpen, setBrainCenterOpen] = useState(false);
    const [isDashboardCenterOpen, setDashboardCenterOpen] = useState(false);
    const [isGlobalSettingsOpen, setGlobalSettingsOpen] = useState(false);
    const [isBookmarksOpen, setBookmarksOpen] = useState(false);
    const [isPromptsHubOpen, setPromptsHubOpen] = useState(false);
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
            // FIX: Removed 'label' property from separator items to conform to the 'MenuItem' type definition.
            { isSeparator: true },
            { label: 'Toggle Sidebar', icon: SidebarLeftIcon, action: () => setSidebarOpen(prev => !prev) },
            { label: 'Toggle Log Panel', icon: LogIcon, action: () => setLogPanelOpen(prev => !prev) },
            { label: 'Increase Font Size', icon: PlusIcon, action: () => changeFontSize('increase') },
            { label: 'Decrease Font Size', icon: MinusIcon, action: () => changeFontSize('decrease') },
            { isSeparator: true },
            // FIX: Removed 'label' property from separator items to conform to the 'MenuItem' type definition.
            { isSeparator: true },
            { label: 'New Chat', icon: PlusIcon, action: createNewConversation, disabled: !createNewConversation },
            { label: 'Clear Messages', icon: ClearIcon, action: () => currentConversation && clearMessages(currentConversation.id), disabled: !currentConversation },
            { label: 'Delete Conversation', icon: TrashIcon, action: () => alert("Not implemented"), disabled: !currentConversation },
            { isSeparator: true },
            // FIX: Removed 'label' property from separator items to conform to the 'MenuItem' type definition.
            { isSeparator: true },
            { label: 'Add Knowledge Snippet', icon: KnowledgeIcon, action: () => setAddKnowledgeModalOpen(true) },
            { label: 'Memory Center', icon: MemoryIcon, action: () => setMemoryCenterOpen(true) },
            { isSeparator: true },
            // FIX: Removed 'label' property from separator items to conform to the 'MenuItem' type definition.
            { isSeparator: true },
            { label: 'Dashboard Center', icon: DashboardIcon, action: () => setDashboardCenterOpen(true) },
            { label: 'Brain Center', icon: BrainIcon, action: () => setBrainCenterOpen(true) },
            { label: 'Contacts Hub', icon: UsersIcon, action: () => setContactsHubOpen(true) },
            { label: 'Prompts Hub', icon: PromptsIcon, action: () => setPromptsHubOpen(true) },
            { label: 'Dev Center', icon: CodeIcon, action: () => setDevCenterOpen(true) },
            { isSeparator: true },
            // FIX: Removed 'label' property from separator items to conform to the 'MenuItem' type definition.
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
        'mod+k': () => setMemoryCenterOpen(true),
    });

    return (
        <div onContextMenu={handleContextMenu} className="font-sans">
            <MorningBriefing />
            <UniversalProgressIndicator />
            <main className="flex h-screen w-screen overflow-hidden bg-gray-900 text-gray-100">
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="flex-shrink-0"
                        >
                            <Sidebar
                                setMemoryCenterOpen={setMemoryCenterOpen}
                                setContactsHubOpen={setContactsHubOpen}
                                setDevCenterOpen={setDevCenterOpen}
                                setBrainCenterOpen={setBrainCenterOpen}
                                setDashboardCenterOpen={setDashboardCenterOpen}
                                setGlobalSettingsOpen={setGlobalSettingsOpen}
                                setBookmarksOpen={setBookmarksOpen}
                                setPromptsHubOpen={setPromptsHubOpen}
                                isSidebarOpen={isSidebarOpen}
                                setSidebarOpen={setSidebarOpen}
                                setLogPanelOpen={setLogPanelOpen}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col min-w-0">
                    <ChatWindow />
                     <AnimatePresence>
                        {isLogPanelOpen && <LogOutputPanel isOpen={isLogPanelOpen} />}
                    </AnimatePresence>
                </div>

                {isContactsHubOpen && <ContactsHub setIsOpen={setContactsHubOpen} />}
                {isMemoryCenterOpen && <MemoryCenter setIsOpen={setMemoryCenterOpen} />}
                {isDevCenterOpen && <DevCenter setIsOpen={setDevCenterOpen} />}
                {isBrainCenterOpen && <BrainCenter setIsOpen={setBrainCenterOpen} />}
                {isDashboardCenterOpen && <DashboardCenter setIsOpen={setDashboardCenterOpen} />}
                {isGlobalSettingsOpen && <GlobalSettingsModal setIsOpen={setGlobalSettingsOpen} />}
                {isBookmarksOpen && <BookmarksModal isOpen={isBookmarksOpen} setIsOpen={setBookmarksOpen} />}
                {isPromptsHubOpen && <PromptsHub setIsOpen={setPromptsHubOpen} />}
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
