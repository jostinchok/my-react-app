import React, { useState } from 'react';

const FileManager = ({ t }) => {
  const [selectedCourse, setSelectedCourse] = useState('biodiversity');
  const [uploadFile, setUploadFile] = useState(null);
  const [files, setFiles] = useState([
    { id: 1, name: 'Biodiversity Module 1.pdf', course: 'biodiversity', size: '2.3 MB', uploaded: '2024-01-15' },
    { id: 2, name: 'Training Notes.docx', course: 'biodiversity', size: '145 KB', uploaded: '2024-01-10' },
    { id: 3, name: 'Field Guide Video.mp4', course: 'field-training', size: '15.2 MB', uploaded: '2024-01-08' },
  ]);

  const courses = [
    { value: 'biodiversity', label: t.biodiversity },
    { value: 'field-training', label: t.fieldTraining },
    { value: 'lab-skills', label: t.labSkills },
  ];

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      // Simulate upload
      setTimeout(() => {
        setFiles(prev => [{
          id: Date.now(),
          name: file.name,
          course: selectedCourse,
          size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
          uploaded: new Date().toISOString().slice(0, 10),
        }, ...prev]);
        setUploadFile(null);
        alert(t.fileUploadedSuccess);
      }, 1000);
    }
  };

  const handleDownload = (fileName) => {
    alert(`${t.downloadBtn} ${fileName}... (Demo)`);
    // Real: window.location.href = `/api/download/${fileName}`;
  };

  return (
    <div className="file-manager-page">
      <div className="page-header" style={{marginBottom: '30px'}}>
        <h1 style={{margin: 0, color: 'var(--primary-dark)', fontWeight: '800'}}>{t.trainingFilesTitle} ({t.files})</h1>
        <p style={{margin: '8px 0 0', color: '#636e72'}}>{t.filesSubtitle}</p>
      </div>

      <div className="upload-section">
        <h2>{t.uploadSectionTitle}</h2>
        <div className="upload-form">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="course-select"
          >
            {courses.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,video/*,image/*"
            onChange={handleUpload}
            className="file-input"
          />
{uploadFile && <div>{t.uploadFileStatus} {uploadFile.name}...</div>}
        </div>
      </div>

      <div className="files-grid">
        <h2>{t.yourFilesTitle}</h2>
        {files.map(file => (
          <div key={file.id} className="file-card">
            <div className="file-name">{file.name}</div>
            <div className="file-meta">
              <span>{t.courseLabel}: {file.course}</span>
              <span>{t.sizeLabel}: {file.size}</span>
              <span>{t.uploadedLabel}: {file.uploaded}</span>
            </div>
            <button onClick={() => handleDownload(file.name)} className="download-btn">
              {t.downloadBtn}
            </button>
          </div>
        ))}
      </div>

      {files.length === 0 && (
        <div className="empty-state">
          <p>{t.filesEmpty}</p>
        </div>
      )}
    </div>
  );
};

export default FileManager;

