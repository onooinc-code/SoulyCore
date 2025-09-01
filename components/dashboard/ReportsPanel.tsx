"use client";

import React from 'react';
import { DocumentTextIcon } from '../Icons';

const ReportsPanel = () => {
    // Placeholder data
    const reports = [
        { id: 1, title: "Weekly Usage Summary", date: "2024-07-15" },
        { id: 2, title: "Memory Growth Analysis", date: "2024-07-14" },
    ];
    return (
        <div className="space-y-3">
           {reports.map(report => (
                 <div key={report.id} className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <div>
                            <h4 className="font-semibold text-gray-200">{report.title}</h4>
                            <p className="text-xs text-gray-500">Generated: {report.date}</p>
                        </div>
                    </div>
                    <button className="px-3 py-1 bg-gray-700 text-xs rounded-md hover:bg-gray-600">View</button>
                 </div>
            ))}
             {reports.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4">No reports generated yet.</p>
            )}
        </div>
    );
};

export default ReportsPanel;
