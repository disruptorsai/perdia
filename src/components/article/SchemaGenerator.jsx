/**
 * Schema Generator
 * Generates JSON-LD schema markup for articles
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Code, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SchemaGenerator({ article, onSchemaUpdate }) {
  const [schema, setSchema] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!article) return;

    const generateSchema = () => {
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title || "Article Title",
        "description": article.excerpt || "",
        "datePublished": article.created_date || new Date().toISOString(),
        "dateModified": article.updated_date || new Date().toISOString(),
        "author": {
          "@type": "Organization",
          "name": "GetEducated.com",
          "url": "https://www.geteducated.com"
        },
        "publisher": {
          "@type": "Organization",
          "name": "GetEducated.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.geteducated.com/logo.png"
          }
        }
      };

      // Add FAQPage schema if FAQs exist
      if (article.faqs && article.faqs.length > 0) {
        const faqSchema = {
          "@context": "https://schema.org",
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

        const combined = {
          "@context": "https://schema.org",
          "@graph": [schemaData, faqSchema]
        };

        setSchema(JSON.stringify(combined, null, 2));
      } else {
        setSchema(JSON.stringify(schemaData, null, 2));
      }
    };

    generateSchema();
  }, [article]);

  const handleCopy = () => {
    navigator.clipboard.writeText(schema);
    setCopied(true);
    toast.success("Schema copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            JSON-LD Schema
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <><CheckCircle2 className="w-4 h-4" /> Copied</>
            ) : (
              <><Copy className="w-4 h-4" /> Copy</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={schema}
          readOnly
          className="font-mono text-xs h-64 bg-gray-50"
          placeholder="Schema will be generated from article data..."
        />
        <p className="text-xs text-gray-500 mt-2">
          Add this schema to your WordPress post's custom HTML head section
        </p>
      </CardContent>
    </Card>
  );
}
