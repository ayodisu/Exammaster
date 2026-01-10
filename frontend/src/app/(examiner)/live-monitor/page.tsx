"use client";

export default function LiveMonitor() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Live Monitor</h1>
            <p className="text-gray-500">Connecting to WebSocket...</p>
            {/* TODO: Implement Reverb/Echo listener here */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded bg-white shadow">
                    <div className="flex justify-between">
                        <span className="font-bold">Student: John Doe</span>
                        <span className="text-green-500 text-sm">Active</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">Progress: 15/50</div>
                </div>
                {/* More cards... */}
            </div>
        </div>
    );
}
