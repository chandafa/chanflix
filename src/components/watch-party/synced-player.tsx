'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractYouTubeId } from '@/lib/video-source';
import { updateVideoProgress } from '@/lib/rooms';
import type { Room } from '@/lib/rooms';

interface YTPlayer {
  playVideo(): void; pauseVideo(): void; seekTo(time: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number; getDuration(): number; getPlayerState(): number; destroy(): void;
}
interface YTApi { Player: new (element: HTMLElement, options: { videoId: string; playerVars: Record<string, number>; events: { onReady: () => void; onStateChange: (event: { data: number }) => void } }) => YTPlayer }
type YouTubeWindow = Window & { YT?: YTApi; onYouTubeIframeAPIReady?: () => void };

function targetTime(room: Room) {
  return room.currentTime + (room.isPlaying ? Math.min(30, Math.max(0, (Date.now() - room.updatedAt) / 1000)) : 0);
}

// Auto-resume from saved progress
function autoResumeFromProgress(room: Room, player: YTPlayer | HTMLVideoElement | null, isHost: boolean): void {
  if (!player || !isHost || room.videoProgress < 5) return;
  
  let duration = 0;
  if ('getDuration' in player) {
    duration = player.getDuration();
  } else if ('duration' in player) {
    duration = player.duration;
  }
  
  if (duration === 0 || isNaN(duration)) return;
  
  // Resume if watched more than 5% but less than 95%
  if (room.videoProgress > 5 && room.videoProgress < 95) {
    const savedTime = duration * (room.videoProgress / 100);
    if ('seekTo' in player) {
      player.seekTo(savedTime, true);
    } else if ('currentTime' in player) {
      player.currentTime = savedTime;
    }
  }
}

export function SyncedPlayer({ room, isHost, onPlayback }: { room: Room; isHost: boolean; onPlayback: (playing: boolean, time: number) => void }) {
  const isEmbed = room.videoType === 'embed';
  const youtubeId = room.videoType === 'youtube' ? extractYouTubeId(room.videoUrl) : null;
  const mountRef = useRef<HTMLDivElement>(null);
  const ytRef = useRef<YTPlayer | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef(room);
  const playbackRef = useRef(onPlayback);
  const [ready, setReady] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { playbackRef.current = onPlayback; }, [onPlayback]);

  useEffect(() => {
    if (!youtubeId || !mountRef.current) return;
    let disposed = false;
    const win = window as YouTubeWindow;
    const mount = () => {
      if (disposed || !mountRef.current || !win.YT) return;
      ytRef.current = new win.YT.Player(mountRef.current, {
        videoId: youtubeId,
        playerVars: { controls: isHost ? 1 : 0, rel: 0, playsinline: 1, disablekb: isHost ? 0 : 1 },
        events: {
          onReady: () => { if (!disposed) { setReady(true); if (!isHost) setNeedsGesture(true); } },
          onStateChange: event => {
            if (isHost && (event.data === 1 || event.data === 2 || event.data === 0)) playbackRef.current(event.data === 1, ytRef.current?.getCurrentTime() || 0);
          },
        },
      });
    };
    if (win.YT?.Player) mount();
    else {
      const previous = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => { previous?.(); mount(); };
      if (!document.querySelector('script[data-youtube-api]')) {
        const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api'; script.dataset.youtubeApi = 'true'; document.head.appendChild(script);
      }
    }
    return () => { disposed = true; ytRef.current?.destroy(); ytRef.current = null; setReady(false); };
  }, [youtubeId, isHost]);

  useEffect(() => {
    if (!isHost || !ready) return;
    const timer = window.setInterval(() => {
      const player = ytRef.current;
      if (player?.getPlayerState() === 1) playbackRef.current(true, player.getCurrentTime());
    }, 8000);
    return () => window.clearInterval(timer);
  }, [isHost, ready]);

