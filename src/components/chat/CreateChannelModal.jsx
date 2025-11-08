import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateChannelModal({ isOpen, onClose, onCreate, currentUser, allUsers }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('public_channel');
    const [selectedMembers, setSelectedMembers] = useState([currentUser.email]);
    const [autoName, setAutoName] = useState(true); // Default to auto-naming

    const availableUsers = allUsers.filter(u => u.email !== currentUser.email);

    const handleMemberSelect = (email) => {
        setSelectedMembers(prev => 
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };
    
    const handleSubmit = () => {
        // Allow empty name only if auto-naming is enabled
        if (!autoName && !name.trim()) return;

        // Use temporary name if auto-naming is enabled
        const channelName = autoName ? `New Chat ${Date.now()}` : name;

        onCreate({
            name: channelName,
            description,
            type,
            member_emails: type === 'public_channel' ? allUsers.map(u => u.email) : selectedMembers,
            owner_email: currentUser.email,
            auto_name: autoName // Pass flag to indicate this should be auto-named
        });
        // Reset form
        setName('');
        setDescription('');
        setType('public_channel');
        setSelectedMembers([currentUser.email]);
        setAutoName(true);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Channel</DialogTitle>
                    <DialogDescription>
                        Channels are where your team communicates. They can be public (open to everyone) or private.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 mb-3">
                            <Checkbox
                                id="auto-name"
                                checked={autoName}
                                onCheckedChange={setAutoName}
                            />
                            <Label htmlFor="auto-name" className="font-normal cursor-pointer">
                                Auto-name from first message (AI-generated)
                            </Label>
                        </div>
                        <Label htmlFor="name">Channel Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={autoName ? "Will be generated automatically..." : "e.g., #marketing-updates"}
                            disabled={autoName}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this channel about?" />
                    </div>
                    <div className="space-y-2">
                        <Label>Privacy</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public_channel">Public - Anyone can join</SelectItem>
                                <SelectItem value="private_channel">Private - By invitation only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {type === 'private_channel' && (
                        <div className="space-y-2">
                            <Label>Invite Members</Label>
                            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                                {availableUsers.map(user => (
                                    <div key={user.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`user-${user.id}`}
                                            checked={selectedMembers.includes(user.email)}
                                            onCheckedChange={() => handleMemberSelect(user.email)}
                                        />
                                        <Label htmlFor={`user-${user.id}`} className="font-normal">{user.full_name} ({user.email})</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Create Channel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}