"use client";

import { useEffect } from 'react';

type ShortcutMap = { [key: string]: () => void };

export const useKeyboardShortcuts = (shortcuts: ShortcutMap) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            const modKey = event.metaKey || event.ctrlKey;

            for (const shortcut in shortcuts) {
                const parts = shortcut.split('+');
                const requiresMod = parts.includes('mod');
                const shortcutKey = parts[parts.length - 1];

                if (
                    (requiresMod && modKey && key === shortcutKey) ||
                    (!requiresMod && !modKey && key === shortcutKey)
                ) {
                    event.preventDefault();
                    shortcuts[shortcut]();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);
};
