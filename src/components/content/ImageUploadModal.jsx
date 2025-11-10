import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Wand2, Image as ImageIcon, Loader2, Sparkles, Search } from 'lucide-react';
import { toast } from 'sonner';
import { UploadFile } from '@/lib/perdia-sdk';
import { invokeLLM } from '@/lib/ai-client';

export default function ImageUploadModal({ isOpen, onClose, onImageAdded, articleData }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searching, setSearching] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Generate state
  const [manualPrompt, setManualPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

  // Stock search state
  const [stockImages, setStockImages] = useState([]);
  const [selectedStockImage, setSelectedStockImage] = useState(null);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image must be smaller than 10MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle manual upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setUploading(true);
    try {
      const result = await UploadFile({
        file: selectedFile,
        bucket: 'content-images',
        isPublic: true
      });

      onImageAdded({
        url: result.url,
        path: result.path,
        source: 'upload',
        altText: articleData.title || 'Article featured image'
      });

      toast.success('Image uploaded successfully!');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Generate prompt from article content
  const generatePromptFromArticle = async () => {
    setGenerating(true);
    try {
      const prompt = await invokeLLM({
        prompt: `Based on this article title and content, generate a detailed image prompt for creating a professional article hero image.

Article Title: ${articleData.title}
${articleData.content ? `First 500 chars: ${articleData.content.substring(0, 500)}...` : ''}

Generate a detailed prompt (2-3 sentences) for an image generation AI that will create a professional, engaging hero image for this article. The image should be:
- Professional and high-quality
- Relevant to the article topic
- Suitable as a hero/featured image
- Visually appealing
- Not too busy or cluttered

Return ONLY the image prompt, nothing else.`,
        provider: 'claude',
        model: 'claude-haiku-4-5-20251001', // Fast for prompt generation
        temperature: 0.8,
        maxTokens: 200
      });

      setManualPrompt(prompt.trim());
      toast.success('Prompt generated! Review and click Generate Image.');
    } catch (error) {
      console.error('Prompt generation error:', error);
      toast.error('Failed to generate prompt');
    } finally {
      setGenerating(false);
    }
  };

  // Generate image using AI
  const handleGenerateImage = async () => {
    if (!manualPrompt.trim()) {
      toast.error('Please enter or generate a prompt first');
      return;
    }

    setGenerating(true);
    try {
      // Call the generate-image Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/generate-image`;

      // Get auth token
      const { supabase } = await import('@/lib/supabase-client');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      toast.info('Generating image with AI... This may take 10-30 seconds.');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: manualPrompt,
          provider: 'gemini', // Try Gemini first, fallback to GPT-4o
          aspectRatio: '16:9'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Image generation failed');
      }

      const data = await response.json();
      console.log('[ImageUploadModal] Generated image:', data);

      // Handle the generated image
      // If it's a data URL (Gemini), convert to blob and upload
      // If it's a URL (GPT-4o), download and upload
      let imageBlob;
      if (data.imageUrl.startsWith('data:')) {
        // Base64 data URL from Gemini
        const base64Data = data.imageUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        imageBlob = new Blob([byteArray], { type: 'image/jpeg' });
      } else {
        // URL from GPT-4o
        const imageResponse = await fetch(data.imageUrl);
        imageBlob = await imageResponse.blob();
      }

      // Upload to Supabase Storage
      const file = new File([imageBlob], `ai-generated-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const result = await UploadFile({
        file: file,
        bucket: 'content-images',
        isPublic: true
      });

      onImageAdded({
        url: result.url,
        path: result.path,
        source: 'ai_generated',
        altText: `${articleData.title} - AI Generated Image`
      });

      toast.success(`Image generated successfully with ${data.provider}!`);
      onClose();
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  // Search stock images using AI to generate search query
  const handleSearchStockImages = async () => {
    setSearching(true);
    try {
      // Step 1: Use AI to generate optimal search query from article data
      toast.info('Analyzing article to find perfect images...');

      const searchQuery = await invokeLLM({
        prompt: `Based on this article, generate a concise 2-4 word search query for finding the perfect stock photo on Unsplash.

Article Title: ${articleData.title}
${articleData.content ? `First 300 chars: ${articleData.content.substring(0, 300)}...` : ''}

Return ONLY the search query (2-4 words), nothing else. Make it specific enough to find relevant images but broad enough to get good results.

Examples:
- "online learning student"
- "business education"
- "graduate celebration"
- "digital classroom"`,
        provider: 'claude',
        model: 'claude-haiku-4-5-20251001',
        temperature: 0.5,
        maxTokens: 50
      });

      const query = searchQuery.trim().replace(/['"]/g, '');
      console.log('[ImageUploadModal] Unsplash search query:', query);

      // Step 2: Search Unsplash via Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/search-stock-images`;

      const { supabase } = await import('@/lib/supabase-client');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query,
          perPage: 6
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Stock search failed');
      }

      const data = await response.json();
      console.log('[ImageUploadModal] Found stock images:', data.images.length);

      setStockImages(data.images);

      if (data.images.length === 0) {
        toast.info('No images found. Try AI Image Generation instead!');
        setActiveTab('generate');
      } else {
        toast.success(`Found ${data.images.length} images for "${query}"`);
      }
    } catch (error) {
      console.error('Stock search error:', error);
      toast.error(error.message || 'Failed to find stock images');
      // Fallback to AI generation
      setActiveTab('generate');
      toast.info('Try AI Image Generation instead!');
    } finally {
      setSearching(false);
    }
  };

  // Download and use stock image
  const handleUseStockImage = async (stockImage) => {
    setUploading(true);
    try {
      // Notify Unsplash of download (required by API terms)
      if (stockImage.downloadLocation) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const { supabase } = await import('@/lib/supabase-client');
        const { data: { session } } = await supabase.auth.getSession();

        // Track download with Unsplash
        await fetch(`${supabaseUrl}/functions/v1/track-unsplash-download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ downloadLocation: stockImage.downloadLocation }),
        }).catch(err => console.warn('Failed to track download:', err));
      }

      // Download the stock image (use downloadUrl for best quality)
      const response = await fetch(stockImage.downloadUrl || stockImage.url);
      const blob = await response.blob();
      const filename = `unsplash-${stockImage.id}.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });

      // Upload to our storage
      const result = await UploadFile({
        file: file,
        bucket: 'content-images',
        isPublic: true
      });

      onImageAdded({
        url: result.url,
        path: result.path,
        source: 'unsplash',
        altText: stockImage.altText,
        attribution: `Photo by ${stockImage.photographer} on Unsplash`,
        photographerUrl: stockImage.photographerUrl
      });

      toast.success(`Stock image by ${stockImage.photographer} added successfully!`);
      onClose();
    } catch (error) {
      console.error('Stock image download error:', error);
      toast.error('Failed to use stock image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Featured Image</DialogTitle>
          <DialogDescription>
            Upload, generate, or find the perfect image for your article
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find Stock
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Image</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-sm text-slate-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border"
                />
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Image Prompt</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generatePromptFromArticle}
                  disabled={generating}
                  className="flex-shrink-0"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      I'm Feeling Lucky
                    </>
                  )}
                </Button>
              </div>
              <Input
                placeholder="Enter image description or use 'I'm Feeling Lucky'"
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                Describe the image you want to generate, or let AI decide based on your article
              </p>
            </div>

            {generatedImageUrl && (
              <div className="space-y-2">
                <Label>Generated Image</Label>
                <img
                  src={generatedImageUrl}
                  alt="Generated"
                  className="w-full h-64 object-cover rounded-lg border"
                />
              </div>
            )}

            <Button
              onClick={handleGenerateImage}
              disabled={!manualPrompt.trim() || generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Image...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Image with AI
                </>
              )}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Powered by:</strong> Google Gemini 2.5 Flash Image ("Nano Banana"). Generates professional article hero images optimized for your content.
              </p>
            </div>
          </TabsContent>

          {/* Stock Search Tab */}
          <TabsContent value="stock" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Auto-Search Stock Images</Label>
              <p className="text-sm text-slate-600">
                AI will automatically search for relevant stock images based on your article
              </p>
              <Button
                onClick={handleSearchStockImages}
                disabled={searching}
                className="w-full"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find Perfect Image
                  </>
                )}
              </Button>
            </div>

            {stockImages.length > 0 && (
              <div className="space-y-2">
                <Label>Found Images</Label>
                <div className="grid gap-4 max-h-[500px] overflow-y-auto">
                  {stockImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.thumbnailUrl || image.url}
                        alt={image.altText}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2 p-4">
                        <p className="text-white text-sm text-center">
                          Photo by <strong>{image.photographer}</strong>
                        </p>
                        <Button
                          onClick={() => handleUseStockImage(image)}
                          disabled={uploading}
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Use This Image
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Images provided by <a href="https://unsplash.com" target="_blank" rel="noopener" className="underline">Unsplash</a>
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