  useEffect(() => {
    const sync = () => {
      const currentRoom = roomRef.current;
      const time = targetTime(currentRoom);
      
      if (ytRef.current && ready) {
        // Auto-resume from progress for host on first load
        if (isHost && roomRef.current.videoProgress > 5 && roomRef.current.videoProgress < 95) {
          const duration = ytRef.current.getDuration();
          if (duration > 0 && !isNaN(duration)) {
            const savedTime = duration * (roomRef.current.videoProgress / 100);
            if (Math.abs(ytRef.current.getCurrentTime() - savedTime) > 10) {
              ytRef.current.seekTo(savedTime, true);
            }
          }
        }
        
        if (Math.abs(ytRef.current.getCurrentTime() - time) > 2.5) ytRef.current.seekTo(time, true);
        if (currentRoom.isPlaying && !needsGesture) ytRef.current.playVideo();
        if (!currentRoom.isPlaying) ytRef.current.pauseVideo();
        
        // Save progress periodically for host
        if (isHost && currentRoom.isPlaying) {
          const currentTime = ytRef.current.getCurrentTime();
          const duration = ytRef.current.getDuration();
          if (currentTime > 0 && duration > 0 && !isNaN(duration)) {
            // Debounce progress save
            if (Date.now() - currentRoom.updatedAt > 5000) {
              updateVideoProgress(room.id, currentTime, duration).catch(() => {});
            }
          }
        }
      }
      
      if (videoRef.current) {
        // Auto-resume from progress for host on first load
        if (isHost && roomRef.current.videoProgress > 5 && roomRef.current.videoProgress < 95) {
          const duration = videoRef.current.duration;
          if (duration > 0 && !isNaN(duration)) {
            const savedTime = duration * (roomRef.current.videoProgress / 100);
            if (Math.abs(videoRef.current.currentTime - savedTime) > 10) {
              videoRef.current.currentTime = savedTime;
            }
          }
        }
        
        if (Math.abs(videoRef.current.currentTime - time) > 2.5) videoRef.current.currentTime = time;
        if (currentRoom.isPlaying && !needsGesture) void videoRef.current.play().catch(() => setNeedsGesture(true));
        if (!currentRoom.isPlaying) videoRef.current.pause();
        
        // Save progress periodically for host
        if (isHost && currentRoom.isPlaying && videoRef.current.duration > 0) {
          if (Date.now() - currentRoom.updatedAt > 5000) {
            updateVideoProgress(room.id, videoRef.current.currentTime, videoRef.current.duration).catch(() => {});
          }
        }
      }
    };
    sync();
    const timer = window.setInterval(sync, 2500);
    return () => window.clearInterval(timer);
  }, [isHost, ready, needsGesture, room.updatedAt, room.isPlaying, room.currentTime, room.id]);

  function startViewer() {
    setNeedsGesture(false);
    const time = targetTime(roomRef.current);
    if (ytRef.current) { ytRef.current.seekTo(time, true); if (roomRef.current.isPlaying) ytRef.current.playVideo(); }
    if (videoRef.current) { videoRef.current.currentTime = time; if (roomRef.current.isPlaying) void videoRef.current.play(); }
  }

  return <div className="player-wrap">
    {isEmbed ? <iframe className="player-frame" src={room.videoUrl} title={`Player ${room.mediaTitle}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" /> : youtubeId ? <div className="player-frame" ref={mountRef} /> : <video ref={videoRef} className="player-frame" src={room.videoUrl} controls={isHost} playsInline onLoadedMetadata={() => { setReady(true); if (!isHost) setNeedsGesture(true); }} onPlay={() => isHost && onPlayback(true, videoRef.current?.currentTime || 0)} onPause={() => isHost && onPlayback(false, videoRef.current?.currentTime || 0)} onSeeked={() => isHost && onPlayback(!videoRef.current?.paused, videoRef.current?.currentTime || 0)} />}
    {!isHost && youtubeId && <div className="viewer-shield" aria-hidden="true" />}
    {!isHost && needsGesture && <div className="viewer-start"><Button onClick={startViewer}>Sinkronkan pemutaran</Button><p>Tekan sekali agar browser mengizinkan video diputar.</p></div>}
  </div>;
}
