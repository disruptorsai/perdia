import React, { useState, useEffect } from 'react';
import { WordPressConnection } from '@/api/entities';
import { WordPressClient } from '@/lib/wordpress-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle, XCircle, Loader2, ExternalLink, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';

export default function WordPressConnectionPage() {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [wpUserInfo, setWpUserInfo] = useState(null);

  const [formData, setFormData] = useState({
    site_url: '',
    username: '',
    application_password: '',
    auto_publish_enabled: false,
    default_category_id: '',
    default_author_id: ''
  });

  useEffect(() => {
    loadConnection();
  }, []);

  const loadConnection = async () => {
    setLoading(true);
    try {
      const connections = await WordPressConnection.list('-created_date', 1);
      if (connections.length > 0) {
        setConnection(connections[0]);
        setFormData({
          site_url: connections[0].site_url || '',
          username: connections[0].username || '',
          application_password: connections[0].application_password || '',
          auto_publish_enabled: connections[0].auto_publish_enabled || false,
          default_category_id: connections[0].default_category_id || '',
          default_author_id: connections[0].default_author_id || ''
        });
      }
    } catch (error) {
      console.error("Error loading connection:", error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!formData.site_url || !formData.username || !formData.application_password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setTesting(true);
    setWpUserInfo(null);

    try {
      toast.loading('Testing WordPress connection...', { id: 'test-connection' });

      // Create WordPress client
      const wp = new WordPressClient(
        formData.site_url,
        formData.username,
        formData.application_password
      );

      // Test connection
      const result = await wp.testConnection();

      if (result.success) {
        // Store WordPress user info
        setWpUserInfo(result.user);

        toast.success('Connection successful!', {
          id: 'test-connection',
          description: `Connected as ${result.user.name} (${result.user.email})`
        });

        // Construct API URL
        const siteUrl = formData.site_url.replace(/\/$/, '');
        const apiUrl = `${siteUrl}/wp-json/wp/v2`;

        // Save/update connection with verified status
        if (connection) {
          await WordPressConnection.update(connection.id, {
            ...formData,
            api_url: apiUrl,
            connection_status: 'connected',
            last_sync_date: new Date().toISOString()
          });
        } else {
          const newConnection = await WordPressConnection.create({
            ...formData,
            api_url: apiUrl,
            connection_status: 'connected',
            last_sync_date: new Date().toISOString()
          });
          setConnection(newConnection);
        }

        loadConnection();
      }
    } catch (error) {
      console.error("Connection test failed:", error);

      // Extract meaningful error message
      let errorMessage = 'Could not reach WordPress site. Check URL and credentials.';

      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Invalid username or application password. Please check your credentials.';
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        errorMessage = 'WordPress REST API not found. Make sure the site URL is correct and REST API is enabled.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Cross-origin request blocked. The WordPress site may need to allow requests from this domain.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Check the site URL and your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error('Connection failed', {
        id: 'test-connection',
        description: errorMessage
      });

      // Update connection status to error
      if (connection) {
        await WordPressConnection.update(connection.id, {
          connection_status: 'error'
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (connection) {
        await WordPressConnection.update(connection.id, formData);
        toast.success('Settings saved successfully');
      } else {
        const apiUrl = `${formData.site_url.replace(/\/$/, '')}/wp-json/wp/v2`;
        const newConnection = await WordPressConnection.create({
          ...formData,
          api_url: apiUrl,
          connection_status: 'disconnected'
        });
        setConnection(newConnection);
        toast.success('Configuration saved! Click "Test Connection" to verify.');
      }
      loadConnection();
    } catch (error) {
      console.error("Error saving connection:", error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const isConnected = connection?.connection_status === 'connected';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-600" />
          WordPress Connection
        </h1>
        <p className="text-slate-600 mt-1">Connect to your WordPress site to publish content directly</p>
      </div>

      {isConnected ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Connected!</strong> Your WordPress site is connected and ready to receive content.
            {connection.last_sync_date && (
              <span className="block text-sm mt-1">
                Last synced: {new Date(connection.last_sync_date).toLocaleString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : connection?.connection_status === 'error' ? (
        <Alert className="bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Connection Error</strong> - Please check your credentials and try again.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Configure your WordPress connection below to enable direct publishing.
          </AlertDescription>
        </Alert>
      )}

      {wpUserInfo && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <User className="w-5 h-5" />
              WordPress User Information
            </CardTitle>
            <CardDescription className="text-green-700">
              Successfully authenticated with WordPress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-green-700">Display Name</Label>
                <p className="font-medium text-green-900">{wpUserInfo.name}</p>
              </div>
              <div>
                <Label className="text-xs text-green-700">Email</Label>
                <p className="font-medium text-green-900">{wpUserInfo.email}</p>
              </div>
              <div>
                <Label className="text-xs text-green-700">Username</Label>
                <p className="font-medium text-green-900">{wpUserInfo.slug}</p>
              </div>
              <div>
                <Label className="text-xs text-green-700">User ID</Label>
                <p className="font-medium text-green-900">{wpUserInfo.id}</p>
              </div>
            </div>
            {wpUserInfo.roles && wpUserInfo.roles.length > 0 && (
              <div>
                <Label className="text-xs text-green-700 mb-2 block">Roles & Capabilities</Label>
                <div className="flex flex-wrap gap-2">
                  {wpUserInfo.roles.map((role) => (
                    <Badge key={role} variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {wpUserInfo.description && (
              <div>
                <Label className="text-xs text-green-700">Description</Label>
                <p className="text-sm text-green-800">{wpUserInfo.description}</p>
              </div>
            )}
            {wpUserInfo.url && (
              <div>
                <Label className="text-xs text-green-700">Website</Label>
                <a
                  href={wpUserInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:underline inline-flex items-center gap-1"
                >
                  {wpUserInfo.url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>WordPress Site Configuration</CardTitle>
          <CardDescription>
            Enter your WordPress site details. You'll need to create an Application Password in WordPress.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site_url">WordPress Site URL *</Label>
            <Input
              id="site_url"
              placeholder="https://geteducated.com"
              value={formData.site_url}
              onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
            />
            <p className="text-xs text-slate-500">Full URL of your WordPress site (e.g., https://geteducated.com)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">WordPress Username *</Label>
            <Input
              id="username"
              placeholder="admin"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app_password">Application Password *</Label>
            <Input
              id="app_password"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={formData.application_password}
              onChange={(e) => setFormData({ ...formData, application_password: e.target.value })}
            />
            <p className="text-xs text-slate-500">
              Create an Application Password in WordPress under Users → Profile → Application Passwords
              <a 
                href="https://wordpress.org/support/article/application-passwords/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:underline inline-flex items-center"
              >
                Learn how <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="category_id">Default Category ID (Optional)</Label>
              <Input
                id="category_id"
                placeholder="1"
                value={formData.default_category_id}
                onChange={(e) => setFormData({ ...formData, default_category_id: e.target.value })}
              />
              <p className="text-xs text-slate-500">WordPress category ID for new posts</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author_id">Default Author ID (Optional)</Label>
              <Input
                id="author_id"
                placeholder="1"
                value={formData.default_author_id}
                onChange={(e) => setFormData({ ...formData, default_author_id: e.target.value })}
              />
              <p className="text-xs text-slate-500">WordPress author ID for new posts</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1">
              <Label htmlFor="auto_publish">Auto-Publish Approved Content</Label>
              <p className="text-xs text-slate-500">Automatically publish content after approval</p>
            </div>
            <Switch
              id="auto_publish"
              checked={formData.auto_publish_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_publish_enabled: checked })}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Configuration
            </Button>
            <Button 
              onClick={testConnection} 
              disabled={testing || !formData.site_url || !formData.username || !formData.application_password}
              variant="outline"
              className="flex-1"
            >
              {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">How to Create an Application Password in WordPress</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2">
          <ol className="list-decimal list-inside space-y-2">
            <li>Log in to your WordPress admin dashboard</li>
            <li>Go to <strong>Users → Profile</strong></li>
            <li>Scroll down to the <strong>Application Passwords</strong> section</li>
            <li>Enter a name (e.g., "Perdia Content Engine")</li>
            <li>Click <strong>Add New Application Password</strong></li>
            <li>Copy the generated password and paste it above</li>
          </ol>
          <p className="text-xs text-slate-500 pt-2">
            Note: Application Passwords require WordPress 5.6+ and HTTPS
          </p>
        </CardContent>
      </Card>
    </div>
  );
}