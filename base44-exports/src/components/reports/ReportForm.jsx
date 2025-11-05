import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Info, Link, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportForm({ report, onSave, onCancel }) {
  const [name, setName] = useState(report?.name || '');
  const [description, setDescription] = useState(report?.description || '');
  const [reportUrl, setReportUrl] = useState(report?.report_url || '');

  const handleSubmit = () => {
    if (!name || !reportUrl) {
      toast.error("Report name and report URL are required.");
      return;
    }
    try {
      new URL(reportUrl);
    } catch (_) {
      toast.error("Please enter a valid URL.");
      return;
    }
    onSave({ name, description, report_url: reportUrl });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-xl">{report ? 'Edit Report' : 'Add New Report'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-name">Report Name *</Label>
            <Input
              id="report-name"
              placeholder="e.g., Monthly Analytics Dashboard"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-description">Description</Label>
            <Textarea
              id="report-description"
              placeholder="A brief summary of what this report shows."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-url" className="flex items-center gap-2">
              <Link className="w-4 h-4" /> Report Link *
            </Label>
            <Input
              id="report-url"
              type="url"
              placeholder="https://your-report-service.com/view/..."
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md mt-2">
              <Info className="w-4 h-4 mt-1 flex-shrink-0" />
              <p className="text-xs">
                Paste the public share link for your report (e.g., from Looker Studio, Power BI, Tableau). Clicking "View" on the report will open this link in a new tab.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Report</Button>
        </CardFooter>
      </Card>
    </div>
  );
}