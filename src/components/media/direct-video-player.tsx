'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

export function DirectVideoPlayer({ title, url, provider }: { title: string; url: string; provider: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="watch-placeholder"><Play size={38} /><h2>Video gagal dimuat</h2><p>Server {provider} menolak atau tidak mengirim video.</p></div>;
  return <video src={url} controls playsInline preload="metadata" aria-label={title} onError={() => setFailed(true)} />;
}
