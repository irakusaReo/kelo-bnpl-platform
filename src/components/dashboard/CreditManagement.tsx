'use client'

import { useUser } from '@/contexts/UserContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, UploadCloud, FileText } from 'lucide-react'
import { useEffect, useState, ChangeEvent } from 'react'

// Define types for our data
type UserDocument = {
  id: string;
  file_path: string;
  document_type: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
};

export function CreditManagement() {
  const { user, profile, supabase, isLoading: isUserLoading } = useUser()
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // States for the upload form
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<string>('')
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchDocuments = async () => {
    if (!user || !supabase) return;

    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
    } else {
      setDocuments(data as UserDocument[]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchDocuments();
      setIsLoading(false);
    }
    if (user) {
      loadData();
    }
  }, [user, supabase]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !user || !supabase) {
        setUploadMessage({ type: 'error', text: 'Please select a file and document type.' });
        return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    // 1. Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filePath, selectedFile);

    if (uploadError) {
      setUploadMessage({ type: 'error', text: `Upload failed: ${uploadError.message}` });
      setIsUploading(false);
      return;
    }

    // 2. Insert record into the database
    const { error: dbError } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        file_path: filePath,
        document_type: documentType,
        status: 'pending',
      });

    if (dbError) {
      setUploadMessage({ type: 'error', text: `Failed to record document: ${dbError.message}` });
    } else {
      setUploadMessage({ type: 'success', text: 'Document uploaded successfully! It is now pending review.' });
      // Reset form and refresh document list
      setSelectedFile(null);
      setDocumentType('');
      await fetchDocuments();
    }

    setIsUploading(false);
  };

  const getStatusVariant = (status: UserDocument['status']) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
    }
  }


  if (isUserLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Credit Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Kelo Credit Score</CardTitle>
          <CardDescription>Your score is calculated based on your financial history and documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold text-center p-8">
            {profile?.kelo_credit_score ?? <span className="text-2xl text-muted-foreground">Not Calculated</span>}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>Improve your credit score by providing financial documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={setDocumentType} value={documentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mpesa_statement">M-Pesa Statement</SelectItem>
              <SelectItem value="bank_statement">Bank Statement</SelectItem>
              <SelectItem value="payslip">Payslip</SelectItem>
            </SelectContent>
          </Select>
          <Input type="file" onChange={handleFileChange} />
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !documentType}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Upload Document
          </Button>
          {uploadMessage && (
            <div className={`mt-2 text-sm font-medium ${uploadMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {uploadMessage.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>Here is a list of documents you have uploaded.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : documents.length === 0 ? (
            <p className="text-center text-muted-foreground">You have not uploaded any documents.</p>
          ) : (
            <ul className="space-y-3">
              {documents.map(doc => (
                <li key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                   <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">{doc.document_type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">Uploaded on {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(doc.status)} className="capitalize">{doc.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
