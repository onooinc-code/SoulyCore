"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { HedraGoal } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const HedraGoalsPanel = () => {
    const [goals, setGoals] = useState<Record<string, HedraGoal> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState<Record<string, { content: string }>>({});
    const { log } = useLog();

    const fetchGoals = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/hedra-goals');
            if (!res.ok) throw new Error("Failed to fetch Hedra goals.");
            const data = await res.json();
            setGoals(data);
            setEditedContent({
                main_goal: { content: data.main_goal?.content || '' },
                ideas: { content: data.ideas?.content || '' },
                status: { content: data.status?.content || '' },
            });
        } catch (error) {
            log('Failed to fetch Hedra goals', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const handleSave = async () => {
        log('Saving Hedra goals...');
        setIsLoading(true);
        try {
            const res = await fetch('/api/hedra-goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedContent),
            });
            if (!res.ok) throw new Error("Failed to save goals.");
            await fetchGoals(); // Refresh data
            setIsEditing(false);
            log('Hedra goals saved successfully.');
        } catch (error) {
            log('Failed to save Hedra goals', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleContentChange = (section: 'main_goal' | 'ideas' | 'status', content: string) => {
        setEditedContent(prev => ({ ...prev, [section]: { content } }));
    };

    if (isLoading && !goals) {
        return <div className="text-center text-gray-400">Loading goals...</div>;
    }

    if (!goals) {
        return <div className="text-center text-red-400">Could not load strategic goals.</div>;
    }

    const sections: Array<{ key: 'main_goal' | 'ideas' | 'status'; title: string; style: string }> = [
        { key: 'main_goal', title: 'Main Goal & Methods', style: 'bg-blue-900/30 border-blue-500/50' },
        { key: 'ideas', title: 'Suggestions & Ideas', style: 'bg-yellow-900/30 border-yellow-500/50' },
        { key: 'status', title: 'Specs & Building Status', style: 'bg-green-900/30 border-green-500/50' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                {isEditing ? (
                    <>
                        <button onClick={() => { setIsEditing(false); fetchGoals(); }} className="px-3 py-1 bg-gray-600 text-xs rounded-md hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-xs rounded-md hover:bg-green-500">Save Changes</button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-indigo-600 text-xs rounded-md hover:bg-indigo-500">Edit</button>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {sections.map(({ key, title, style }) => (
                    <div key={key} className={`p-4 rounded-lg border ${style} h-96 flex flex-col`}>
                        {isEditing ? (
                            <textarea
                                value={editedContent[key]?.content || ''}
                                onChange={(e) => handleContentChange(key, e.target.value)}
                                className="w-full flex-1 p-2 bg-gray-800 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                            />
                        ) : (
                            <div className="prose-custom prose-sm max-w-none flex-1 overflow-y-auto">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {goals[key]?.content || `*No content for ${title} yet.*`}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HedraGoalsPanel;