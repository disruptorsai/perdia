import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WordPressConnection, Shortcode } from "@/lib/perdia-sdk";
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
import { toast } from "sonner";

export default function Integrations() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [testingConnection, setTestingConnection] = useState(null);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['wordpress_connections'],
    queryFn: async () => {
      const result = await WordPressConnection.find({}, {
        orderBy: { column: 'created_date', ascending: false },
        limit: 50
      });
      return result;
    },
  });

  const { data: shortcodes = [] } = useQuery({
    queryKey: ['shortcodes'],
    queryFn: async () => {
      const result = await Shortcode.find({}, {
        orderBy: { column: 'name', ascending: true },
        limit: 100
      });
      return result;
    },
  });

  const createConnectionMutation = useMutation({
    mutationFn: (data) => WordPressConnection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_connections'] });
      setShowAddDialog(false);
      toast.success('WordPress connection added');
    },
    onError: () => {
      toast.error('Failed to add connection');
    }
  });

  const updateConnectionMutation = useMutation({
    mutationFn: ({ id, data }) => WordPressConnection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_connections'] });
      toast.success('Connection updated');
    },
    onError: () => {
      toast.error('Failed to update connection');
    }
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: (id) => WordPressConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_connections'] });
      toast.success('Connection deleted');
    },
    onError: () => {
      toast.error('Failed to delete connection');
    }
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

  const handleDeleteConnection = (connection) => {
    if (confirm(`Delete connection to ${connection.site_name}?`)) {
      deleteConnectionMutation.mutate(connection.id);
    }
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
                <Button type="submit" className="w-full" disabled={createConnectionMutation.isPending}>
                  {createConnectionMutation.isPending ? 'Adding...' : 'Add Connection'}
                </Button>
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
            <Card className="p-12 text-center border-none shadow-lg bg-white">
              <LinkIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No WordPress Connections</h3>
              <p className="text-gray-500 mb-4">Add a WordPress site to start publishing</p>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Site
              </Button>
            </Card>
          ) : (
            connections.map((connection, index) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-xl text-gray-900">{connection.site_name}</h3>
                          <Badge
                            variant="outline"
                            className={
                              connection.connection_status === 'connected'
                                ? 'bg-green-50 text-green-700 border-green-300'
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
                              Dry Run
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
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">
                            Auth: {connection.auth_type?.replace(/_/g, ' ')}
                          </span>
                          <span>•</span>
                          <span>{connection.total_published || 0} articles published</span>
                          {connection.last_test && (
                            <>
                              <span>•</span>
                              <span>Last tested: {format(new Date(connection.last_test), 'MMM d, h:mm a')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          onClick={() => handleTestConnection(connection.id)}
                          disabled={testingConnection === connection.id}
                          className="gap-2"
                        >
                          {testingConnection === connection.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Test
                            </>
                          )}
                        </Button>
                        <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-600">Dry Run</span>
                          <Switch
                            checked={connection.dry_run_mode}
                            onCheckedChange={() => handleToggleDryRun(connection)}
                            disabled={updateConnectionMutation.isPending}
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteConnection(connection)}
                          className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          disabled={deleteConnectionMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
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
          <h2 className="text-xl font-bold text-gray-900">GetEducated Shortcodes</h2>
          <Card className="border-none shadow-lg bg-white">
            <CardContent className="p-6">
              {shortcodes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No shortcodes configured yet
                </p>
              ) : (
                <div className="space-y-3">
                  {shortcodes.map((shortcode) => (
                    <div
                      key={shortcode.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{shortcode.name}</h4>
                            <Badge variant="outline" className="text-xs capitalize bg-gray-50 text-gray-700 border-gray-200">
                              {shortcode.category}
                            </Badge>
                            {!shortcode.is_active && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded text-blue-600 block mb-2">
                            {shortcode.syntax}
                          </code>
                          {shortcode.description && (
                            <p className="text-xs text-gray-600 mb-2">{shortcode.description}</p>
                          )}
                          {shortcode.example && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs text-blue-900">
                                <strong>Example:</strong> {shortcode.example}
                              </p>
                            </div>
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

        {/* Info Card */}
        <Card className="border-none shadow-lg bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Dry Run Mode</h4>
                <p className="text-sm text-blue-800 mb-2">
                  When enabled, articles will be prepared but not actually published to WordPress.
                  Use this for testing before enabling live publishing.
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Tip:</strong> Test your connection first, then disable dry run mode when ready to publish.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
