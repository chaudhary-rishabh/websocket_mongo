'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreateStory } from '@/hooks/queries'

interface AddStoryModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddStoryModal({ onClose, onSuccess }: AddStoryModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const createStory = useCreateStory()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = () => {
    if (!file) { setError('Please select an image.'); return }
    setError('')
    createStory.mutate({ file, caption: caption.trim() || undefined }, {
      onSuccess: () => {
        onSuccess()
        onClose()
      },
      onError: (err) => setError(err.message),
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        key="add-story-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />
      <motion.div
        key="add-story-modal"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md bg-white shadow-2xl overflow-hidden"
          style={{ borderRadius: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-3">
            <h2 className="text-lg font-bold text-[#1F2937]">Add to Story</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#DBEAFE] text-[#6B7280] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* File upload / preview */}
            {preview ? (
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#EFF6FF]">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 aspect-[9/16] rounded-2xl bg-[#EFF6FF] border-2 border-dashed border-[#BFDBFE] hover:border-[#2563EB] hover:bg-[#DBEAFE] transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#2563EB]" />
                </div>
                <p className="text-sm font-medium text-[#2563EB]">Tap to upload image</p>
                <p className="text-xs text-[#6B7280]">JPEG, PNG, WebP or GIF</p>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Caption */}
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              placeholder="Add a caption… (optional)"
              className="bg-[#EFF6FF] border border-[#BFDBFE] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-2xl px-4 py-3 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none transition-all"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={createStory.isPending || !file}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {createStory.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createStory.isPending ? 'Sharing…' : 'Share to Story'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
