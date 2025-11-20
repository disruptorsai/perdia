import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";

export default function BLSCitationHelper({ onInsertCitation }) {
  const [occupation, setOccupation] = useState('');

  const commonOccupations = [
    { name: 'Registered Nurses', url: 'https://www.bls.gov/ooh/healthcare/registered-nurses.htm' },
    { name: 'Software Developers', url: 'https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm' },
    { name: 'Teachers', url: 'https://www.bls.gov/ooh/education-training-and-library/home.htm' },
    { name: 'Business and Financial', url: 'https://www.bls.gov/ooh/business-and-financial/home.htm' }
  ];

  const insertBLSCitation = (url, name) => {
    const currentYear = new Date().getFullYear();
    const citation = `<a href="${url}" target="_blank" rel="noopener">Bureau of Labor Statistics - ${name} (${currentYear})</a>`;

    navigator.clipboard.writeText(citation);
    onInsertCitation?.(citation);
    alert('BLS citation copied to clipboard! Paste it into your article.');
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          BLS Citations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Quick Insert</Label>
          <div className="space-y-1 mt-2">
            {commonOccupations.map((occ, i) => (
              <button
                key={i}
                onClick={() => insertBLSCitation(occ.url, occ.name)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 rounded-lg transition-colors"
              >
                {occ.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t">
          <Label className="text-xs">Custom BLS URL</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Paste BLS URL..."
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="text-xs"
            />
            <Button
              onClick={() => {
                if (occupation) {
                  insertBLSCitation(occupation, 'Occupation Data');
                  setOccupation('');
                }
              }}
              disabled={!occupation}
              size="sm"
            >
              Add
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center pt-2">
          Authoritative salary & employment data
        </p>
      </CardContent>
    </Card>
  );
}
