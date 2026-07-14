'use client';

import Image from 'next/image';
import { useState } from 'react';

interface MessageAttachmentsProps {
  attachments: string[];
  onImageClick?: (url: string) => void;
}

function isVideo(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url);
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function getFileIcon(url: string) {
  if (url.endsWith('.pdf')) return '📄';
  if (url.endsWith('.doc') || url.endsWith('.docx')) return '📝';
  if (url.endsWith('.xls') || url.endsWith('.xlsx')) return '📊';
  return '📁';
}

function getFileName(url: string) {
  return url.split('/').pop() || 'файл';
}

export default function MessageAttachments({ attachments, onImageClick }: MessageAttachmentsProps) {
  const [videoErrors, setVideoErrors] = useState<Set<number>>(new Set());

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 mt-2 ${attachments.length === 1 ? '' : 'max-w-xs'}`}>
      {attachments.map((url, i) => {
        if (isImage(url)) {
          return (
            <div
              key={i}
              className="relative rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick?.(url)}
            >
              <Image
                src={url}
                alt="Вложение"
                width={300}
                height={200}
                className="object-cover rounded-xl"
                unoptimized
              />
            </div>
          );
        }

        if (isVideo(url)) {
          if (videoErrors.has(i)) {
            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm text-blue-500 hover:underline"
              >
                🎬 Скачать видео
              </a>
            );
          }
          return (
            <video
              key={i}
              src={url}
              controls
              preload="metadata"
              className="rounded-xl max-w-full max-h-64"
              onError={() => setVideoErrors(prev => new Set(prev).add(i))}
            />
          );
        }

        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="text-2xl">{getFileIcon(url)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{getFileName(url)}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
