import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, CheckCircle2 } from "lucide-react";

const commonOccupations = [
  { title: "Teachers, Postsecondary", url: "https://www.bls.gov/ooh/education-training-and-library/postsecondary-teachers.htm" },
  { title: "Teachers, Elementary School", url: "https://www.bls.gov/ooh/education-training-and-library/kindergarten-and-elementary-school-teachers.htm" },
  { title: "Teachers, High School", url: "https://www.bls.gov/ooh/education-training-and-library/high-school-teachers.htm" },
  { title: "Registered Nurses", url: "https://www.bls.gov/ooh/healthcare/registered-nurses.htm" },
  { title: "Software Developers", url: "https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm" },
  { title: "Accountants and Auditors", url: "https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm" },
  { title: "Management Analysts", url: "https://www.bls.gov/ooh/business-and-financial/management-analysts.htm" },
  { title: "Marketing Managers", url: "https://www.bls.gov/ooh/management/advertising-promotions-and-marketing-managers.htm" },
  { title: "Librarians and Library Media Specialists", url: "https://www.bls.gov/ooh/education-training-and-library/librarians-and-library-media-specialists.htm" },
  { title: "Social Workers", url: "https://www.bls.gov/ooh/community-and-social-service/social-workers.htm" }
];

export default function BLSCitationHelper({ onInsertCitation }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const filteredOccupations = commonOccupations.filter(occ =>
    occ.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateCitation = (occupation) => {
    const currentYear = new Date().getFullYear();
    const dataYear = currentYear - 1; // BLS data is usually from previous year
    
    return `According to the <a href="${occupation.url}" target="_blank" rel="noopener">Bureau of Labor Statistics</a>, ${occupation.title} earned a median annual wage of $XX,XXX as of May ${dataYear}. The BLS projects X% employment growth from ${dataYear} to ${dataYear + 10}, which is [faster/slower/about as fast] than the average for all occupations.`;
  };

  const handleCopy = (occupation, index) => {
    const citation = generateCitation(occupation);
    navigator.clipboard.writeText(citation);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleInsert = (occupation) => {
    const citation = generateCitation(occupation);
    onInsertCitation(citation);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          BLS Citation Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Search occupations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-auto">
          {filteredOccupations.map((occupation, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{occupation.title}</h4>
                  <a
                    href={occupation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    View on BLS.gov
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(occupation, index)}
                    className="gap-1"
                  >
                    {copiedIndex === index ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleInsert(occupation)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Insert
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredOccupations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No occupations found</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900 font-medium mb-2">Citation Format:</p>
          <p className="text-xs text-blue-700 font-mono">
            According to the [BLS link], [occupation] earned a median annual wage of $XX,XXX as of May [year].
          </p>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-900">
            <strong>Note:</strong> Remember to update placeholder values (salary, growth %) with actual data from the BLS page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}