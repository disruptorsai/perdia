/**
 * PERDIA V2: PIPELINE CONFIGURATION UI
 * =====================================
 *
 * Manage modular AI content generation pipelines
 * Enables A/B testing of different content generation strategies
 *
 * Features:
 * - View/edit pipeline configurations
 * - Toggle pipeline stages on/off
 * - Create new pipeline configs
 * - Set active/default pipeline
 * - View pipeline performance metrics
 *
 * Created: 2025-11-12
 */

import React, { useState, useEffect } from 'react';
import { PipelineConfiguration as PipelineConfigurationEntity } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Workflow,
  Plus,
  Edit,
  Copy,
  CheckCircle,
  Loader2,
  Settings,
  TrendingUp,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DEFAULT_STAGES = [
  {
    name: 'topic_selection',
    displayName: 'Topic Selection',
    description: 'Select topic question from pool',
    enabled: true,
    order: 1
  },
  {
    name: 'content_generation',
    displayName: 'Content Generation',
    description: 'Generate article using Claude Sonnet 4.5',
    enabled: true,
    order: 2
  },
  {
    name: 'fact_verification',
    displayName: 'Fact Verification',
    description: 'Verify facts using Perplexity (web search)',
    enabled: true,
    order: 3
  },
  {
    name: 'content_enhancement',
    displayName: 'Content Enhancement',
    description: 'Add internal links, improve readability',
    enabled: true,
    order: 4
  },
  {
    name: 'quote_injection',
    displayName: 'Quote Injection',
    description: 'Inject 2-5 real quotes (60%+ requirement)',
    enabled: true,
    order: 5
  },
  {
    name: 'shortcode_transformation',
    displayName: 'Shortcode Transformation',
    description: 'Convert links to WordPress shortcodes',
    enabled: true,
    order: 6
  }
];

