import React, { useState, useEffect } from 'react';
import { Client } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Save, X, Plus, Target, Compass, TrendingUp } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function VisionComponent({ client }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    core_values: [],
    core_focus: '',
    ten_year_target: '',
    marketing_strategy: {
      target_market: '',
      three_uniques: ['', '', ''],
      proven_process: ''
    },
    three_year_picture: '',
    one_year_plan: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (client) {
      setFormData({
        core_values: client.core_values || [],
        core_focus: client.core_focus || '',
        ten_year_target: client.ten_year_target || '',
        marketing_strategy: client.marketing_strategy || {
          target_market: '',
          three_uniques: ['', '', ''],
          proven_process: ''
        },
        three_year_picture: client.three_year_picture || '',
        one_year_plan: client.one_year_plan || ''
      });
    }
  }, [client]);

  const handleSave = async () => {
    try {
      await Client.update(client.id, formData);
      toast({
        title: "Vision Updated",
        description: "Your Vision/Traction Organizer has been saved successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating vision:', error);
      toast({
        title: "Error",
        description: "Failed to update vision. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addCoreValue = () => {
    setFormData(prev => ({
      ...prev,
      core_values: [...prev.core_values, '']
    }));
  };

  const updateCoreValue = (index, value) => {
    setFormData(prev => ({
      ...prev,
      core_values: prev.core_values.map((val, i) => i === index ? value : val)
    }));
  };

  const removeCoreValue = (index) => {
    setFormData(prev => ({
      ...prev,
      core_values: prev.core_values.filter((_, i) => i !== index)
    }));
  };

  const updateMarketingStrategy = (field, value, index = null) => {
    setFormData(prev => ({
      ...prev,
      marketing_strategy: {
        ...prev.marketing_strategy,
        [field]: index !== null ? 
          prev.marketing_strategy[field].map((item, i) => i === index ? value : item) :
          value
      }
    }));
  };

  if (!client) return null;

  const completionPercentage = Math.round([
    formData.core_values.length > 0,
    formData.core_focus,
    formData.ten_year_target,
    formData.marketing_strategy.target_market,
    formData.three_year_picture,
    formData.one_year_plan
  ].filter(Boolean).length / 6 * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-500" />
            Vision/Traction Organizer
          </h2>
          <p className="text-slate-600 mt-1">Define your company's vision and strategic direction</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="px-3 py-1">
            {completionPercentage}% Complete
          </Badge>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit V/TO
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Values */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Core Values
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Company Core Values (3-7 recommended)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCoreValue}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {formData.core_values.map((value, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={value}
                      onChange={(e) => updateCoreValue(index, e.target.value)}
                      placeholder={`Core Value ${index + 1}`}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => removeCoreValue(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {formData.core_values.length > 0 ? (
                  formData.core_values.map((value, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {value}
                    </Badge>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No core values defined yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Core Focus */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-500" />
              Core Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="core_focus">Your company's purpose and passion</Label>
                <Textarea
                  id="core_focus"
                  value={formData.core_focus}
                  onChange={(e) => setFormData(prev => ({ ...prev, core_focus: e.target.value }))}
                  placeholder="Why does your company exist? What is your company's passion?"
                  rows={4}
                />
              </div>
            ) : (
              <p className="text-slate-700">
                {formData.core_focus || <span className="italic text-slate-500">Core focus not defined yet</span>}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 10-Year Target */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              10-Year Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="ten_year_target">Where will your company be in 10 years?</Label>
                <Textarea
                  id="ten_year_target"
                  value={formData.ten_year_target}
                  onChange={(e) => setFormData(prev => ({ ...prev, ten_year_target: e.target.value }))}
                  placeholder="Describe your 10-year vision..."
                  rows={4}
                />
              </div>
            ) : (
              <p className="text-slate-700">
                {formData.ten_year_target || <span className="italic text-slate-500">10-year target not defined yet</span>}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Marketing Strategy */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Marketing Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="target_market">Target Market</Label>
                  <Input
                    id="target_market"
                    value={formData.marketing_strategy.target_market}
                    onChange={(e) => updateMarketingStrategy('target_market', e.target.value)}
                    placeholder="Who is your ideal customer?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Three Uniques</Label>
                  {formData.marketing_strategy.three_uniques.map((unique, index) => (
                    <Input
                      key={index}
                      value={unique}
                      onChange={(e) => updateMarketingStrategy('three_uniques', e.target.value, index)}
                      placeholder={`Unique ${index + 1}`}
                    />
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="proven_process">Proven Process</Label>
                  <Input
                    id="proven_process"
                    value={formData.marketing_strategy.proven_process}
                    onChange={(e) => updateMarketingStrategy('proven_process', e.target.value)}
                    placeholder="Your unique way of solving the customer's problem"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Target Market:</Label>
                  <p className="text-slate-700">
                    {formData.marketing_strategy.target_market || <span className="italic text-slate-500">Not defined</span>}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Three Uniques:</Label>
                  <ul className="list-disc list-inside text-slate-700 space-y-1">
                    {formData.marketing_strategy.three_uniques.filter(u => u.trim()).map((unique, index) => (
                      <li key={index}>{unique}</li>
                    ))}
                    {formData.marketing_strategy.three_uniques.filter(u => u.trim()).length === 0 && (
                      <li className="italic text-slate-500">Not defined</li>
                    )}
                  </ul>
                </div>
                <div>
                  <Label className="text-sm font-medium">Proven Process:</Label>
                  <p className="text-slate-700">
                    {formData.marketing_strategy.proven_process || <span className="italic text-slate-500">Not defined</span>}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3-Year Picture and 1-Year Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>3-Year Picture</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="three_year_picture">What will your company look like in 3 years?</Label>
                <Textarea
                  id="three_year_picture"
                  value={formData.three_year_picture}
                  onChange={(e) => setFormData(prev => ({ ...prev, three_year_picture: e.target.value }))}
                  placeholder="Describe your 3-year picture..."
                  rows={6}
                />
              </div>
            ) : (
              <p className="text-slate-700">
                {formData.three_year_picture || <span className="italic text-slate-500">3-year picture not defined yet</span>}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>1-Year Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="one_year_plan">What are your goals for this year?</Label>
                <Textarea
                  id="one_year_plan"
                  value={formData.one_year_plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, one_year_plan: e.target.value }))}
                  placeholder="Describe your 1-year plan..."
                  rows={6}
                />
              </div>
            ) : (
              <p className="text-slate-700">
                {formData.one_year_plan || <span className="italic text-slate-500">1-year plan not defined yet</span>}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}