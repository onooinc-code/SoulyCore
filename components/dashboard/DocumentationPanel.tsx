"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Documentation } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import DocumentationViewerModal from '../DocumentationViewerModal';
import { DocumentTextIcon } from '../Icons';

const DocumentationPanel = () => {
    const [docs, setDocs] = useState<Documentation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDocKey, setSelectedDocKey] = useState<string | null>(null);
    const { log } = useLog();

    const fetchDocs = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/documentation');
            if (!res.ok) throw new Error("Failed to fetch documentation list.");
            const data = await res.json();
            setDocs(data);
        } catch (error) {
            log('Failed to fetch docs list', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const handleSelectDoc = (docKey: string) => {
        setSelectedDocKey(docKey);
    };
    
    const handleCloseModal = () => {
        setSelectedDocKey(null);
    }

    if (isLoading) {
        return <p className="text-sm text-gray-400">Loading documentation...</p>;
    }

    return (
        <>
            <div className="space-y-2">
                {docs.map(doc => (
                    <button 
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc.doc_key)}
                        className="w-full text-left flex items-center gap-3 p-2 bg-gray-900/50 rounded-md hover:bg-gray-900"
                    >
                        <DocumentTextIcon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-200 truncate">{doc.title}</span>
                    </button>
                ))}
            </div>
            {selectedDocKey && (
                <DocumentationViewerModal 
                    docKey={selectedDocKey}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default DocumentationPanel;
