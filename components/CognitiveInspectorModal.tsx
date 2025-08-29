"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';

interface CognitiveInspectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    messageId: string | null;
}

const CognitiveInspectorModal = ({ isOpen, onClose, messageId }: CognitiveInspectorModalProps) => {
    const [inspectionData, setInspectionData] = useState<{ preLlmContext: string; postLlmExtraction: any } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && messageId) {
            const fetchInspectionData = async () => {
                setIsLoading(true);
                setError(null);
                setInspectionData(null);
                try {
                    const res = await fetch(`/api/inspect/${messageId}`);
                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(data.error || 'Failed to fetch inspection data.');
                    }
                    setInspectionData(data);
                } catch (e) {
                    setError((e as Error).message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInspectionData();
        }
    }, [isOpen, messageId]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                            <h2 className="text-xl font-bold">Cognitive Inspector</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                            {isLoading && <p className="text-gray-400 md:col-span-2 text-center">Loading inspection data...</p>}
                            {error && <p className="text-red-400 md:col-span-2 text-center">Error: {error}</p>}
                            {inspectionData && (
                                <>
                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-lg mb-2 text-indigo-400">1. Context Sent to LLM</h3>
                                        <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-900 p-3 rounded-md overflow-auto">
                                            <code>{inspectionData.preLlmContext}</code>
                                        </pre>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-lg mb-2 text-green-400">2. Data Extracted from Turn</h3>
                                        <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-900 p-3 rounded-md overflow-auto">
                                            <code>{JSON.stringify(inspectionData.postLlmExtraction, null, 2)}</code>
                                        </pre>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CognitiveInspectorModal;