import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, ExternalLink } from "lucide-react";

export default function LinkComplianceChecker({ content, onComplianceChange }) {
  const [stats, setStats] = useState({
    internal: 0,
    external: 0,
    compliant: false
  });

  useEffect(() => {
    if (!content) {
      setStats({ internal: 0, external: 0, compliant: false });
      onComplianceChange?.(false);
      return;
    }

    const internalLinks = (content.match(/geteducated\.com/gi) || []).length;
    const externalLinks = (content.match(/<a href="http/gi) || []).length - internalLinks;
    const compliant = internalLinks >= 2 && externalLinks >= 1;

    setStats({ internal: internalLinks, external: externalLinks, compliant });
    onComplianceChange?.(compliant);
  }, [content]);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Link Compliance</CardTitle>
          <Badge variant={stats.compliant ? 'default' : 'destructive'}>
            {stats.compliant ? 'Pass' : 'Fail'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Internal Links</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{stats.internal}</span>
            <span className="text-xs text-gray-500">/ 2 required</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">External Citations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{stats.external}</span>
            <span className="text-xs text-gray-500">/ 1 required</span>
          </div>
        </div>

        {!stats.compliant && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              Add {Math.max(0, 2 - stats.internal)} more internal link(s) and {Math.max(0, 1 - stats.external)} more external citation(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