export default function PipelineConfiguration() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    setLoading(true);
    try {
      const data = await PipelineConfigurationEntity.find(
        {},
        { orderBy: { column: 'is_active', ascending: false } }
      );
      setPipelines(data);
    } catch (error) {
      console.error("Error loading pipelines:", error);
      toast.error("Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (id) => {
    try {
      // Deactivate all others
      await Promise.all(
        pipelines
          .filter(p => p.is_active)
          .map(p => PipelineConfigurationEntity.update(p.id, { is_active: false }))
      );

      // Activate this one
      await PipelineConfigurationEntity.update(id, { is_active: true });

      toast.success('Pipeline activated');
      loadPipelines();
    } catch (error) {
      console.error("Error activating pipeline:", error);
      toast.error("Failed to activate pipeline");
    }
  };

  const handleDuplicate = async (pipeline) => {
    try {
      const newPipeline = {
        name: `${pipeline.name} (Copy)`,
        description: pipeline.description,
        stages: pipeline.stages,
        is_active: false
      };

      await PipelineConfigurationEntity.create(newPipeline);

      toast.success('Pipeline duplicated');
      loadPipelines();
    } catch (error) {
      console.error("Error duplicating pipeline:", error);
      toast.error("Failed to duplicate pipeline");
    }
  };

  const handleDelete = async (id) => {
    const pipeline = pipelines.find(p => p.id === id);

    if (pipeline.is_active) {
      toast.error('Cannot delete active pipeline');
      return;
    }

    if (!confirm('Are you sure you want to delete this pipeline?')) return;

    try {
      await PipelineConfigurationEntity.delete(id);
      toast.success('Pipeline deleted');
      loadPipelines();
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast.error("Failed to delete pipeline");
    }
  };

  const activePipeline = pipelines.find(p => p.is_active);

  const stats = {
    total: pipelines.length,
    active: pipelines.filter(p => p.is_active).length,
    totalArticles: pipelines.reduce((sum, p) => sum + (p.articles_generated || 0), 0)
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Workflow className="w-8 h-8 text-cyan-600" />
            Pipeline Configuration
          </h1>
          <p className="text-slate-600 mt-1">Manage modular AI content generation pipelines</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Pipeline
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pipelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {activePipeline ? activePipeline.name : 'None'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Articles Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalArticles}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          </div>
        ) : pipelines.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Workflow className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pipelines</h3>
              <p className="text-slate-500 mb-4">Create your first pipeline configuration</p>
            </CardContent>
          </Card>
        ) : (
          pipelines.map((pipeline) => (
            <Card
              key={pipeline.id}
              className={`hover:shadow-md transition-shadow ${
                pipeline.is_active ? 'border-green-500 border-2' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900">{pipeline.name}</h3>
                      {pipeline.is_active && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>

                    {pipeline.description && (
                      <p className="text-slate-600 mb-3">{pipeline.description}</p>
                    )}

                    {/* Pipeline Stages */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-slate-700 mb-2">Pipeline Stages:</p>
                      <div className="flex flex-wrap gap-2">
                        {pipeline.stages.filter(s => s.enabled).map((stage, idx) => (
                          <Badge key={idx} variant="outline" className="bg-cyan-50">
                            {stage.displayName}
                          </Badge>
                        ))}
                      </div>
                      {pipeline.stages.filter(s => !s.enabled).length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {pipeline.stages.filter(s => !s.enabled).length} stages disabled
                        </p>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {pipeline.articles_generated > 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {pipeline.articles_generated} articles generated
                        </span>
                      )}
                      <span>
                        Created: {format(new Date(pipeline.created_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!pipeline.is_active && (
                      <Button
                        size="sm"
                        onClick={() => handleSetActive(pipeline.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPipeline(pipeline);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicate(pipeline)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Duplicate
                    </Button>
                    {!pipeline.is_active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(pipeline.id)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedPipeline && (
        <PipelineEditorModal
          pipeline={selectedPipeline}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPipeline(null);
          }}
          onSave={() => {
            loadPipelines();
            setShowEditModal(false);
            setSelectedPipeline(null);
          }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <PipelineEditorModal
          pipeline={null}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            loadPipelines();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Pipeline Editor Modal
 */
function PipelineEditorModal({ pipeline, isOpen, onClose, onSave }) {
  const [name, setName] = useState(pipeline?.name || '');
  const [description, setDescription] = useState(pipeline?.description || '');
  const [stages, setStages] = useState(pipeline?.stages || DEFAULT_STAGES);
  const [saving, setSaving] = useState(false);

  const handleToggleStage = (stageName) => {
    setStages(prev =>
      prev.map(s =>
        s.name === stageName ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Pipeline name is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name,
        description,
        stages,
        is_active: false
      };

      if (pipeline) {
        await PipelineConfigurationEntity.update(pipeline.id, data);
        toast.success('Pipeline updated');
      } else {
        await PipelineConfigurationEntity.create(data);
        toast.success('Pipeline created');
      }

      onSave();
    } catch (error) {
      console.error("Error saving pipeline:", error);
      toast.error("Failed to save pipeline");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>{pipeline ? 'Edit Pipeline' : 'Create Pipeline'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pipeline Name *
            </label>
            <Input
              placeholder="My Custom Pipeline"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <Textarea
              placeholder="Describe this pipeline configuration..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Pipeline Stages
            </label>
            <div className="space-y-3">
              {stages
                .sort((a, b) => a.order - b.order)
                .map((stage) => (
                  <Card key={stage.name} className={stage.enabled ? 'bg-white' : 'bg-slate-50'}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-500">#{stage.order}</span>
                            <h4 className="font-semibold text-slate-900">{stage.displayName}</h4>
                          </div>
                          <p className="text-sm text-slate-600">{stage.description}</p>
                        </div>
                        <Switch
                          checked={stage.enabled}
                          onCheckedChange={() => handleToggleStage(stage.name)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>

        <div className="border-t p-6 flex-shrink-0">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
              {pipeline ? 'Update' : 'Create'} Pipeline
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
