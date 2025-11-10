import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KEYWORD_CONTENT, ANIMATIONS } from '@/lib/onboarding-config';
import { Key, CheckCircle2, AlertCircle, Loader2, Lightbulb } from 'lucide-react';
import { Keyword } from '@/lib/perdia-sdk';
import { toast } from 'sonner';

/**
 * KeywordSetupStep - Add first keyword
 * Allows users to add a keyword manually or use an example
 */
export default function KeywordSetupStep({ onNext, onPrevious }) {
  const [mode, setMode] = useState(null); // 'example' or 'manual'
  const [keyword, setKeyword] = useState('');
  const [searchVolume, setSearchVolume] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUseExample = async () => {
    setLoading(true);
    setError('');

    try {
      const keywordData = await Keyword.create({
        keyword: KEYWORD_CONTENT.exampleKeyword.keyword,
        search_volume: KEYWORD_CONTENT.exampleKeyword.search_volume,
        category: KEYWORD_CONTENT.exampleKeyword.category,
        list_type: 'new_target',
        status: 'queued',
        priority: 5,
      });

      toast.success('Example keyword added successfully!');

      setTimeout(() => {
        onNext({
          keyword_added: true,
          keyword_data: keywordData,
        });
      }, 1000);
    } catch (err) {
      console.error('Error adding example keyword:', err);
      setError('Failed to add keyword. Please try again.');
      toast.error('Failed to add keyword');
      setLoading(false);
    }
  };

  const handleAddManual = async () => {
    // Validate
    if (!keyword.trim()) {
      setError('Please enter a keyword');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const keywordData = await Keyword.create({
        keyword: keyword.trim(),
        search_volume: searchVolume ? parseInt(searchVolume, 10) : null,
        category: category.trim() || 'uncategorized',
        list_type: 'new_target',
        status: 'queued',
        priority: 5,
      });

      toast.success('Keyword added successfully!');

      setTimeout(() => {
        onNext({
          keyword_added: true,
          keyword_data: keywordData,
        });
      }, 1000);
    } catch (err) {
      console.error('Error adding keyword:', err);
      setError('Failed to add keyword. Please try again.');
      toast.error('Failed to add keyword');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div className="text-center mb-4" {...ANIMATIONS.fadeIn}>
        <Badge variant="secondary" className="mb-2 text-xs">
          {KEYWORD_CONTENT.badge}
        </Badge>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {KEYWORD_CONTENT.title}
        </h2>
        <p className="text-sm text-gray-600">
          {KEYWORD_CONTENT.subtitle}
        </p>
      </motion.div>

      {/* Description */}
      <motion.p
        className="text-sm text-gray-600 text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {KEYWORD_CONTENT.description}
      </motion.p>

      {/* Tips */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-3 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            Keyword Tips
          </h3>
          <ul className="space-y-1">
            {KEYWORD_CONTENT.tips.map((tip, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-2 text-xs text-gray-600"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <CheckCircle2 className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </motion.li>
            ))}
          </ul>
        </Card>
      </motion.div>

      {/* Mode Selection or Form */}
      {!mode ? (
        <motion.div
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* Use Example Option */}
          <Card
            className="p-4 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all"
            onClick={() => setMode('example')}
          >
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900 mb-2">
                {KEYWORD_CONTENT.useExampleText}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Get started quickly with a pre-filled keyword
              </p>
              <div className="p-2 bg-gray-50 rounded-lg text-left">
                <div className="text-xs font-medium text-gray-900 mb-0.5">
                  "{KEYWORD_CONTENT.exampleKeyword.keyword}"
                </div>
                <div className="text-xs text-gray-500">
                  Volume: {KEYWORD_CONTENT.exampleKeyword.search_volume.toLocaleString()} | Category:{' '}
                  {KEYWORD_CONTENT.exampleKeyword.category}
                </div>
              </div>
            </div>
          </Card>

          {/* Add Manual Option */}
          <Card
            className="p-4 cursor-pointer hover:shadow-lg hover:border-purple-500 transition-all"
            onClick={() => setMode('manual')}
          >
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900 mb-2">
                {KEYWORD_CONTENT.addManualText}
              </h3>
              <p className="text-xs text-gray-600">
                Enter a keyword specific to your content strategy
              </p>
            </div>
          </Card>
        </motion.div>
      ) : mode === 'example' ? (
        /* Example Keyword Confirmation */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">
              Example Keyword
            </h3>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {KEYWORD_CONTENT.exampleKeyword.keyword}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>
                      <strong>Volume:</strong>{' '}
                      {KEYWORD_CONTENT.exampleKeyword.search_volume.toLocaleString()}
                    </span>
                    <span>
                      <strong>Category:</strong>{' '}
                      {KEYWORD_CONTENT.exampleKeyword.category}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">New Target</Badge>
              </div>
              <p className="text-xs text-gray-600">
                This keyword will be added to your tracking list and used to
                generate your first article.
              </p>
            </div>

            <div className="flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode(null)}
                disabled={loading}
              >
                Back to Options
              </Button>
              <Button
                size="sm"
                onClick={handleUseExample}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Adding...' : 'Continue with Example'}
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        /* Manual Keyword Form */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">
              Add Your Keyword
            </h3>
            <div className="space-y-3">
              {/* Keyword Input */}
              <div>
                <Label htmlFor="keyword" className="text-xs font-medium">
                  Target Keyword *
                </Label>
                <Input
                  id="keyword"
                  type="text"
                  placeholder="e.g., best online MBA programs"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  className="mt-1 h-8 text-sm"
                />
              </div>

              {/* Search Volume Input */}
              <div>
                <Label htmlFor="volume" className="text-xs font-medium">
                  Search Volume (Optional)
                </Label>
                <Input
                  id="volume"
                  type="number"
                  placeholder="e.g., 2400"
                  value={searchVolume}
                  onChange={(e) => setSearchVolume(e.target.value)}
                  disabled={loading}
                  className="mt-1 h-8 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Monthly search volume if you have keyword data
                </p>
              </div>

              {/* Category Input */}
              <div>
                <Label htmlFor="category" className="text-xs font-medium">
                  Category (Optional)
                </Label>
                <Input
                  id="category"
                  type="text"
                  placeholder="e.g., degree-programs"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                  className="mt-1 h-8 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Organize keywords by topic or content type
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-between mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode(null)}
                disabled={loading}
              >
                Back to Options
              </Button>
              <Button
                size="sm"
                onClick={handleAddManual}
                disabled={loading || !keyword.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Adding...' : 'Add & Continue'}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Navigation (only show if mode not selected) */}
      {!mode && (
        <motion.div
          className="flex justify-between mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <Button variant="ghost" size="sm" onClick={onPrevious}>
            Previous
          </Button>
        </motion.div>
      )}
    </div>
  );
}
