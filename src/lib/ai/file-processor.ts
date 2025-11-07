/**
 * File processing utilities for AI chat
 * Handles PDF, Excel, Word, and image files
 */

import { createOpenRouterClient } from './openrouter'

export interface FileProcessingResult {
  success: boolean
  fileType: 'pdf' | 'excel' | 'word' | 'image'
  extractedText?: string
  extractedData?: any
  previewUrl?: string
  error?: string
  needsVision?: boolean // Whether to use vision model for this file
}

export class FileProcessor {
  private openRouterClient = createOpenRouterClient()

  /**
   * Process a file based on its type
   */
  async processFile(
    file: File | Buffer,
    fileName: string,
    mimeType: string
  ): Promise<FileProcessingResult> {
    const fileType = this.detectFileType(fileName, mimeType)

    switch (fileType) {
      case 'pdf':
        return this.processPDF(file, fileName)
      case 'excel':
        return this.processExcel(file, fileName)
      case 'word':
        return this.processWord(file, fileName)
      case 'image':
        return this.processImage(file, fileName)
      default:
        return {
          success: false,
          fileType: 'pdf',
          error: 'Unsupported file type'
        }
    }
  }

  /**
   * Detect file type from filename and mime type
   */
  private detectFileType(
    fileName: string,
    mimeType: string
  ): 'pdf' | 'excel' | 'word' | 'image' | 'unknown' {
    const ext = fileName.toLowerCase().split('.').pop()

    // PDF
    if (ext === 'pdf' || mimeType.includes('pdf')) {
      return 'pdf'
    }

    // Excel
    if (
      ['xls', 'xlsx', 'csv'].includes(ext || '') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('excel')
    ) {
      return 'excel'
    }

    // Word
    if (
      ['doc', 'docx'].includes(ext || '') ||
      mimeType.includes('document') ||
      mimeType.includes('word')
    ) {
      return 'word'
    }

    // Images
    if (
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '') ||
      mimeType.startsWith('image/')
    ) {
      return 'image'
    }

    return 'unknown'
  }

  /**
   * Process PDF file
   * For PDFs, we'll use vision model to extract content since it's more reliable
   */
  private async processPDF(
    file: File | Buffer,
    fileName: string
  ): Promise<FileProcessingResult> {
    try {
      // Convert to base64 for vision model
      const buffer = file instanceof File ? await file.arrayBuffer() : file
      const base64 = Buffer.from(buffer).toString('base64')
      const dataUrl = `data:application/pdf;base64,${base64}`

      // Note: PDF support via vision models varies
      // For now, we'll mark it as needing vision and let the API handle it
      return {
        success: true,
        fileType: 'pdf',
        needsVision: true,
        previewUrl: dataUrl,
        extractedText: `[PDF Document: ${fileName}]`
      }
    } catch (error: any) {
      return {
        success: false,
        fileType: 'pdf',
        error: error.message
      }
    }
  }

  /**
   * Process Excel file
   * Extract data but don't show in chat, pass to model
   */
  private async processExcel(
    file: File | Buffer,
    fileName: string
  ): Promise<FileProcessingResult> {
    try {
      // We'll do server-side processing with xlsx library
      // For now, mark as needing processing
      return {
        success: true,
        fileType: 'excel',
        extractedText: `[Excel file: ${fileName}. Data will be processed and passed to the AI.]`,
        extractedData: {
          fileName,
          note: 'Excel data extraction will be done server-side with xlsx library'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        fileType: 'excel',
        error: error.message
      }
    }
  }

  /**
   * Process Word document
   * Extract text and create preview
   */
  private async processWord(
    file: File | Buffer,
    fileName: string
  ): Promise<FileProcessingResult> {
    try {
      // Similar to PDF, we can use vision model or text extraction
      // For now, mark as needing processing
      return {
        success: true,
        fileType: 'word',
        needsVision: true,
        extractedText: `[Word Document: ${fileName}]`
      }
    } catch (error: any) {
      return {
        success: false,
        fileType: 'word',
        error: error.message
      }
    }
  }

  /**
   * Process image file
   * Convert to base64 for vision model
   */
  private async processImage(
    file: File | Buffer,
    fileName: string
  ): Promise<FileProcessingResult> {
    try {
      const buffer = file instanceof File ? await file.arrayBuffer() : file
      const base64 = Buffer.from(buffer).toString('base64')

      // Detect mime type
      let mimeType = 'image/png'
      if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (fileName.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif'
      } else if (fileName.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp'
      }

      const dataUrl = `data:${mimeType};base64,${base64}`

      return {
        success: true,
        fileType: 'image',
        needsVision: true,
        previewUrl: dataUrl,
        extractedText: `[Image: ${fileName}]`
      }
    } catch (error: any) {
      return {
        success: false,
        fileType: 'image',
        error: error.message
      }
    }
  }

  /**
   * Extract data from image using vision model
   */
  async extractFromImageWithVision(
    imageDataUrl: string,
    extractionType: 'general' | 'document' | 'chart' = 'general'
  ): Promise<string> {
    const prompts = {
      general: 'Describe this image in detail. Extract any visible text, numbers, or data.',
      document: 'Extract all text from this document image. Maintain formatting and structure.',
      chart: 'Analyze this chart or graph. Describe the data, trends, and key insights.'
    }

    const response = await this.openRouterClient.extractFromImage(
      imageDataUrl,
      prompts[extractionType]
    )

    return response.choices[0]?.message?.content || ''
  }
}

// Export singleton instance
export const fileProcessor = new FileProcessor()

// Helper function to convert File to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

// Helper to get file mime type
export function getFileMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',

    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',

    // Others
    txt: 'text/plain',
    json: 'application/json',
  }

  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// Validate file size and type
export function validateFile(
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = ['pdf', 'xls', 'xlsx', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp']
): { valid: boolean; error?: string } {
  const ext = file.name.toLowerCase().split('.').pop()

  // Check file type
  if (!ext || !allowedTypes.includes(ext)) {
    return {
      valid: false,
      error: `File type .${ext} not supported. Allowed: ${allowedTypes.join(', ')}`
    }
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size ${sizeMB.toFixed(1)}MB exceeds limit of ${maxSizeMB}MB`
    }
  }

  return { valid: true }
}
