import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QualityChecklist({ article, content, onQualityChange }) {
  const [checks, setChecks] = useState({});
  const [score, setScore] = useState(0);
  const [canPublish, setCanPublish] = useState(false);

  useEffect(() => {
    runQualityChecks();
  }, [content, article]);

  const runQualityChecks = () => {
    if (!content) {
      onQualityChange?.({ canPublish: false, score: 0, checks: {} });
      return;
    }

    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w && w.length > 0).length;
    const internalLinks = (content.match(/geteducated\.com/gi) || []).length;
    const externalLinks = (content.match(/<a href="http/gi) || []).length - internalLinks;
    const hasH2Tags = /<h2/i.test(content);
    const faqs = article?.faqs || [];

    const newChecks = {
      wordCount: {
        label: 'Word Count (800+ words)',
        pass: wordCount >= 800,
        current: wordCount,
        target: 800,
        critical: true
      },
      internalLinks: {
        label: 'Internal Links (2+ required)',
        pass: internalLinks >= 2,
        current: internalLinks,
        target: 2,
        critical: true
      },
      externalLinks: {
        label: 'External Citations (1+ required)',
        pass: externalLinks >= 1,
        current: externalLinks,
        target: 1,
        critical: true
      },
      structure: {
        label: 'Content Structure (H2 headings)',
        pass: hasH2Tags,
        current: hasH2Tags ? 'Present' : 'Missing',
        critical: true
      },
      faqs: {
        label: 'FAQ Schema (3+ questions)',
        pass: faqs.length >= 3,
        current: faqs.length,
        target: 3,
        critical: false
      }
    };

    setChecks(newChecks);

    // Calculate score
    const totalChecks = Object.keys(newChecks).length;
    const passedChecks = Object.values(newChecks).filter(c => c.pass).length;
    const newScore = Math.round((passedChecks / totalChecks) * 100);
    setScore(newScore);

    // Can publish if all critical checks pass
    const allCriticalPass = Object.values(newChecks)
      .filter(c => c.critical)
      .every(c => c.pass);
    setCanPublish(allCriticalPass);

    onQualityChange?.({ canPublish: allCriticalPass, score: newScore, checks: newChecks });
  };

  const getIcon = (check) => {
    if (check.pass) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    } else if (check.critical) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quality Score</CardTitle>
          <Badge
            variant={score >= 80 ? 'default' : 'destructive'}
            className="text-lg px-3 py-1"
          >
            {score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(checks).map(([key, check]) => (
          <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            {getIcon(check)}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {check.label}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {typeof check.current === 'number' && typeof check.target === 'number'
                  ? `${check.current} / ${check.target}`
                  : check.current}
              </p>
            </div>
          </div>
        ))}

        {!canPublish && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-800 font-medium">
              ⚠️ Publishing blocked: Fix critical issues above
            </p>
          </div>
        )}

        {canPublish && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800 font-medium">
              ✓ Ready to publish!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
