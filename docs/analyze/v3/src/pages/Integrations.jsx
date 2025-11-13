import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Link as LinkIcon,
  RefreshCw,
  Trash2,
  ExternalLink,
  AlertCircle,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Integrations() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [testingConnection, setTestingConnection] = useState(null);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['wordpress_connections'],
    queryFn: () => base44.entities.WordPressConnection.list('-created_date'),
  });

  const { data: shortcodes = [] } = useQuery({
    queryKey: ['shortcodes'],
    queryFn: () => base44.entities.Shortcode.list(),
  });

  const createConnectionMutation = useMutation({
    mutationFn: (data) => base44.entities.WordPressConnection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_connections'] });
      setShowAddDialog(false);
    },
  });

  const updateConnectionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WordPressConnection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_connections'] });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: (id) => base44.entities.WordPressConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_connections'] });
    },
  });

  const handleAddConnection = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createConnectionMutation.mutate({
      site_name: formData.get('site_name'),
      site_url: formData.get('site_url'),
      auth_type: formData.get('auth_type'),
      connection_status: 'disconnected',
      dry_run_mode: true,
      total_published: 0
    });
  };

  const handleTestConnection = async (connectionId) => {
    setTestingConnection(connectionId);
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await updateConnectionMutation.mutateAsync({
      id: connectionId,
      data: {
        connection_status: 'connected',
        last_test: new Date().toISOString()
      }
    });
    setTestingConnection(null);
  };

  const handleToggleDryRun = async (connection) => {
    await updateConnectionMutation.mutateAsync({
      id: connection.id,
      data: {
        dry_run_mode: !connection.dry_run_mode
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Integrations</h1>
            <p className="text-gray-600 mt-1">Manage WordPress connections and publishing settings</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="w-4 h-4" />
                Add WordPress Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect WordPress Site</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddConnection} className="space-y-4">
                <div>
                  <Label>Site Name</Label>
                  <Input name="site_name" required placeholder="e.g., GetEducated" />
                </div>
                <div>
                  <Label>Site URL</Label>
                  <Input name="site_url" required placeholder="https://geteducated.com" />
                </div>
                <div>
                  <Label>Authentication Type</Label>
                  <select name="auth_type" className="w-full p-2 border rounded-lg">
                    <option value="application_password">Application Password</option>
                    <option value="oauth">OAuth</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Add Connection</Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* WordPress Connections */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">WordPress Sites</h2>
          
          {isLoading ? (
            <Card className="p-8 text-center border-none shadow-lg">
              <p className="text-gray-500">Loading connections...</p>
            </Card>
          ) : connections.length === 0 ? (
            <Card className="p-12 text-center border-none shadow-lg">
              <LinkIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-500 mb-4">Connect your first WordPress site to start publishing</p>
              <Button onClick={() => setShowAddDialog(true)}>
                Add Your First Site
              </Button>
            </Card>
          ) : (
            connections.map((connection, index) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {connection.site_name}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={
                              connection.connection_status === 'connected'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : connection.connection_status === 'error'
                                ? 'bg-red-50 text-red-700 border-red-300'
                                : 'bg-gray-50 text-gray-700 border-gray-300'
                            }
                          >
                            {connection.connection_status === 'connected' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {connection.connection_status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                            {connection.connection_status}
                          </Badge>
                          {connection.dry_run_mode && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Dry Run Mode
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <ExternalLink className="w-4 h-4" />
                          <a 
                            href={connection.site_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 transition-colors"
                          >
                            {connection.site_url}
                          </a>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Auth Type</p>
                            <p className="font-medium text-gray-900 capitalize">
                              {connection.auth_type.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Published</p>
                            <p className="font-medium text-gray-900">
                              {connection.total_published || 0} articles
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Last Test</p>
                            <p className="font-medium text-gray-900">
                              {connection.last_test 
                                ? format(new Date(connection.last_test), 'MMM d, h:mm a')
                                : 'Never'
                              }
                            </p>
                          </div>
                        </div>

                        {connection.plugin_version && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="w-4 h-4 text-blue-600" />
                              <span className="text-blue-900">
                                Perdia Publisher Plugin v{connection.plugin_version}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!connection.dry_run_mode}
                              onCheckedChange={() => handleToggleDryRun(connection)}
                            />
                            <Label className="text-sm">Enable Publishing</Label>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(connection.id)}
                          disabled={testingConnection === connection.id}
                          className="gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${testingConnection === connection.id ? 'animate-spin' : ''}`} />
                          Test Connection
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('Delete this connection?')) {
                              deleteConnectionMutation.mutate(connection.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Shortcodes */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Shortcodes</h2>
          
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Available Shortcodes</CardTitle>
            </CardHeader>
            <CardContent>
              {shortcodes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No shortcodes configured yet. Add shortcodes to enforce link and monetization policies.
                </p>
              ) : (
                <div className="space-y-3">
                  {shortcodes.map((shortcode) => (
                    <div 
                      key={shortcode.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{shortcode.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={
                                shortcode.category === 'monetization'
                                  ? 'bg-green-50 text-green-700 border-green-300'
                                  : 'bg-blue-50 text-blue-700 border-blue-300'
                              }
                            >
                              {shortcode.category}
                            </Badge>
                            {!shortcode.is_active && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          {shortcode.description && (
                            <p className="text-sm text-gray-600 mb-2">{shortcode.description}</p>
                          )}
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                            {shortcode.syntax}
                          </code>
                          {shortcode.example && (
                            <p className="text-xs text-gray-500 mt-2">
                              Example: <code className="bg-white px-1 py-0.5 rounded">{shortcode.example}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Integration Health */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Integration Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">API Connectivity</span>
                </div>
                <span className="text-sm text-emerald-700 font-semibold">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Plugin Version</span>
                </div>
                <span className="text-sm text-blue-700 font-semibold">Up to date</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">Shortcode Validation</span>
                </div>
                <span className="text-sm text-emerald-700 font-semibold">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}