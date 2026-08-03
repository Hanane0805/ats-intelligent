'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, X, Loader2, File, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  errorMsg?: string;
  candidateName?: string;
  texteBrut?: string;
  nombreChunks?: number;
}

export default function AnalysisPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const processUpload = async (fileObj: File, fileId: string) => {
    try {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processing', progress: 50 } : f));
      
      const response = await api.uploadAndAnalyzeCV(fileObj);
      
      setFiles(prev => prev.map(f => f.id === fileId ? { 
        ...f, 
        status: 'completed', 
        progress: 100,
        candidateName: response.candidatNom,
        texteBrut: response.texteBrut,
        nombreChunks: response.nombreChunks
      } : f));

    } catch (err: any) {
      setFiles(prev => prev.map(f => f.id === fileId ? { 
        ...f, 
        status: 'error', 
        progress: 100, 
        errorMsg: err.message || 'Error processing file'
      } : f));
    }
  };

  const handleFilesAdded = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf') || f.name.endsWith('.doc') || f.name.endsWith('.docx'));
    
    if (validFiles.length !== newFiles.length) {
      alert("Some files were skipped because they are not PDF, DOC, or DOCX formats.");
    }

    const newUploads = validFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      size: formatSize(f.size),
      status: 'pending' as const,
      progress: 0,
      originalFile: f
    }));

    setFiles(prev => [...newUploads, ...prev]);

    // Start processing them
    newUploads.forEach(upload => {
      processUpload(upload.originalFile, upload.id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full pb-10">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk CV Upload</h1>
          <p className="text-sm text-gray-500 mt-1">Upload multiple CVs and analyze them with AI</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> AI Extraction Ready
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <input 
          type="file" 
          multiple 
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) handleFilesAdded(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
            ${isDragging ? 'border-[#1e3a8a] bg-blue-50/50' : 'border-gray-200 hover:border-[#1e3a8a] hover:bg-blue-50/30'}
          `}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform 
            ${isDragging ? 'bg-[#1e3a8a] text-white scale-110' : 'bg-blue-50 text-[#1e3a8a] group-hover:scale-110'}`}>
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Drop CV files here</h3>
          <p className="text-sm text-gray-500 mb-6">Supports PDF, DOC, DOCX - Max 10MB per file</p>
          <button type="button" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <FileText className="w-4 h-4" /> Browse Files
          </button>
        </div>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-900 text-sm">
              Uploaded Files <span className="text-gray-400 font-medium ml-1">({files.length})</span>
            </h3>
            <span className="text-xs font-medium text-gray-500">
              {files.filter(f => f.status === 'completed').length} of {files.length} processed
            </span>
          </div>
          
          <div className="p-4 flex flex-col gap-3">
            {files.map((file) => (
              <div key={file.id} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors
                ${file.status === 'error' ? 'border-rose-100 bg-rose-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}
              `}>
                
                {/* File Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 
                  ${file.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                    file.status === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                  {file.status === 'error' ? <AlertCircle className="w-5 h-5" /> : <File className="w-5 h-5" />}
                </div>
                
                {/* File Info & Progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm font-bold text-gray-900 truncate pr-4">
                      {file.name} 
                      {file.candidateName && <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">→ {file.candidateName}</span>}
                    </p>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-400">{file.size}</span>
                      {file.status === 'completed' && (
                        <button 
                          onClick={() => setSelectedFile(file)}
                          className="px-3 py-1 bg-[#1e3a8a] text-white text-xs rounded hover:bg-[#1e3a8a]/90 transition-colors"
                        >
                          View Analysis
                        </button>
                      )}
                      {file.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {file.status === 'processing' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                      {file.status === 'error' && <span className="text-xs font-bold text-rose-500">Failed</span>}
                    </div>
                  </div>
                  
                  {/* Progress Bar or Error Msg */}
                  {file.status === 'error' ? (
                    <p className="text-xs font-medium text-rose-500 truncate">{file.errorMsg}</p>
                  ) : (
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${file.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                {/* Delete Button */}
                <button onClick={() => removeFile(file.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0 ml-2">
                  <X className="w-4 h-4" />
                </button>

              </div>
            ))}
          </div>
        </div>
      )}
      {/* RAG Analysis Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="bg-[#1e3a8a]/10 text-[#1e3a8a] p-2 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedFile.candidateName || 'Unknown Candidate'}</h2>
                  <p className="text-xs text-gray-500">{selectedFile.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* RAG Info Card */}
              <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-emerald-900 font-bold text-sm">Extraction RAG (Ollama Llama 3)</h4>
                  <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
                    Ce CV a été découpé et indexé mathématiquement dans PostgreSQL (pgvector).
                    <strong> {selectedFile.nombreChunks || 0} morceaux (chunks)</strong> ont été générés.
                    Lors de l'analyse, seuls les morceaux les plus pertinents ont été envoyés à l'IA locale pour économiser la mémoire et améliorer la précision !
                  </p>
                </div>
              </div>

              {/* Raw Text Extract */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex justify-between">
                  <span>Texte brut extrait du CV (Contexte IA)</span>
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {selectedFile.texteBrut?.length || 0} caractères
                  </span>
                </h4>
                <div className="bg-gray-900 rounded-xl p-4 overflow-y-auto max-h-[300px] border border-gray-200 shadow-inner custom-scrollbar">
                  <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedFile.texteBrut || 'Aucun texte extrait.'}
                  </pre>
                </div>
              </div>
              
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedFile(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
              >
                Fermer l'analyse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
