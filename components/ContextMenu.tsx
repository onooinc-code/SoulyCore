"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SVGProps } from 'react';

// Define a generic IconType
export type IconType = React.FC<SVGProps<SVGSVGElement>>;

export type MenuItem = {
    isSeparator: true;
    label?: never;
    action?: never;
    icon?: never;
    disabled?: never;
} | {
    label: string;
    action?: () => void;
    icon?: IconType;
    disabled?: boolean;
    isSeparator?: false | undefined;
};

interface ContextMenuProps {
    items: MenuItem[];
    position: { x: number; y: number };
    isOpen: boolean;
    onClose: () => void;
}

const ContextMenu = ({ items, position, isOpen, onClose }: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const getPositionStyles = () => {
        const styles: React.CSSProperties = {};
        if (typeof window !== 'undefined') {
            const menuWidth = 240; // approx width
            const menuHeight = items.length * 36; // approx height
            styles.left = position.x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : position.x;
            styles.top = position.y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : position.y;
        } else {
            styles.left = position.x;
            styles.top = position.y;
        }
        return styles;
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    style={getPositionStyles()}
                    className="fixed w-60 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-[100] p-1.5"
                >
                    {items.map((item, index) => {
                        if (item.isSeparator) {
                            return <div key={`sep-${index}`} className="h-px bg-gray-700 my-1.5" />;
                        }

                        const Icon = item.icon;
                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    if (item.action) item.action();
                                    onClose();
                                }}
                                disabled={item.disabled}
                                className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent"
                            >
                                {Icon && <Icon className="w-4 h-4" />}
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContextMenu;
