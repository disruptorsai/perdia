import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function ChatInput({ onSend }) {
    const [content, setContent] = useState('');

    const handleSend = () => {
        if (content.trim()) {
            onSend(content);
            setContent('');
        }
    };

    return (
        <div className="flex gap-2">
            <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
            />
            <Button onClick={handleSend} disabled={!content.trim()}>
                <Send className="w-4 h-4" />
            </Button>
        </div>
    );
}