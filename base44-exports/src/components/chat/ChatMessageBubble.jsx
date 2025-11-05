import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
};

export default function ChatMessageBubble({ message, currentUser }) {
    const isCurrentUser = message.sender_email === currentUser.email;

    // Memoize the formatted time so it doesn't change on re-renders
    const formattedTime = useMemo(() => {
        try {
            // Append 'Z' to the created_date string to explicitly mark it as UTC.
            // This forces JavaScript's Date constructor to interpret it as UTC.
            const utcDateString = message.created_date.endsWith('Z') ? message.created_date : `${message.created_date}Z`;
            const messageDate = new Date(utcDateString);
            
            // Ensure the date is valid
            if (isNaN(messageDate.getTime())) {
                return 'Invalid time';
            }
            
            // Format will automatically convert this correctly interpreted UTC Date object
            // to the user's local timezone for display.
            return format(messageDate, 'h:mm a');
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Invalid time';
        }
    }, [message.created_date]); // Only recalculate if the actual timestamp changes

    return (
        <div className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
            {!isCurrentUser && (
                <Avatar className="w-8 h-8">
                    <AvatarImage src={message.sender_profile_picture_url} />
                    <AvatarFallback>{getInitials(message.sender_name)}</AvatarFallback>
                </Avatar>
            )}
            <div className={`max-w-md p-3 rounded-xl ${isCurrentUser ? 'pcc-bg-blue text-white rounded-br-none' : 'bg-slate-100 rounded-bl-none'}`}>
                {!isCurrentUser && (
                    <p className="font-bold text-sm mb-1">{message.sender_name}</p>
                )}
                <p className="text-base whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-2 ${isCurrentUser ? 'text-blue-200' : 'text-slate-500'}`}>
                    {formattedTime}
                </p>
            </div>
        </div>
    );
}