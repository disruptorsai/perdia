import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('knowledge_base_documents')
        .select('*')
        .eq('user_id', user.id);

      if (data) {
        setDocuments(data);
      } else {
        console.error('Error fetching documents:', error);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const filePath = `${user.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: 'Error',
          description: `Failed to upload file: ${uploadError.message}`,
          variant: 'destructive',
        });
      } else {
        // Get public URL using the updated API
        const { data: urlData } = supabase.storage
          .from('knowledge-base')
          .getPublicUrl(filePath);

        const publicURL = urlData.publicUrl;

        const { error: dbError } = await supabase
          .from('knowledge_base_documents')
          .insert({
            user_id: user.id,
            title: file.name,
            file_name: file.name,
            file_url: publicURL,
            file_type: file.type,
            file_size: file.size,
          });

        if (dbError) {
          toast({
            title: 'Error',
            description: `Failed to save document record: ${dbError.message}`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: 'File uploaded successfully.',
          });
          fetchDocuments();
        }
      }
    }
    setLoading(false);
    setFile(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Knowledge Base</h2>
      <div className="flex items-center space-x-2 mb-4">
        <Input type="file" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={!file || loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.file_name}</TableCell>
              <TableCell>{doc.file_type}</TableCell>
              <TableCell>{(doc.file_size / 1024).toFixed(2)} KB</TableCell>
              <TableCell>{new Date(doc.created_date).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default KnowledgeBase;