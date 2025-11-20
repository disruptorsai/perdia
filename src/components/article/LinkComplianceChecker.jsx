/**
 * Link Compliance Checker
 * Validates internal and external links meet GetEducated standards
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, ExternalLink, Link } from "lucide-react";

export default function LinkComplianceChecker({ content, onComplianceChange }) {
  const [analysis, setAnalysis] = useState({
    internalLinks: 0,
    externalLinks: 0,
    brokenLinks: [],
    compliance: false,
    warnings: []
  });

  useEffect(() => {
    if (!content) return;

    const analyzeLinks = () => {
      // Count internal links (geteducated.com)
      const internalMatches = content.match(/geteducated\.com/gi) || [];
      const internalLinks = internalMatches.length;

      // Count all href links
      const allLinkMatches = content.match(/<a\s+href="http[^"]*"/gi) || [];
      const externalLinks = allLinkMatches.length - internalLinks;

      const warnings = [];

      // Check compliance
      if (internalLinks < 2) {
        warnings.push(`Need ${2 - internalLinks} more internal link(s) (minimum 2 required)`);
      }

      if (externalLinks < 1) {
        warnings.push(`Need ${1 - externalLinks} more external citation(s) (minimum 1 required)`);
      }

      // Check for affiliate links without disclosure
      const hasAffiliateLinks = content.match(/affiliate|amazon\.com|amzn\./gi);
      const hasDisclosure = content.match(/affiliate|sponsored|commission/gi);
      if (hasAffiliateLinks && !hasDisclosure) {
        warnings.push('Affiliate links detected without disclosure');
      }

      const result = {
        internalLinks,
        externalLinks,
        brokenLinks: [], // Would need actual URL checking
        compliance: internalLinks >= 2 && externalLinks >= 1,
        warnings
      };

      setAnalysis(result);

      if (onComplianceChange) {
        onComplianceChange(result.compliance, result);
      }
    };

    analyzeLinks();
  }, [content, onComplianceChange]);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Link Compliance
          </CardTitle>
          <Badge
            variant={analysis.compliance ? "default" : "destructive"}
            className={analysis.compliance ? "bg-green-600" : ""}
          >
            {analysis.compliance ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Compliant</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" /> Issues</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Link Counts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Link className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Internal Links</span>
            </div>
            <p className={`text-2xl font-bold ${analysis.internalLinks >= 2 ? 'text-green-600' : 'text-red-600'}`}>
              {analysis.internalLinks}
            </p>
            <p className="text-xs text-gray-500">Minimum: 2</p>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ExternalLink className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">External Links</span>
            </div>
            <p className={`text-2xl font-bold ${analysis.externalLinks >= 1 ? 'text-green-600' : 'text-red-600'}`}>
              {analysis.externalLinks}
            </p>
            <p className="text-xs text-gray-500">Minimum: 1</p>
          </div>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">Issues Found:</p>
                <ul className="space-y-1">
                  {analysis.warnings.map((warning, i) => (
                    <li key={i} className="text-xs text-amber-800">• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {analysis.compliance && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                All link requirements met!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
