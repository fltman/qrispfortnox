import { useCallback } from 'react'

interface PDFUploaderProps {
  onFilesUpload: (files: File[]) => void
}

export default function PDFUploader({ onFilesUpload }: PDFUploaderProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      const pdfFiles = files.filter(file => file.type === 'application/pdf')

      if (pdfFiles.length > 0) {
        onFilesUpload(pdfFiles)
      } else {
        alert('Vänligen ladda upp PDF-filer')
      }
    },
    [onFilesUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
      if (fileList && fileList.length > 0) {
        const files = Array.from(fileList)
        const pdfFiles = files.filter(file => file.type === 'application/pdf')

        if (pdfFiles.length > 0) {
          onFilesUpload(pdfFiles)
        } else {
          alert('Vänligen ladda upp PDF-filer')
        }
      }
      // Reset input so same file can be uploaded again
      e.target.value = ''
    },
    [onFilesUpload]
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-white"
      >
        <input
          type="file"
          id="pdf-upload"
          accept="application/pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="pdf-upload" className="cursor-pointer">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-4 text-lg text-gray-700">
            Dra och släpp PDF-filer här
          </p>
          <p className="mt-2 text-sm text-gray-500">
            eller klicka för att välja flera filer
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Stöd för flera PDF:er samtidigt
          </p>
        </label>
      </div>
    </div>
  )
}
