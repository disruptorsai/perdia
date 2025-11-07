import React, { useState, useEffect } from 'react';
import { User } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User as UserIcon, LogOut, Shield, Edit2, Check, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setEditedName(currentUser.full_name || '');
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await User.logout();
    window.location.reload(); // Force a reload to clear state and redirect to login
  };

  const handleStartEdit = () => {
    setEditedName(user.full_name || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedName(user.full_name || '');
    setIsEditing(false);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }

    setSaving(true);
    try {
      await User.updateMyUserData({ full_name: editedName.trim() });
      setUser(prev => ({ ...prev, full_name: editedName.trim() }));
      setIsEditing(false);
      toast.success('Display name updated successfully!');
    } catch (error) {
      console.error('Error updating display name:', error);
      toast.error('Failed to update display name');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <UserIcon className="w-8 h-8 text-emerald-600" />
          My Profile
        </h1>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <div className="pt-4 border-t">
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <p>Could not load user profile. Please try logging in again.</p>
        <Button onClick={handleLogout} className="mt-4">Log In</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserIcon className="w-8 h-8 text-emerald-600" />
            My Profile
        </h1>
        
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700">Display Name</Label>
                {!isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleStartEdit}
                    className="h-8 px-3 text-slate-500 hover:text-slate-700"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter your display name"
                    className="flex-1"
                    disabled={saving}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSaveName}
                    disabled={saving || !editedName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-lg text-slate-900">{user.full_name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Email Address</Label>
              <p className="text-lg text-slate-900">{user.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Role
                </Label>
                <p className="text-lg text-slate-900 capitalize">{user.role}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    User Type
                </Label>
                <p className="text-lg text-slate-900 capitalize">{user.user_type}</p>
              </div>
            </div>

            <div className="pt-6 border-t">
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}