import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, RefreshCw } from "lucide-react";

export default function ArticleNavigationGenerator({ content, onNavigationGenerated }) {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (content) {
      extractSections(content);
    }
  }, [content]);

  const extractSections = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h2, h3'));

    const extracted = headings.map(heading => ({
      level: heading.tagName.toLowerCase(),
      text: heading.textContent,
      id: heading.getAttribute('id') || generateId(heading.textContent)
    }));

    setSections(extracted);
  };

  const generateId = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateNavigationHtml = () => {
    if (sections.length === 0) return '';

    const links = sections
      .filter(s => s.level === 'h2') // Only use H2 for navigation
      .map(section => `<a href="#${section.id}">${section.text}</a>`)
      .join(' | ');

    return `<p><span style="color: #ffae41;"><strong>ARTICLE NAVIGATION:</strong></span> ${links}</p>`;
  };

  const handleGenerate = () => {
    const navHtml = generateNavigationHtml();
    onNavigationGenerated(navHtml, sections);
  };

  const h2Sections = sections.filter(s => s.level === 'h2');

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <List className="w-5 h-5" />
            Article Navigation
          </span>
          <Badge variant="outline">
            {h2Sections.length} sections
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {h2Sections.length > 0 ? (
          <>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Detected H2 headings for navigation:
              </p>
              {h2Sections.map((section, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500 font-mono">#{section.id}</span>
                  <span className="text-sm flex-1">{section.text}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-medium text-amber-900 mb-2">Preview:</p>
              <div 
                className="text-xs"
                dangerouslySetInnerHTML={{ __html: generateNavigationHtml() }}
              />
            </div>

            <Button
              onClick={handleGenerate}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Insert Navigation at Top
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <List className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">
              No H2 headings detected in content
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Add H2 headings to generate navigation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}