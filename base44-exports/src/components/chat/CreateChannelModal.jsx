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
    
    const availableUsers = allUsers.filter(u => u.email !== currentUser.email);

    const handleMemberSelect = (email) => {
        setSelectedMembers(prev => 
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };
    
    const handleSubmit = () => {
        if (!name.trim()) return;
        onCreate({
            name,
            description,
            type,
            member_emails: type === 'public_channel' ? allUsers.map(u => u.email) : selectedMembers,
            owner_email: currentUser.email
        });
        // Reset form
        setName('');
        setDescription('');
        setType('public_channel');
        setSelectedMembers([currentUser.email]);
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
                        <Label htmlFor="name">Channel Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., #marketing-updates" />
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