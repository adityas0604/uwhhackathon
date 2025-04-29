import React, { useState } from 'react';
import axios from 'axios';

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setMessage('');

      const response = await axios.post('/api/po/upload', formData);

      setMessage(
        `✅ ${response.data.originalFilename || 'File'} uploaded successfully!`
      );
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('❌ Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Nav Bar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Document Processor</h1>
        <div className="space-x-6">
          <a href="/" className="text-blue-600 font-medium">Upload</a>
          <a href="/progress" className="text-gray-600 hover:text-blue-600">Progress</a>
          <a href="/verification" className="text-gray-600 hover:text-blue-600">Verification</a>
        </div>
      </nav>

      {/* Upload Area */}
      <main className="flex flex-col items-center justify-center mt-20">
        <label htmlFor="fileUpload">
          <div
            className={`w-40 h-40 border-4 border-dashed border-gray-400 flex items-center justify-center rounded-xl cursor-pointer bg-white hover:border-blue-600 transition duration-200 ${uploading ? 'blur-sm pointer-events-none' : ''}`}
          >
            <span className="text-5xl text-blue-500 font-light">+</span>
          </div>
        </label>
        <input
          id="fileUpload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading && <p className="mt-4 text-blue-500">Uploading...</p>}
        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      </main>
    </div>
  );
}
