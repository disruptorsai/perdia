import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2 } from "lucide-react";

export default function SchemaGenerator({ article, onSchemaUpdate }) {
  const generateSchema = () => {
    if (!article) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.excerpt,
      "datePublished": article.created_date || new Date().toISOString(),
      "dateModified": article.updated_date || new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": "GetEducated.com"
      }
    };

    // Add FAQ schema if FAQs exist
    if (article.faqs && article.faqs.length > 0) {
      schema.mainEntity = {
        "@type": "FAQPage",
        "mainEntity": article.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };
    }

    onSchemaUpdate?.(schema);

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    alert('Schema.org markup copied to clipboard!');
  };

  const faqCount = article?.faqs?.length || 0;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Schema Markup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600 space-y-2">
          <p>• Article schema: Ready</p>
          <p>• FAQ schema: {faqCount > 0 ? `${faqCount} questions` : 'Not available'}</p>
        </div>

        <Button
          onClick={generateSchema}
          disabled={!article}
          className="w-full gap-2"
          variant="outline"
        >
          <Code2 className="w-4 h-4" />
          Copy Schema JSON
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Generates structured data for search engines
        </p>
      </CardContent>
    </Card>
  );
}
