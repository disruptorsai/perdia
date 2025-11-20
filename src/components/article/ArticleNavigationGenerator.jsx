import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

export default function ArticleNavigationGenerator({ content, onNavigationGenerated }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!content) {
      setHeadings([]);
      return;
    }

    // Extract H2 headings from content
    const h2Matches = content.matchAll(/<h2[^>]*(?:id=["']([^"']+)["'][^>]*)?>(.*?)<\/h2>/gi);
    const extractedHeadings = [];

    for (const match of h2Matches) {
      const id = match[1] || '';
      const text = match[2].replace(/<[^>]*>/g, '').trim();
      extractedHeadings.push({ id, text });
    }

    setHeadings(extractedHeadings);
  }, [content]);

  const generateTableOfContents = () => {
    if (headings.length === 0) {
      alert('No H2 headings found. Add section headings to your article first.');
      return;
    }

    const tocHTML = `
<div class="table-of-contents">
  <h3>Table of Contents</h3>
  <ul>
${headings.map(h => `    <li><a href="#${h.id || h.text.toLowerCase().replace(/\s+/g, '-')}">${h.text}</a></li>`).join('\n')}
  </ul>
</div>`;

    navigator.clipboard.writeText(tocHTML);
    onNavigationGenerated?.(tocHTML);
    alert('Table of contents copied to clipboard! Paste it at the top of your article.');
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Navigation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600">
          <p>Detected {headings.length} section heading(s)</p>
        </div>

        {headings.length > 0 && (
          <div className="max-h-32 overflow-y-auto text-xs text-gray-600 space-y-1">
            {headings.map((h, i) => (
              <div key={i} className="truncate">
                • {h.text}
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={generateTableOfContents}
          disabled={headings.length === 0}
          className="w-full gap-2"
          variant="outline"
        >
          <List className="w-4 h-4" />
          Generate Table of Contents
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Creates jump links for reader navigation
        </p>
      </CardContent>
    </Card>
  );
}
