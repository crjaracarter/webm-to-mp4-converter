'use client'

import { useState, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export default function Home() {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFfmpeg = async () => {
      const ffmpegInstance = new FFmpeg()
      
      ffmpegInstance.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100))
      })

      await ffmpegInstance.load({
        coreURL: await toBlobURL('/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL('/ffmpeg-core.wasm', 'application/wasm')
      })

      setFfmpeg(ffmpegInstance)
    }

    loadFfmpeg()
  }, [])

  const convertToMP4 = async () => {
    if (!ffmpeg || !file) return

    try {
      setConverting(true)
      setError(null)

      // Escribir el archivo de entrada
      await ffmpeg.writeFile('input.webm', await fetchFile(file))

      // Ejecutar la conversión
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'copy',
        'output.mp4'
      ])

      // Leer el archivo convertido
      const data = await ffmpeg.readFile('output.mp4')
      const blob = new Blob([data], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)

      // Crear enlace de descarga
      const a = document.createElement('a')
      a.href = url
      a.download = file.name.replace('.webm', '.mp4')
      a.click()

      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error durante la conversión: ' + err.message)
    } finally {
      setConverting(false)
      setProgress(0)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">
          Convertidor WebM a MP4
        </h1>

        <div className="space-y-4">
          <input
            type="file"
            accept=".webm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border rounded p-2"
          />

          <button
            onClick={convertToMP4}
            disabled={!file || converting || !ffmpeg}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {converting ? 'Convirtiendo...' : 'Convertir a MP4'}
          </button>

          {converting && (
            <div className="w-full bg-gray-200 rounded">
              <div
                className="bg-blue-500 text-white text-center p-1 rounded"
                style={{ width: `${progress}%` }}
              >
                {progress}%
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}