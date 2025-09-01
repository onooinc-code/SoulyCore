"use client";

import React from 'react';
import { WarningIcon } from '../Icons';

const DecisionsPanel = () => {
    // Placeholder data
    const decisions = [
        { id: 1, title: "Resolve Memory Conflict", description: "New information about 'Project Titan' conflicts with existing data. Review needed." },
    ];

    return (
        <div className="space-y-3">
            {decisions.map(decision => (
                 <div key={decision.id} className="bg-yellow-900/30 border border-yellow-700/50 p-3 rounded-lg">
                    <div className="flex items-start gap-3">
                         <WarningIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-yellow-300">{decision.title}</h4>
                            <p className="text-xs text-yellow-400/80 mt-1">{decision.description}</p>
                        </div>
                    </div>
                     <div className="flex justify-end gap-2 mt-2">
                        <button className="px-3 py-1 bg-yellow-600 text-xs rounded-md hover:bg-yellow-500">Review</button>
                    </div>
                 </div>
            ))}
             {decisions.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4">No pending decisions.</p>
            )}
        </div>
    );
};

export default DecisionsPanel;
