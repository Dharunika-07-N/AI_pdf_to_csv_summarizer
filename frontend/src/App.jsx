
import React, { useState } from 'react';
import { FileText, Upload, Sparkles, Download, CheckCircle, AlertCircle } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processed, error
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileId, setFileId] = useState(null);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnInput, setColumnInput] = useState('');

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setErrorMessage('Please upload a PDF file.');
      setStatus('error');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds 50MB limit.');
      setStatus('error');
      return;
    }
    setFile(selectedFile);
    setErrorMessage('');
    uploadFile(selectedFile);
  };

  const uploadFile = async (currentFile) => {
    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', currentFile);

    try {
      const response = await fetch('http://localhost:8001/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setFileId(data.file_id);
      setDownloadUrl(`http://localhost:8001/download/${data.file_id}`);
      setAvailableColumns(data.available_columns || []);
      setStatus('processed');
    } catch (error) {
      console.error('Error uploading file:', error);
      setStatus('error');
      setErrorMessage('Failed to upload/process file. Please try again.');
    }
  };

  const toggleColumn = (col) => {
    setSelectedColumns((prev) => {
      if (prev.includes(col)) return prev.filter((c) => c !== col);
      return [...prev, col];
    });
  };

  const addColumn = () => {
    const col = columnInput && columnInput.trim();
    if (!col) return;
    setSelectedColumns((prev) => prev.includes(col) ? prev : [...prev, col]);
    setColumnInput('');
  };

  const generateCSV = async () => {
    if (!fileId || selectedColumns.length === 0) {
      setErrorMessage('Select at least one column to generate CSV.');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    try {
      const resp = await fetch('http://localhost:8001/generate_csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, columns: selectedColumns })
      });

      if (!resp.ok) throw new Error('Generation failed');
      const d = await resp.json();
      setDownloadUrl(`http://localhost:8001/download_filtered/${fileId}`);
      setStatus('processed');
      setErrorMessage('');
    } catch (e) {
      console.error(e);
      setErrorMessage('Failed to generate filtered CSV.');
      setStatus('error');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setStatus('idle');
    setDownloadUrl(null);
    setErrorMessage('');
    setFileId(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-1.5 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">PDF2CSV</span>
        </div>
        <div className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          AI Powered
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto mt-20 px-4 text-center">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Transform PDFs to <span className="text-purple-600">Clean CSV</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-16 leading-relaxed">
          AI-powered extraction that understands tables, forms, and structured data.
          Upload your PDF and get perfectly formatted CSV in seconds.
        </p>

        {/* Upload Area */}
        <div
          className="max-w-xl mx-auto border-2 border-dashed border-purple-200 rounded-3xl p-12 bg-purple-50/30 hover:bg-purple-50 transition-colors cursor-pointer relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => status === 'idle' || status === 'error' ? document.getElementById('fileInput').click() : null}
        >
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".pdf"
            onChange={handleFileSelect}
          />

          <div className="flex flex-col items-center justify-center gap-4">
            {status === 'idle' || status === 'error' ? (
              <>
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Upload your PDF</h3>
                <p className="text-slate-500">Drag and drop or click to browse</p>
                <p className="text-xs text-slate-400 mt-2">Maximum file size: 50MB</p>
              </>
            ) : status === 'uploading' ? (
              <>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center animate-pulse mb-4">
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Processing...</h3>
                <p className="text-slate-500">Extracting data with AI</p>
              </>
            ) : status === 'processed' ? (
              <>
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Done!</h3>
                <p className="text-slate-500 mb-4">{file?.name} converted successfully.</p>
                {/* Allow user to type column names one-by-one and add them to the list */}
                <div className="mb-4 text-left">
                  <p className="font-medium mb-2">Type the column names you want included in the CSV (one at a time):</p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={columnInput}
                      onChange={(e) => setColumnInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColumn(); } }}
                      placeholder={availableColumns.length > 0 ? `e.g. ${availableColumns.join(', ')}` : 'e.g. Title'}
                      className="px-4 py-2 border rounded-md flex-1"
                    />
                    <button onClick={(e) => { e.stopPropagation(); addColumn(); }} className="bg-slate-900 text-white px-4 py-2 rounded-md">Add</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedColumns([]); setColumnInput(''); }} className="bg-gray-100 px-4 py-2 rounded-md">Clear</button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedColumns.length > 0 ? selectedColumns.map(col => (
                      <div key={col} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-md flex items-center gap-2">
                        <span>{col}</span>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedColumns(prev => prev.filter(c => c !== col)); }} className="text-sm text-red-500">✕</button>
                      </div>
                    )) : <div className="text-sm text-slate-500">No columns added yet.</div>}
                  </div>

                  <div className="mt-3 flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); generateCSV(); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold">Generate CSV</button>
                    <a href={downloadUrl} download className="bg-gray-100 text-slate-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Download className="w-4 h-4" />
                      Download Original CSV
                    </a>
                    <button onClick={(e) => { e.stopPropagation(); resetUpload(); }} className="bg-purple-100 text-purple-600 px-6 py-3 rounded-xl font-semibold">Upload Another</button>
                  </div>
                </div>
              </>
            ) : null}

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
