import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white/90 ${className}`}
        aria-label={alt}
      >
        <Leaf className="h-8 w-8 opacity-80" />
        {fallbackLabel && <span className="mt-2 text-xs font-medium opacity-85">{fallbackLabel}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
