import React, { useState } from 'react';
import { useGemini } from '../../useGemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const initialDocs = `
# SoulyCore Documentation

## Overview
SoulyCore is a fully client-side, responsive, and installable Progressive Web App (PWA) using React and TypeScript. 

## Features
- **Multi-Memory System:** Persists information across sessions.
- **Chat Interface:** Powered by the Gemini API.
- **Local First:** All data is stored in the user's browser using IndexedDB.
`;

const mockGitDiff = `
diff --git a/src/hooks/components/ChatInput.tsx b/src/hooks/components/ChatInput.tsx
index 123..456 100644
--- a/src/hooks/components/ChatInput.tsx
+++ b/src/hooks/components/ChatInput.tsx
@@ -1,5 +1,6 @@
 import React from 'react';
 import { SendIcon } from './Icons';
+import LoadingIndicator from './LoadingIndicator';

 // ... rest of diff
`;

const Documentation: React.FC = () => {
    const { updateDocumentation } = useGemini();
    const [docs, setDocs] = useState(initialDocs);
    const [isLoading, setIsLoading] = useState(false);
    const [updates, setUpdates] = useState('');

    const handleUpdateDocs = async () => {
        setIsLoading(true);
        setUpdates('');
        const docUpdates = await updateDocumentation(mockGitDiff);
        setUpdates(docUpdates);
        // In a real app, you would merge 'docUpdates' into 'docs'
        setIsLoading(false);
    };

    return (
        <div className="p-4 grid grid-cols-2 gap-8 h-full">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Project Documentation</h3>
                    <button onClick={handleUpdateDocs} disabled={isLoading} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50">
                        {isLoading ? "Analyzing..." : "Smart Update Docs"}
                    </button>
                </div>
                <div className="prose-custom bg-gray-800 p-4 rounded-lg max-h-[70vh] overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{docs}</ReactMarkdown>
                </div>
            </div>
             <div>
                <h3 className="text-2xl font-bold mb-4">AI-Generated Updates</h3>
                <div className="prose-custom bg-gray-800 p-4 rounded-lg max-h-[70vh] overflow-y-auto">
                    {isLoading && <p>Generating documentation updates based on simulated git diff...</p>}
                    {updates ? (
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{updates}</ReactMarkdown>
                    ) : (
                        !isLoading && <p className="text-gray-400">Click "Smart Update Docs" to simulate a git diff and have the AI generate new documentation sections.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Documentation;
