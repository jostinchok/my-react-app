import React, { useMemo, useRef, useState } from 'react'
import { deleteCourseFile, uploadCourseFile } from '../services/databaseFrames'

const USER_API_BASE_URL = import.meta.env.VITE_USER_API_BASE_URL || ''

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('Unable to read file.'))
    reader.readAsDataURL(file)
  })

const FileManager = ({
  files = [],
  modules = [],
  userId,
  onFileUploaded,
  onFileDeleted,
  onError,
}) => {
  const fileInputRef = useRef(null)
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '')
  const [uploadingFileName, setUploadingFileName] = useState('')
  const [deletingFileId, setDeletingFileId] = useState('')

  const courseOptions = useMemo(
    () => modules.map((module) => ({
      value: String(module.id),
      label: module.title,
    })),
    [modules]
  )

  const selectedModule = modules.find((module) => String(module.id) === String(selectedModuleId))
  const resolveDownloadUrl = (url) => {
    if (!url) return '#'
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${USER_API_BASE_URL}${url}`
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingFileName(file.name)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const savedFile = await uploadCourseFile({
        userId,
        moduleId: selectedModule?.id || null,
        course: selectedModule?.title || 'Saved Resources',
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        dataUrl,
      })
      onFileUploaded?.(savedFile)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      onError?.(error.message)
    } finally {
      setUploadingFileName('')
    }
  }

  const handleDelete = async (fileId) => {
    const confirmed = window.confirm('Delete this uploaded course file?')
    if (!confirmed) return

    setDeletingFileId(fileId)
    try {
      await deleteCourseFile({ userId, fileId })
      onFileDeleted?.(fileId)
    } catch (error) {
      onError?.(error.message)
    } finally {
      setDeletingFileId('')
    }
  }

  return (
    <section className="page-stack">
      <div className="file-manager-page">
        <div className="file-manager-header">
          <span className="kicker">Training files</span>
          <h2>Course uploads and downloads</h2>
          <p>Save park-guide course files by module, then download them again from this page.</p>
        </div>

        <div className="upload-section">
          <h3>Upload new file</h3>
          <div className="upload-form">
            <label>
              Course
              <select
                value={selectedModuleId}
                onChange={(event) => setSelectedModuleId(event.target.value)}
                disabled={courseOptions.length === 0}
              >
                {courseOptions.length === 0 ? (
                  <option value="">No database modules loaded</option>
                ) : (
                  courseOptions.map((course) => (
                    <option key={course.value} value={course.value}>{course.label}</option>
                  ))
                )}
              </select>
            </label>
            <label className="file-upload-control">
              Choose file
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,video/*,image/*"
                onChange={handleUpload}
              />
            </label>
          </div>
          {uploadingFileName && <p className="uploading-status">Uploading {uploadingFileName}...</p>}
        </div>

        <div className="files-section">
          <h3>Your files ({files.length})</h3>
          {files.length === 0 ? (
            <div className="empty-frame">
              <strong>No files yet</strong>
              <p>Upload your first course file after the modules endpoint is loaded.</p>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <article key={file.id} className="file-card">
                  <div>
                    <strong>{file.name}</strong>
                    <span>{file.course}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Size</dt>
                      <dd>{file.size || `${Math.round((file.sizeBytes || 0) / 1024)} KB`}</dd>
                    </div>
                    <div>
                      <dt>Uploaded</dt>
                      <dd>{file.uploaded || '-'}</dd>
                    </div>
                  </dl>
                  <div className="file-card-actions">
                    <a href={resolveDownloadUrl(file.url)} download={file.name}>Download</a>
                    <button
                      type="button"
                      className="danger-button"
                      disabled={deletingFileId === file.id}
                      onClick={() => handleDelete(file.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default FileManager
