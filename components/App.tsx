
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
import TopBar from './TopBar'; // New Top Bar
import NotificationPanel from './NotificationPanel'; // New Notification Panel
import AgentMessagesPanel, { AgentMessage } from './AgentMessagesPanel'; // New Agent Messages Panel

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

