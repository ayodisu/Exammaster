import { useEffect } from 'react';
import axios from 'axios';

interface UseExamSecurityProps {
    attemptId: number | null;
    onViolation?: (type: string) => void;
}

export function useExamSecurity({ attemptId, onViolation }: UseExamSecurityProps) {
    useEffect(() => {
        if (!attemptId) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                logViolation('tab_switch', 'User switched tabs or minimized window');
                onViolation?.('tab_switch');
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            // Optional: Log right click attempts?
            // logViolation('right_click', 'User attempted to right-click');
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            logViolation('copy_paste', 'User attempted to copy content');
        };
        
        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            logViolation('copy_paste', 'User attempted to paste content');
        };

        const logViolation = async (type: string, details: string) => {
            try {
                await axios.post('http://localhost:8000/api/violations', {
                    attempt_id: attemptId,
                    type,
                    details
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            } catch (error) {
                console.error('Failed to log violation', error);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
        };
    }, [attemptId, onViolation]);
}
