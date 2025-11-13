import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, AlertCircle, Code } from "lucide-react";

export default function SchemaGenerator({ article, onSchemaUpdate }) {
  const [faqs, setFaqs] = useState([]);
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);

  useEffect(() => {
    if (article?.faqs) {
      setFaqs(article.faqs);
    }
  }, [article]);

  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFaq = (index, field, value) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const generateSchema = () => {
    const schemas = [];

    // Article Schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.excerpt,
      "author": {
        "@type": "Organization",
        "name": "GetEducated",
        "url": "https://www.geteducated.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "GetEducated",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.geteducated.com/logo.png"
        }
      },
      "datePublished": article.created_date,
      "dateModified": article.updated_date || article.created_date
    });

    // FAQPage Schema
    if (faqs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      });
    }

    // BreadcrumbList Schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.geteducated.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": article.type?.replace(/_/g, ' '),
          "item": `https://www.geteducated.com/${article.type}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": article.title
        }
      ]
    });

    return schemas;
  };

  const handleGenerateAndSave = () => {
    const schemas = generateSchema();
    onSchemaUpdate(faqs, schemas);
  };

  const schemaPreview = generateSchema();
  const isValid = faqs.length >= 3 && faqs.every(f => f.question && f.answer);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Schema Markup Generator
          </span>
          {isValid ? (
            <Badge className="bg-emerald-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Valid
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              <AlertCircle className="w-3 h-3 mr-1" />
              Needs FAQs
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* FAQ Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">FAQs (Minimum 3)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addFaq}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add FAQ
            </Button>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    />
                    <Textarea
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFaq(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {faqs.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No FAQs added yet. Click "Add FAQ" to start building schema markup.
              </div>
            )}
          </div>
        </div>

        {/* Schema Types */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Generated Schema Types</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Article Schema</span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded ${
              faqs.length > 0 ? 'bg-emerald-50' : 'bg-gray-50'
            }`}>
              {faqs.length > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">FAQPage Schema</span>
              <span className="text-xs text-gray-500">({faqs.length} FAQs)</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">BreadcrumbList Schema</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => setShowSchemaPreview(!showSchemaPreview)}
            variant="outline"
            className="flex-1"
          >
            {showSchemaPreview ? 'Hide' : 'Preview'} Schema JSON
          </Button>
          <Button
            onClick={handleGenerateAndSave}
            disabled={!isValid}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Generate & Save Schema
          </Button>
        </div>

        {/* Schema Preview */}
        {showSchemaPreview && (
          <div className="p-4 bg-gray-900 rounded-lg overflow-auto max-h-96">
            <pre className="text-xs text-green-400 font-mono">
              {JSON.stringify(schemaPreview, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}