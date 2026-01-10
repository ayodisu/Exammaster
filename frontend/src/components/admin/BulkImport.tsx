"use client";

import { Upload } from 'lucide-react';
import React from 'react';

export default function BulkImport() {
    // Stub functionality for CSV import
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('Uploading', file.name);
            // Parse CSV and call API
        }
    };

    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
                <label className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload CSV
                    </span>
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <p className="mt-1 text-xs text-gray-500">Drag and drop or click to select</p>
                </label>
            </div>
        </div>
    );
}
