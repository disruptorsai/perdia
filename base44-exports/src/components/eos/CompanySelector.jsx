import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Plus } from 'lucide-react';

export default function CompanySelector({ companies, selectedCompany, onCompanySelect, onCompanyCreate }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    company_name: '',
    industry: '',
    employee_count: '',
    core_values: []
  });

  const handleCreate = () => {
    if (!newCompany.company_name.trim()) return;
    
    const companyData = {
      ...newCompany,
      employee_count: newCompany.employee_count ? parseInt(newCompany.employee_count) : null,
      core_values: newCompany.core_values.filter(value => value.trim() !== '')
    };
    
    onCompanyCreate(companyData);
    setShowCreateModal(false);
    setNewCompany({ company_name: '', industry: '', employee_count: '', core_values: [] });
  };

  const addCoreValue = () => {
    setNewCompany(prev => ({
      ...prev,
      core_values: [...prev.core_values, '']
    }));
  };

  const updateCoreValue = (index, value) => {
    setNewCompany(prev => ({
      ...prev,
      core_values: prev.core_values.map((val, i) => i === index ? value : val)
    }));
  };

  const removeCoreValue = (index) => {
    setNewCompany(prev => ({
      ...prev,
      core_values: prev.core_values.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-slate-600" />
        <Select value={selectedCompany?.id || ''} onValueChange={(value) => {
          const company = companies.find(c => c.id === value);
          onCompanySelect(company);
        }}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select company..." />
          </SelectTrigger>
          <SelectContent>
            {companies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Company
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={newCompany.company_name}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_count">Number of Employees</Label>
              <Input
                id="employee_count"
                type="number"
                value={newCompany.employee_count}
                onChange={(e) => setNewCompany(prev => ({ ...prev, employee_count: e.target.value }))}
                placeholder="e.g., 25"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Core Values (3-7 recommended)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCoreValue}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Value
                </Button>
              </div>
              {newCompany.core_values.map((value, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={value}
                    onChange={(e) => updateCoreValue(index, e.target.value)}
                    placeholder={`Core Value ${index + 1}`}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => removeCoreValue(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newCompany.company_name.trim()}>
                Create Company
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}