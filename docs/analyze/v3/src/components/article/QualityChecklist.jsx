import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Shield } from "lucide-react";

export default function QualityChecklist({ article, content, onQualityChange }) {
  const [checks, setChecks] = useState({
    hasMinInternalLinks: false,
    hasExternalCitation: false,
    hasNoUnwrappedLinks: false,
    hasValidSchema: false,
    hasArticleNavigation: false,
    hasBLSCitation: false,
    hasMinWordCount: false,
    hasFAQs: false
  });

  useEffect(() => {
    runQualityChecks();
  }, [article, content]);

  const runQualityChecks = () => {
    if (!content) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Count internal links
    const links = Array.from(doc.querySelectorAll('a'));
    const internalLinks = links.filter(link => {
      const href = link.getAttribute('href') || '';
      return href.startsWith('/') || href.includes('geteducated.com');
    });

    // Check for unwrapped monetization links
    const unwrappedLinks = links.filter(link => {
      const href = link.getAttribute('href') || '';
      const classes = link.getAttribute('class') || '';
      const isMonetization = href.includes('/online-schools/') || href.includes('?d=');
      const isWrapped = classes.includes('wpge-cta') || classes.includes('affiliate-link');
      return isMonetization && !isWrapped;
    });

    // Check for external citations
    const externalLinks = links.filter(link => {
      const href = link.getAttribute('href') || '';
      return !href.startsWith('/') && !href.includes('geteducated.com');
    });

    // Check for BLS citations
    const blsCitations = links.filter(link => {
      const href = link.getAttribute('href') || '';
      return href.includes('bls.gov');
    });

    // Check for article navigation
    const hasNavigation = content.includes('ARTICLE NAVIGATION:') || 
                          content.includes('article-navigation');

    // Word count
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;

    // Check FAQs
    const hasFAQs = (article?.faqs && article.faqs.length >= 3) || 
                    content.toLowerCase().includes('<h2>faq') ||
                    content.toLowerCase().includes('frequently asked questions');

    const newChecks = {
      hasMinInternalLinks: internalLinks.length >= 5,
      hasExternalCitation: externalLinks.length >= 1,
      hasNoUnwrappedLinks: unwrappedLinks.length === 0,
      hasValidSchema: article?.schema_valid || false,
      hasArticleNavigation: hasNavigation,
      hasBLSCitation: blsCitations.length >= 1,
      hasMinWordCount: wordCount >= 800,
      hasFAQs: hasFAQs,
      stats: {
        internalLinks: internalLinks.length,
        externalLinks: externalLinks.length,
        unwrappedLinks: unwrappedLinks.length,
        blsCitations: blsCitations.length,
        wordCount
      }
    };

    setChecks(newChecks);

    // Calculate overall quality
    const criticalChecks = [
      newChecks.hasNoUnwrappedLinks, // CRITICAL - blocks publishing
      newChecks.hasMinWordCount
    ];

    const importantChecks = [
      newChecks.hasMinInternalLinks,
      newChecks.hasExternalCitation,
      newChecks.hasBLSCitation,
      newChecks.hasValidSchema
    ];

    const optionalChecks = [
      newChecks.hasArticleNavigation,
      newChecks.hasFAQs
    ];

    const criticalPassed = criticalChecks.every(c => c);
    const importantPassed = importantChecks.filter(c => c).length;
    const optionalPassed = optionalChecks.filter(c => c).length;

    onQualityChange({
      canPublish: criticalPassed,
      score: ((importantPassed + optionalPassed) / (importantChecks.length + optionalChecks.length)) * 100,
      checks: newChecks
    });
  };

  const checkItems = [
    {
      key: 'hasNoUnwrappedLinks',
      label: 'Shortcode Compliance',
      description: 'All monetization links properly wrapped',
      critical: true,
      icon: Shield,
      detail: `${checks.stats?.unwrappedLinks || 0} violations`
    },
    {
      key: 'hasMinWordCount',
      label: 'Word Count',
      description: 'Minimum 800 words',
      critical: true,
      icon: CheckCircle2,
      detail: `${checks.stats?.wordCount || 0} words`
    },
    {
      key: 'hasMinInternalLinks',
      label: 'Internal Links',
      description: 'Minimum 5 internal links',
      critical: false,
      icon: CheckCircle2,
      detail: `${checks.stats?.internalLinks || 0} / 5`
    },
    {
      key: 'hasExternalCitation',
      label: 'External Citations',
      description: 'At least 1 authoritative source',
      critical: false,
      icon: CheckCircle2,
      detail: `${checks.stats?.externalLinks || 0} citations`
    },
    {
      key: 'hasBLSCitation',
      label: 'BLS Citation',
      description: 'Bureau of Labor Statistics data cited',
      critical: false,
      icon: CheckCircle2,
      detail: `${checks.stats?.blsCitations || 0} BLS links`
    },
    {
      key: 'hasValidSchema',
      label: 'Schema Markup',
      description: 'Article, FAQPage, Breadcrumb schemas',
      critical: false,
      icon: CheckCircle2,
      detail: 'Generated'
    },
    {
      key: 'hasArticleNavigation',
      label: 'Article Navigation',
      description: 'Jump links to sections',
      critical: false,
      icon: CheckCircle2,
      detail: 'H2 navigation'
    },
    {
      key: 'hasFAQs',
      label: 'FAQ Section',
      description: 'Minimum 3 FAQs for schema',
      critical: false,
      icon: CheckCircle2,
      detail: article?.faqs?.length || 0
    }
  ];

  const criticalIssues = checkItems.filter(item => item.critical && !checks[item.key]);
  const canPublish = criticalIssues.length === 0;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Quality Checklist
          </span>
          {canPublish ? (
            <Badge className="bg-emerald-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Ready to Publish
            </Badge>
          ) : (
            <Badge variant="outline" className="border-red-300 text-red-700">
              <XCircle className="w-3 h-3 mr-1" />
              {criticalIssues.length} Critical Issue{criticalIssues.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checkItems.map((item) => {
          const passed = checks[item.key];
          const Icon = item.icon;
          
          return (
            <div
              key={item.key}
              className={`p-3 rounded-lg border transition-all ${
                passed
                  ? 'bg-emerald-50 border-emerald-200'
                  : item.critical
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  ) : item.critical ? (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{item.label}</span>
                      {item.critical && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.detail}
                </Badge>
              </div>
            </div>
          );
        })}

        {!canPublish && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 mt-4">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">Cannot Publish</p>
                <p className="text-sm text-red-700">
                  Fix critical issues before publishing. The system will block publication until these are resolved.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}