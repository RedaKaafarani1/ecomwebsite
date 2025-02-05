import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export function SharePopup({ isOpen, onClose, url }: SharePopupProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      // Ensure we have a valid URL
      const shareUrl = new URL(url).toString();
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        // Ensure we have a valid URL
        const shareUrl = new URL(url).toString();
        await navigator.share({
          url: shareUrl,
          title: document.title,
          text: 'Check out this amazing product!'
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (!isOpen) return null;

  // Ensure we have a valid URL to share
  let shareUrl: string;
  try {
    shareUrl = new URL(url).toString();
  } catch (err) {
    shareUrl = window.location.href;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-vitanic-pale-olive">
          <div className="flex items-center gap-2">
            <Share2 className="text-vitanic-olive" size={20} />
            <h2 className="text-lg font-semibold text-vitanic-dark-olive">
              Share Product
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-vitanic-dark-olive/60 hover:text-vitanic-dark-olive transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-vitanic-pale-olive rounded-md bg-vitanic-pale-olive/10 text-vitanic-dark-olive"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}