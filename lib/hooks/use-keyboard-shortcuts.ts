"use client";

import { useEffect } from 'react';

type ShortcutMap = { [key: string]: () => void };

export const useKeyboardShortcuts = (shortcuts: ShortcutMap) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Normalize key for comparison (e.g., 'meta' for Cmd on Mac, 'ctrl' for Ctrl on Win)
            const isModKey = event.metaKey || event.ctrlKey;
            const key = event.key.toLowerCase();
            
            for (const shortcut in shortcuts) {
                const parts = shortcut.toLowerCase().split('+');
                const requiresMod = parts.includes('mod');
                const shortcutKey = parts[parts.length - 1];

                if (
                    (requiresMod && isModKey && key === shortcutKey) ||
                    (!requiresMod && !isModKey && key === shortcutKey)
                ) {
                    event.preventDefault();
                    shortcuts[shortcut]();
                    break; 
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);
};