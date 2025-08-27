"use client";

import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from './providers/AppProvider';
import type { AppSettings } from '@/lib/types';

interface GlobalSettingsModalProps {
    setIsOpen: (isOpen: boolean) => void;
}

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ setIsOpen }) => {
    const { settings, loadSettings, setStatus, clearError } = useAppContext();
    const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        if (settings) {
            setLocalSettings(JSON.parse(JSON.stringify(settings))); // Deep copy
        }
    }, [settings]);

    const handleSave = async () => {
        if (!localSettings) return;
        clearError();
        setStatus({ currentAction: "Saving settings..." });
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localSettings),
            });
            if (!res.ok) throw new Error('Failed to save settings');
            await loadSettings(); // Reload settings into context
            setIsOpen(false);
        } catch (error) {
            setStatus({ error: (error as Error).message });
            console.error(error);
        } finally {
            setStatus({ currentAction: "" });
        }
    };

    if (!localSettings) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Global Settings</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                </div>
                
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Default Model Config */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Default Model Config</h3>
                        <p className="text-sm text-gray-400 mb-4">Settings applied to all new conversations.</p>
                        <div className="space-y-4">
                            <input type="text" value={localSettings.defaultModelConfig.model} onChange={e => setLocalSettings(s => ({...s!, defaultModelConfig: {...s!.defaultModelConfig, model: e.target.value}}))} placeholder="Model Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                            <div>
                                <label className="block text-sm text-gray-400">Temperature: {localSettings.defaultModelConfig.temperature.toFixed(2)}</label>
                                <input type="range" min="0" max="1" step="0.01" value={localSettings.defaultModelConfig.temperature} onChange={e => setLocalSettings(s => ({...s!, defaultModelConfig: {...s!.defaultModelConfig, temperature: parseFloat(e.target.value)}}))} className="w-full" />
                            </div>
                             <div>
                                <label className="block text-sm text-gray-400">Top P: {localSettings.defaultModelConfig.topP.toFixed(2)}</label>
                                <input type="range" min="0" max="1" step="0.01" value={localSettings.defaultModelConfig.topP} onChange={e => setLocalSettings(s => ({...s!, defaultModelConfig: {...s!.defaultModelConfig, topP: parseFloat(e.target.value)}}))} className="w-full" />
                            </div>
                        </div>
                    </div>

                    {/* Default Agent Config */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                         <h3 className="font-semibold text-lg mb-2">Default Agent Config</h3>
                        <textarea value={localSettings.defaultAgentConfig.systemPrompt} onChange={e => setLocalSettings(s => ({...s!, defaultAgentConfig: {...s!.defaultAgentConfig, systemPrompt: e.target.value}}))} placeholder="System Prompt" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                    </div>

                     {/* Log Output Setting */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <label className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={localSettings.enableDebugLog.enabled} onChange={e => setLocalSettings(s => ({...s!, enableDebugLog: { enabled: e.target.checked }}))} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                            <span>Enable Developer Log Output Panel</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-6 mt-4 border-t border-gray-700">
                    <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-sm">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-sm">Save Settings</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default GlobalSettingsModal;