import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SignalPayload = {
  from: string;
  to: string;
  kind: "offer" | "answer" | "ice";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type Options = {
  roomId: string;
  userId: string | null;
  /** true when the local user occupies an unmuted seat and wants to publish audio */
  publish: boolean;
};

/**
 * Mesh WebRTC voice for a room. Signalling rides on a Supabase Realtime
 * channel (presence for peer discovery, broadcast for offer/answer/ICE).
 */
export function useVoiceRoom({ roomId, userId, publish }: Options) {
  const [connected, setConnected] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<Record<string, boolean>>({});
  const [reconnecting, setReconnecting] = useState<Record<string, boolean>>({});

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const analysersRef = useRef<Map<string, { ctx: AudioContext; analyser: AnalyserNode }>>(new Map());
  const rafRef = useRef<number | null>(null);
  const reconnectTimersRef = useRef<Map<string, number>>(new Map());
  const publishRef = useRef(publish);
  publishRef.current = publish;

  const clearReconnect = useCallback((peerId: string) => {
    const t = reconnectTimersRef.current.get(peerId);
    if (t !== undefined) {
      window.clearTimeout(t);
      reconnectTimersRef.current.delete(peerId);
    }
  }, []);

  const scheduleReconnect = useCallback((peerId: string, selfId: string, delay: number) => {
    if (reconnectTimersRef.current.has(peerId)) return;
    setReconnecting((prev) => ({ ...prev, [peerId]: true }));
    const t = window.setTimeout(() => {
      reconnectTimersRef.current.delete(peerId);
      const pc = peersRef.current.get(peerId);
      if (!pc || pc.connectionState === "closed") return;
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setReconnecting((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
        return;
      }
      // full renegotiate from scratch
      cleanupPeerRef.current?.(peerId);
      void negotiateRef.current?.(peerId, selfId);
    }, delay);
    reconnectTimersRef.current.set(peerId, t);
  }, []);

  // late-bound refs so callbacks above can call functions defined below
  const cleanupPeerRef = useRef<((peerId: string) => void) | null>(null);
  const negotiateRef = useRef<((peerId: string, selfId: string) => Promise<void>) | null>(null);

  const attachAnalyser = useCallback((id: string, stream: MediaStream) => {
    try {
      const AudioCtx: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analysersRef.current.set(id, { ctx, analyser });
    } catch {
      /* analyser is cosmetic only */
    }
  }, []);

  const detachAnalyser = useCallback((id: string) => {
    const entry = analysersRef.current.get(id);
    if (entry) {
      void entry.ctx.close().catch(() => {});
      analysersRef.current.delete(id);
    }
  }, []);

  // speaking level loop
  useEffect(() => {
    const buffer = new Uint8Array(256);
    const tick = () => {
      const next: Record<string, boolean> = {};
      analysersRef.current.forEach(({ analyser }, id) => {
        analyser.getByteFrequencyData(buffer as unknown as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] ?? 0;
        next[id] = sum / buffer.length > 12;
      });
      setSpeaking((prev) => {
        const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
        for (const k of keys) if ((prev[k] ?? false) !== (next[k] ?? false)) return next;
        return prev;
      });
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const cleanupPeer = useCallback(
    (peerId: string) => {
      clearReconnect(peerId);
      peersRef.current.get(peerId)?.close();
      peersRef.current.delete(peerId);
      const el = audioElsRef.current.get(peerId);
      if (el) {
        el.srcObject = null;
        el.remove();
        audioElsRef.current.delete(peerId);
      }
      detachAnalyser(peerId);
    },
    [detachAnalyser, clearReconnect],
  );
  cleanupPeerRef.current = cleanupPeer;

  const sendSignal = useCallback((payload: SignalPayload) => {
    void channelRef.current?.send({ type: "broadcast", event: "signal", payload });
  }, []);

  const createPeer = useCallback(
    (peerId: string, selfId: string) => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current.set(peerId, pc);

      localStreamRef.current
        ?.getTracks()
        .forEach((track) => pc.addTrack(track, localStreamRef.current as MediaStream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({ from: selfId, to: peerId, kind: "ice", candidate: event.candidate.toJSON() });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        let el = audioElsRef.current.get(peerId);
        if (!el) {
          el = document.createElement("audio");
          el.autoplay = true;
          el.setAttribute("playsinline", "true");
          document.body.appendChild(el);
          audioElsRef.current.set(peerId, el);
        }
        el.srcObject = stream;
        void el.play().catch(() => {});
        detachAnalyser(peerId);
        attachAnalyser(peerId, stream);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "closed") {
          cleanupPeer(peerId);
        }
      };

      // network recovery: on flaky networks try ICE restart, then a full renegotiate
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === "failed") {
          try {
            pc.restartIce();
          } catch {
            /* older browsers: fall through to renegotiate */
          }
          if (selfId < peerId) scheduleReconnect(peerId, selfId, 0);
        } else if (state === "disconnected") {
          // give the network a few seconds to heal itself before renegotiating
          if (selfId < peerId) scheduleReconnect(peerId, selfId, 4000);
        } else if (state === "connected" || state === "completed") {
          clearReconnect(peerId);
          setReconnecting((prev) => {
            if (!prev[peerId]) return prev;
            const next = { ...prev };
            delete next[peerId];
            return next;
          });
        }
      };

      return pc;
    },
    [attachAnalyser, cleanupPeer, detachAnalyser, sendSignal, scheduleReconnect, clearReconnect],
  );

  const negotiate = useCallback(
    async (peerId: string, selfId: string) => {
      const pc = createPeer(peerId, selfId);
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      sendSignal({ from: selfId, to: peerId, kind: "offer", sdp: offer });
    },
    [createPeer, sendSignal],
  );
  negotiateRef.current = negotiate;

  // acquire / release microphone
  useEffect(() => {
    let cancelled = false;

    const stopLocal = () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (userId) detachAnalyser(userId);
    };

    const run = async () => {
      if (!publish) {
        if (localStreamRef.current) {
          stopLocal();
          // drop tracks from existing peers by renegotiating from scratch
          const selfId = userId;
          const peers = [...peersRef.current.keys()];
          peers.forEach(cleanupPeer);
          if (selfId) peers.forEach((p) => void negotiate(p, selfId));
        }
        return;
      }
      if (localStreamRef.current || !userId) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setMicError(null);
        attachAnalyser(userId, stream);
        const peers = [...peersRef.current.keys()];
        peers.forEach(cleanupPeer);
        peers.forEach((p) => void negotiate(p, userId));
      } catch {
        setMicError("Mic access denied. Browser settings me microphone allow karein.");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [publish, userId, attachAnalyser, cleanupPeer, detachAnalyser, negotiate]);

  // signalling channel
  useEffect(() => {
    if (!userId || !roomId) return;
    const selfId = userId;

    const channel = supabase.channel(`voice-${roomId}`, {
      config: { presence: { key: selfId }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === selfId) return;
        // deterministic offerer avoids glare
        if (selfId < key) void negotiate(key, selfId);
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key !== selfId) cleanupPeer(key);
      })
      .on("broadcast", { event: "signal" }, async ({ payload }) => {
        const msg = payload as SignalPayload;
        if (msg.to !== selfId) return;
        const pc = createPeer(msg.from, selfId);
        try {
          if (msg.kind === "offer" && msg.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal({ from: selfId, to: msg.from, kind: "answer", sdp: answer });
          } else if (msg.kind === "answer" && msg.sdp) {
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            }
          } else if (msg.kind === "ice" && msg.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          }
        } catch {
          /* ignore transient signalling races */
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          await channel.track({ userId: selfId, at: Date.now() });
        }
      });

    return () => {
      setConnected(false);
      setReconnecting({});
      reconnectTimersRef.current.forEach((t) => window.clearTimeout(t));
      reconnectTimersRef.current.clear();
      [...peersRef.current.keys()].forEach(cleanupPeer);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, userId, cleanupPeer, createPeer, negotiate, sendSignal]);

  // stop mic on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      analysersRef.current.forEach(({ ctx }) => void ctx.close().catch(() => {}));
      analysersRef.current.clear();
    };
  }, []);

  return { connected, micError, speaking, reconnecting };
}
