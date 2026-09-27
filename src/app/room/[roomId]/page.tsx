'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check, Copy, MessageCircle, Send, Users, AlertCircle, Loader2, Play, Pause, Volume2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { joinRoom, leaveRoom, sendMessage, subscribeMessages, subscribeParticipants, subscribeRoom, updatePlayback, updateVideoProgress, type ChatMessage, type Participant, type Room } from '@/lib/rooms';
import { SyncedPlayer } from '@/components/watch-party/synced-player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function WatchPartyRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, initialized } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [people, setPeople] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'chat' | 'people'>('chat');
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastPlaybackRef = useRef(0);
  const isHost = !!user && user.uid === room?.hostId;
  const joinedRoomId = room?.id;

  useEffect(() => {
    if (!initialized || !user || !roomId) return;
    const fail = () => { setError('Koneksi room gagal. Periksa koneksi dan aturan Firestore.'); setLoading(false); };
    const unsubRoom = subscribeRoom(roomId, data => { setRoom(data); setLoading(false); }, fail);
    const unsubPeople = subscribeParticipants(roomId, setPeople, fail);
    const unsubMessages = subscribeMessages(roomId, setMessages, fail);
    return () => { unsubRoom(); unsubPeople(); unsubMessages(); };
  }, [initialized, user, roomId]);

  useEffect(() => {
    if (!joinedRoomId || !user) return;
    void joinRoom(joinedRoomId, { id: user.uid, name: user.displayName || user.email || 'Penonton', photoURL: user.photoURL, joinedAt: Date.now() }).catch(() => setError('Tidak dapat bergabung ke room.'));
    return () => { void leaveRoom(joinedRoomId, user.uid).catch(() => {}); };
  }, [joinedRoomId, user]);

  useEffect(() => { if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, tab]);

  const onPlayback = useCallback((playing: boolean, time: number) => {
    if (!roomId || !isHost) return;
    const now = Date.now();
    if (now - lastPlaybackRef.current < 800 && playing) return;
    lastPlaybackRef.current = now;
    void updatePlayback(roomId, playing, time).catch(() => setError('Sinkronisasi video gagal.'));
  }, [roomId, isHost]);

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    if (!room || !user || !message.trim()) return;
    const text = message.trim().slice(0, 500);
    setMessage('');
    try { await sendMessage(room.id, { userId: user.uid, userName: user.displayName || user.email || 'Penonton', text }); }
    catch { setMessage(text); setError('Pesan gagal dikirim.'); }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { setError('Tautan tidak dapat disalin. Salin dari bilah alamat browser.'); }
  }

  if (!initialized) return (
    <div className="min-h-screen bg-background pt-20 md:pt-24 pb-6">
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Memuat akun...</p>
        </div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-background pt-20 md:pt-24 pb-6">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Masuk untuk bergabung</h1>
            <p className="text-muted-foreground">
              Akun diperlukan agar chat dan posisi video dapat tersinkron dengan peserta lain.
            </p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href={`/login?next=${encodeURIComponent(`/room/${roomId}`)}`}>
              Masuk Sekarang
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-background pt-20 md:pt-24 pb-6">
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Menghubungkan ke room...</p>
        </div>
      </div>
    </div>
  );

  if (!room) return (
    <div className="min-h-screen bg-background pt-20 md:pt-24 pb-6">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Room tidak ditemukan</h1>
            <p className="text-muted-foreground">
              Tautan mungkin salah atau room sudah dihapus.
            </p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Room Info */}
            <div className="flex-1 min-w-0">
              <Link href={room.mediaPath || `/${room.mediaType}/${room.mediaId}`} className="text-sm text-primary hover:underline mb-2 flex items-center gap-1">
                ← Detail tontonan
              </Link>
              <h1 className="text-lg md:text-xl font-bold truncate">{room.mediaTitle}</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {isHost ? '✓ Anda host ruangan ini' : `Host: ${room.hostName}`} · {people.length} peserta
                {room.videoProgress > 0 && ` · ${Math.round(room.videoProgress)}% selesai`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="hidden sm:inline">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Salin tautan</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 md:pt-28 pb-6">
        <div className="container mx-auto px-4">
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Player Section */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-lg overflow-hidden border border-border">
                <div className="relative w-full aspect-video bg-black">
                  <SyncedPlayer room={room} isHost={isHost} onPlayback={onPlayback} />
                </div>

                {/* Media Info */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    {room.mediaPoster && (
                      <img
                        src={room.mediaPoster}
                        alt={room.mediaTitle}
                        className="w-20 h-28 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <h2 className="text-lg font-bold">{room.mediaTitle}</h2>
                      <p className="text-sm text-muted-foreground">
                        {room.videoType === 'embed'
                          ? 'Semua peserta membuka player yang sama. Kontrol waktu pada player pihak ketiga digunakan masing-masing.'
                          : isHost
                            ? 'Putar atau geser video. Posisi akan mengikuti untuk semua peserta.'
                            : 'Pemutaran mengikuti host. Jika video tidak dimulai otomatis, tekan tombol sinkronkan.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg overflow-hidden border border-border flex flex-col h-[600px] lg:h-[calc(100vh-12rem)]">
                {/* Tabs */}
                <div className="flex border-b border-border">
                  <button
                    type="button"
                    onClick={() => setTab('chat')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                      tab === 'chat'
                        ? 'text-primary border-b-2 border-primary -mb-[2px]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('people')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                      tab === 'people'
                        ? 'text-primary border-b-2 border-primary -mb-[2px]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Users size={16} />
                    <span>Peserta</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {people.length}
                    </span>
                  </button>
                </div>

                {/* Chat Tab */}
                {tab === 'chat' && (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length ? (
                        messages.map(item => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <strong className="text-sm">{item.userName}</strong>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground break-words">{item.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Belum ada pesan</p>
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-border">
                      <form onSubmit={submitMessage} className="flex gap-2">
                        <Input
                          value={message}
                          onChange={event => setMessage(event.target.value)}
                          maxLength={500}
                          placeholder="Tulis pesan..."
                          aria-label="Tulis pesan"
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!message.trim()}
                          aria-label="Kirim pesan"
                        >
                          <Send size={18} />
                        </Button>
                      </form>
                    </div>
                  </>
                )}

                {/* Participants Tab */}
                {tab === 'people' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {people.map(person => (
                      <div
                        key={person.id}
                        className="p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{person.name}</p>
                              {person.id === room.hostId && (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                  Host
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(person.joinedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
