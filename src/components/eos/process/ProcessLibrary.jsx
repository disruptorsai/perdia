
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EOSProcess } from '@/api/entities';
import { Plus, Search, FileText, Edit, Trash2, Workflow, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProcessForm from './ProcessForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProcessLibrary({ client }) {
  const [processes, setProcesses] = useState([]);
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isSnapshotVisible, setSnapshotVisible] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (client) {
      loadProcesses();
    }
  }, [client]);

  useEffect(() => {
    filterProcesses();
  }, [processes, searchTerm, filterCategory]);

  const loadProcesses = async () => {
    try {
      const processData = await EOSProcess.filter({ client_id: client.id }, 'process_name');
      setProcesses(processData);
    } catch (error) {
      console.error('Error loading processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProcesses = () => {
    let filtered = processes;

    if (searchTerm) {
      filtered = filtered.filter(process =>
        process.process_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.process_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(process => process.category === filterCategory);
    }

    setFilteredProcesses(filtered);
  };

  const handleSaveProcess = async (processData) => {
    try {
      if (editingProcess) {
        await EOSProcess.update(editingProcess.id, processData);
      } else {
        await EOSProcess.create({ ...processData, client_id: client.id });
      }
      setShowForm(false);
      setEditingProcess(null);
      loadProcesses();
    } catch (error) {
      console.error('Error saving process:', error);
    }
  };

  const handleEditProcess = (e, process) => {
    e.stopPropagation();
    setEditingProcess(process);
    setShowForm(true);
  };

  const handleDeleteProcess = async (e, processId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this process?')) {
      try {
        await EOSProcess.delete(processId);
        loadProcesses();
      } catch (error) {
        console.error('Error deleting process:', error);
      }
    }
  };

  const handleEditFlowchart = (e, processId) => {
    e.stopPropagation();
    navigate(createPageUrl(`FlowchartEditor?processId=${processId}`));
  };

  const handleViewSnapshot = (process) => {
    if (process.flowchart_snapshot) {
      setSnapshotUrl(process.flowchart_snapshot);
      setSnapshotVisible(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Process Library</h3>
          <p className="text-slate-600 mt-1">Document and manage your business processes</p>
        </div>
        <Button
          onClick={() => {
            setEditingProcess(null);
            setShowForm(true);
          }}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Process
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Core">Core</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process List */}
      {filteredProcesses.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {processes.length === 0 ? "No Processes Yet" : "No Matching Processes"}
            </h3>
            <p className="text-slate-500 mb-6">
              {processes.length === 0 
                ? "Start building your process library by documenting your first business process."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {processes.length === 0 && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Process
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProcesses.map(process => (
            <Card
              key={process.id}
              className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow ${process.flowchart_snapshot ? 'cursor-pointer' : ''}`}
              onClick={() => handleViewSnapshot(process)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <CardTitle className="text-lg mb-2">{process.process_name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="w-fit bg-slate-100 text-slate-700">
                        {process.category || 'General'}
                      </Badge>
                      {process.flowchart_snapshot && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEditProcess(e, process)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteProcess(e, process.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {process.process_description && (
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {process.process_description}
                    </p>
                  )}
                  
                  <div className="text-sm text-slate-600">
                    <div className="font-medium">Owner:</div>
                    <div>{process.owner_name || process.owner_email}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                     <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => handleEditFlowchart(e, process.id)}
                     >
                        <Workflow className="w-4 h-4 mr-2" />
                        Edit Flowchart
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <ProcessForm
          process={editingProcess}
          client={client}
          onSave={handleSaveProcess}
          onCancel={() => {
            setShowForm(false);
            setEditingProcess(null);
          }}
        />
      )}

      {isSnapshotVisible && (
        <Dialog open={isSnapshotVisible} onOpenChange={setSnapshotVisible}>
          <DialogContent className="max-w-4xl w-full">
            <DialogHeader>
              <DialogTitle>Flowchart Snapshot</DialogTitle>
            </DialogHeader>
            <div className="mt-4 bg-slate-100 p-2 sm:p-4 rounded-lg overflow-auto">
              {snapshotUrl ? (
                <img src={snapshotUrl} alt="Flowchart Snapshot" className="w-full h-auto rounded-md" />
              ) : (
                <p>No snapshot available.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
