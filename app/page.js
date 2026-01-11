'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('manual-upload');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  
  const [query, setQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleUpload = async () => {
    if (!text && !file) {
      alert('Please provide text or select a file');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (file) formData.append('file', file);
      if (title) formData.append('title', title);
      if (source) formData.append('source', source);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setUploadResult(data);
        setText('');
        setFile(null);
        setFileName('');
        document.getElementById('file-input').value = '';
      } else {
        setUploadResult({ error: data.error || 'Upload failed' });
      }
    } catch (error) {
      setUploadResult({ error: error.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      alert('Please enter a query');
      return;
    }

    setQuerying(true);
    setQueryResult(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setQueryResult(data);
      } else {
        setQueryResult({ error: data.error || 'Query failed' });
      }
    } catch (error) {
      setQueryResult({ error: error.message || 'Query failed' });
    } finally {
      setQuerying(false);
    }
  };

  const renderAnswerWithCitations = (answer, citations) => {
    if (!answer) return null;

    const parts = answer.split(/(\[\d+\])/g);
    
    return (
      <div className="prose prose-sm max-w-none">
        {parts.map((part, idx) => {
          if (part.match(/^\[\d+\]$/)) {
            const citationNum = parseInt(part.replace(/[\[\]]/g, ''));
            const citation = citations?.find(c => c.chunkIndex === citationNum - 1);
            return (
              <Badge
                key={idx}
                className="mx-0.5 bg-blue-600 text-white hover:bg-blue-700 border-0"
                title={`Citation ${citationNum}${citation ? ` - Chunk ${citation.chunkId}` : ''}`}
              >
                {part}
              </Badge>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-block mb-3 px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-full">
            AI-Powered RAG System
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Mini RAG System
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Upload documents and query with AI-powered retrieval and reranking
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upload Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-slate-900">Upload & Index</CardTitle>
              <CardDescription className="text-slate-600">
                Upload documents or paste text to index in the vector database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Document Title <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="source" className="text-sm font-medium">
                  Source <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., manual-upload"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="text" className="text-sm font-medium">
                  Paste Text
                </label>
                <Textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your text here..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="file-input" className="text-sm font-medium">
                  Or Upload File (.txt or .pdf)
                </label>
                <Input
                  id="file-input"
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {fileName && (
                  <p className="text-sm text-muted-foreground">Selected: {fileName}</p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading || (!text && !file)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {uploading ? 'Uploading & Indexing...' : 'Upload & Index'}
              </Button>

              {uploadResult && (
                <div className={`p-4 rounded-lg border ${
                  uploadResult.error 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  {uploadResult.error ? (
                    <p className="font-medium">{uploadResult.error}</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-semibold text-green-900">✓ Successfully indexed!</p>
                      <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                        <div className="bg-white/60 rounded p-2">
                          <span className="text-slate-600 text-xs block">Chunks</span>
                          <p className="font-bold text-slate-900">{uploadResult.chunkCount}</p>
                        </div>
                        <div className="bg-white/60 rounded p-2">
                          <span className="text-slate-600 text-xs block">Tokens</span>
                          <p className="font-bold text-slate-900">{uploadResult.totalTokens?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/60 rounded p-2">
                          <span className="text-slate-600 text-xs block">Time</span>
                          <p className="font-bold text-slate-900">{uploadResult.processingTimeFormatted}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Query Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-slate-900">Query Documents</CardTitle>
              <CardDescription className="text-slate-600">
                Ask questions about your indexed documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="query" className="text-sm font-medium">
                  Enter your question
                </label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleQuery}
                disabled={querying || !query.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                size="lg"
              >
                {querying ? 'Processing...' : 'Ask Question'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {queryResult && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-slate-900">Query Results</CardTitle>
              <CardDescription className="text-slate-600">
                Generated answer with citations and retrieved chunks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {queryResult.error ? (
                <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
                  <p className="font-medium">{queryResult.error}</p>
                </div>
              ) : (
                <>
                  {/* Final Answer */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-slate-900">Final Answer</h3>
                    <div className="p-6 rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                      <div className="text-slate-800 leading-relaxed">
                        {renderAnswerWithCitations(queryResult.final_answer, queryResult.citations)}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Reranked Chunks */}
                  {queryResult.reranked_chunks && queryResult.reranked_chunks.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-slate-900">
                        Reranked Chunks <Badge className="bg-blue-600 text-white ml-2">{queryResult.reranked_chunks.length}</Badge>
                      </h3>
                      <div className="space-y-4">
                        {queryResult.reranked_chunks.map((chunk, idx) => (
                          <Card key={chunk.id} className="border-l-4 border-l-blue-500 bg-slate-50/50">
                            <CardContent className="pt-5">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className="bg-blue-600 text-white">Chunk {idx + 1}</Badge>
                                  <Badge className="bg-emerald-500 text-white">
                                    Score: {chunk.score.toFixed(4)}
                                  </Badge>
                                </div>
                                <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
                                  {chunk.id}
                                </span>
                              </div>
                              <p className="text-sm mb-4 leading-relaxed text-slate-700 bg-white/60 p-3 rounded-lg">{chunk.text}</p>
                              {chunk.metadata && (
                                <div className="flex flex-wrap gap-3 text-xs text-slate-600 bg-white/40 p-2 rounded">
                                  <span><strong>Title:</strong> {chunk.metadata.title || 'N/A'}</span>
                                  <span>•</span>
                                  <span><strong>Source:</strong> {chunk.metadata.source || 'N/A'}</span>
                                  <span>•</span>
                                  <span><strong>Section:</strong> {chunk.metadata.section || 'N/A'}</span>
                                  {chunk.metadata.tokens && (
                                    <>
                                      <span>•</span>
                                      <span><strong>Tokens:</strong> {chunk.metadata.tokens}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Raw Chunks */}
                  {queryResult.raw_chunks && queryResult.raw_chunks.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-slate-900">
                        Retrieved Chunks <span className="text-slate-600 text-sm font-normal">(Before Reranking)</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {queryResult.raw_chunks.slice(0, 6).map((chunk, idx) => (
                          <Card key={chunk.id} className="bg-slate-50/70 border-slate-200">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-center mb-2">
                                <Badge className="bg-slate-600 text-white">#{idx + 1}</Badge>
                                <Badge className="bg-purple-500 text-white">
                                  {chunk.score.toFixed(4)}
                                </Badge>
                              </div>
                              {chunk.metadata && (
                                <div className="text-xs text-slate-600 space-y-1">
                                  <p className="font-semibold truncate text-slate-900">{chunk.metadata.title || 'N/A'}</p>
                                  <p className="font-mono text-[10px] truncate">{chunk.id}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Metrics */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-slate-900">Processing Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {queryResult.timing_metrics?.formatted && (
                        <>
                          <div className="p-4 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
                            <p className="text-xs text-slate-600 mb-1 font-medium">Total Time</p>
                            <p className="text-xl font-bold text-blue-700">{queryResult.timing_metrics.formatted.total}</p>
                          </div>
                          <div className="p-4 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50">
                            <p className="text-xs text-slate-600 mb-1 font-medium">Embedding</p>
                            <p className="text-xl font-bold text-indigo-700">{queryResult.timing_metrics.formatted.embedding}</p>
                          </div>
                          <div className="p-4 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
                            <p className="text-xs text-slate-600 mb-1 font-medium">Retrieval</p>
                            <p className="text-xl font-bold text-purple-700">{queryResult.timing_metrics.formatted.retrieval}</p>
                          </div>
                          <div className="p-4 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                            <p className="text-xs text-slate-600 mb-1 font-medium">Reranking</p>
                            <p className="text-xl font-bold text-emerald-700">{queryResult.timing_metrics.formatted.reranking}</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {queryResult.token_usage && (
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-4 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
                          <p className="text-xs text-slate-600 mb-1 font-medium">Prompt Tokens</p>
                          <p className="text-lg font-bold text-slate-900">{queryResult.token_usage.promptTokens.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
                          <p className="text-xs text-slate-600 mb-1 font-medium">Completion Tokens</p>
                          <p className="text-lg font-bold text-slate-900">{queryResult.token_usage.completionTokens.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
                          <p className="text-xs text-slate-600 mb-1 font-medium">Total Tokens</p>
                          <p className="text-lg font-bold text-slate-900">{queryResult.token_usage.totalTokens.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {queryResult.cost_estimate && (
                      <div className="p-5 rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
                        <p className="text-sm text-slate-600 mb-1 font-medium">Estimated Cost</p>
                        <p className="text-3xl font-bold text-green-700">{queryResult.cost_estimate.formatted}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-slate-500 mt-10 pt-8 border-t border-slate-200">
          <p className="font-medium">Mini RAG System - Built with Next.js 16, OpenAI, Cohere, and Pinecone</p>
        </footer>
      </div>
    </div>
  );
}
