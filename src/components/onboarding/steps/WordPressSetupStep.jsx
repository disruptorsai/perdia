import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WORDPRESS_CONTENT, ANIMATIONS } from '@/lib/onboarding-config';
import { Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { WordPressConnection } from '@/lib/perdia-sdk';
import { toast } from 'sonner';

/**
 * WordPressSetupStep - Connect WordPress site
 * Allows users to connect their WordPress site or skip
 */
export default function WordPressSetupStep({ onNext, onPrevious, onSkip }) {
  const [url, setUrl] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testSuccess, setTestSuccess] = useState(false);

  const handleConnect = async () => {
    // Validate URL
    if (!url.trim()) {
      setError('Please enter your WordPress site URL');
      return;
    }

    // Basic URL validation
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (!urlObj.hostname) {
        throw new Error('Invalid URL');
      }
    } catch (err) {
      setError('Please enter a valid URL (e.g., https://yourdomain.com)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create WordPress connection
      const connection = await WordPressConnection.create({
        site_url: url.startsWith('http') ? url : `https://${url}`,
        site_title: siteTitle || 'My WordPress Site',
        is_active: true,
      });

      setTestSuccess(true);
      toast.success('WordPress site connected successfully!');

      // Wait a moment to show success state
      setTimeout(() => {
        onNext({
          wordpress_connected: true,
          wordpress_url: connection.site_url,
        });
      }, 1500);
    } catch (err) {
      console.error('WordPress connection error:', err);
      setError(
        'Failed to connect. You can skip this step and configure WordPress later.'
      );
      toast.error('Failed to connect WordPress site');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipStep = () => {
    onNext({
      wordpress_connected: false,
      wordpress_url: '',
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div className="text-center mb-4" {...ANIMATIONS.fadeIn}>
        <Badge variant="secondary" className="mb-2 text-xs">
          {WORDPRESS_CONTENT.badge}
        </Badge>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {WORDPRESS_CONTENT.title}
        </h2>
        <p className="text-sm text-gray-600">
          {WORDPRESS_CONTENT.subtitle}
        </p>
      </motion.div>

      {/* Description */}
      <motion.p
        className="text-sm text-gray-600 text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {WORDPRESS_CONTENT.description}
      </motion.p>

      {/* Benefits */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-3">
          <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Benefits of Connecting WordPress
          </h3>
          <ul className="space-y-1">
            {WORDPRESS_CONTENT.benefits.map((benefit, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-2 text-xs text-gray-600"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </Card>
      </motion.div>

      {/* Connection Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-4">
          <div className="space-y-3">
            {/* URL Input */}
            <div>
              <Label htmlFor="wordpress-url" className="text-xs font-medium">
                WordPress Site URL *
              </Label>
              <Input
                id="wordpress-url"
                type="url"
                placeholder="https://yourdomain.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                  setTestSuccess(false);
                }}
                disabled={loading || testSuccess}
                className="mt-1 h-8 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your WordPress site URL (e.g., https://geteducated.com)
              </p>
            </div>

            {/* Site Title Input */}
            <div>
              <Label htmlFor="site-title" className="text-xs font-medium">
                Site Title (Optional)
              </Label>
              <Input
                id="site-title"
                type="text"
                placeholder="My WordPress Site"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                disabled={loading || testSuccess}
                className="mt-1 h-8 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                A friendly name to identify this site
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Success Message */}
            {testSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Alert className="bg-green-50 text-green-900 border-green-200 py-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <AlertDescription className="text-xs">
                    WordPress site connected successfully! Moving to next
                    step...
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex items-center justify-between mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Button variant="ghost" size="sm" onClick={onPrevious} disabled={loading}>
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkipStep}
            disabled={loading || testSuccess}
          >
            {WORDPRESS_CONTENT.skipText}
          </Button>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={loading || testSuccess || !url.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
            {testSuccess && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
            {loading
              ? 'Connecting...'
              : testSuccess
              ? 'Connected'
              : WORDPRESS_CONTENT.continueText}
          </Button>
        </div>
      </motion.div>

      {/* Helper Text */}
      <motion.div
        className="mt-3 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <p className="text-xs text-gray-500">
          Don't worry, you can add or modify WordPress connections anytime from
          the WordPress page
        </p>
      </motion.div>
    </div>
  );
}
