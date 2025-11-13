import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle2, 
  Link as LinkIcon,
  ExternalLink,
  Shield,
  XCircle
} from "lucide-react";

export default function LinkComplianceChecker({ content, onComplianceChange }) {
  const [analysis, setAnalysis] = useState({
    internalLinks: [],
    externalLinks: [],
    unwrappedLinks: [],
    shortcodeLinks: [],
    citations: []
  });

  useEffect(() => {
    if (content) {
      analyzeContent(content);
    }
  }, [content]);

  const analyzeContent = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));

    const internal = [];
    const external = [];
    const unwrapped = [];
    const shortcoded = [];
    const citations = [];

    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent;
      const classes = link.getAttribute('class') || '';
      const rel = link.getAttribute('rel') || '';

      // Check if internal or external
      const isInternal = href.startsWith('/') || href.includes('geteducated.com');
      
      if (isInternal) {
        internal.push({ href, text });
      } else {
        external.push({ href, text, rel });
        
        // Check if it's a citation
        if (href.includes('bls.gov') || href.includes('nces.ed.gov')) {
          citations.push({ source: href.includes('bls.gov') ? 'BLS' : 'NCES', href, text });
        }
      }

      // Check for shortcode wrapping
      if (classes.includes('wpge-cta') || classes.includes('affiliate-link')) {
        shortcoded.push({ href, text });
      } else if (!isInternal && (href.includes('/online-schools/') || href.includes('?d='))) {
        // Potential monetization link without shortcode
        unwrapped.push({ href, text });
      }
    });

    const newAnalysis = {
      internalLinks: internal,
      externalLinks: external,
      unwrappedLinks: unwrapped,
      shortcodeLinks: shortcoded,
      citations
    };

    setAnalysis(newAnalysis);

    // Update compliance status
    const isCompliant = 
      internal.length >= 3 &&
      citations.length >= 1 &&
      unwrapped.length === 0;

    onComplianceChange(isCompliant, newAnalysis);
  };

  const hasMinInternalLinks = analysis.internalLinks.length >= 3;
  const hasExternalCitation = analysis.citations.length >= 1;
  const hasNoUnwrappedLinks = analysis.unwrappedLinks.length === 0;
  const isFullyCompliant = hasMinInternalLinks && hasExternalCitation && hasNoUnwrappedLinks;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Link Compliance
          </span>
          {isFullyCompliant ? (
            <Badge className="bg-emerald-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Compliant
            </Badge>
          ) : (
            <Badge variant="outline" className="border-red-300 text-red-700">
              <XCircle className="w-3 h-3 mr-1" />
              Issues Found
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Internal Links */}
        <div className={`p-4 rounded-lg border ${
          hasMinInternalLinks 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {hasMinInternalLinks ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="font-semibold text-gray-900">Internal Links</span>
            </div>
            <Badge variant="outline" className={
              hasMinInternalLinks ? 'border-emerald-300' : 'border-amber-300'
            }>
              {analysis.internalLinks.length} / 3 minimum
            </Badge>
          </div>
          {!hasMinInternalLinks && (
            <p className="text-sm text-amber-700 mt-2">
              Add at least {3 - analysis.internalLinks.length} more internal link(s)
            </p>
          )}
          {analysis.internalLinks.length > 0 && (
            <div className="mt-3 space-y-1">
              {analysis.internalLinks.slice(0, 3).map((link, i) => (
                <div key={i} className="text-xs text-gray-600 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" />
                  <span className="truncate">{link.text || link.href}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* External Citations */}
        <div className={`p-4 rounded-lg border ${
          hasExternalCitation 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {hasExternalCitation ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="font-semibold text-gray-900">External Citations</span>
            </div>
            <Badge variant="outline" className={
              hasExternalCitation ? 'border-emerald-300' : 'border-amber-300'
            }>
              {analysis.citations.length} / 1 minimum
            </Badge>
          </div>
          {!hasExternalCitation && (
            <p className="text-sm text-amber-700 mt-2">
              Add at least one authoritative citation (BLS, NCES)
            </p>
          )}
          {analysis.citations.length > 0 && (
            <div className="mt-3 space-y-1">
              {analysis.citations.map((cite, i) => (
                <div key={i} className="text-xs text-emerald-700 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  <span className="font-medium">{cite.source}:</span>
                  <span className="truncate">{cite.text || cite.href}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shortcode Compliance */}
        <div className={`p-4 rounded-lg border ${
          hasNoUnwrappedLinks 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {hasNoUnwrappedLinks ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold text-gray-900">Shortcode Compliance</span>
            </div>
            <Badge variant="outline" className={
              hasNoUnwrappedLinks ? 'border-emerald-300' : 'border-red-300 text-red-700'
            }>
              {analysis.unwrappedLinks.length} violations
            </Badge>
          </div>
          {analysis.unwrappedLinks.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Monetization links must be wrapped in shortcodes
              </p>
              {analysis.unwrappedLinks.map((link, i) => (
                <div key={i} className="text-xs bg-white p-2 rounded border border-red-200">
                  <span className="font-mono text-red-600">{link.href}</span>
                </div>
              ))}
            </div>
          )}
          {hasNoUnwrappedLinks && (
            <p className="text-sm text-emerald-700 mt-2">
              All monetization links properly wrapped ✓
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Total Links:</span>
              <span className="font-semibold ml-2">
                {analysis.internalLinks.length + analysis.externalLinks.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Shortcoded:</span>
              <span className="font-semibold ml-2">{analysis.shortcodeLinks.length}</span>
            </div>
          </div>
        </div>

        {!isFullyCompliant && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-900 font-medium">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Fix compliance issues before publishing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}