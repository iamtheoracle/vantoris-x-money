import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, QrCode, ScanLine, Copy, Check } from 'lucide-react';

function readMember(raw) {
  if (!raw) return '';
  const text = String(raw).trim();
  const query = text.match(/member=([^&]+)/i);
  if (query) return decodeURIComponent(query[1]);
  try {
    const parsed = JSON.parse(text);
    return parsed.user_id || parsed.member || parsed.email || '';
  } catch {
    return text;
  }
}

export default function MemberQR() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [scanNote, setScanNote] = useState('');
  const [peerId, setPeerId] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    return () => stopScan();
  }, []);

  const payload = useMemo(() => {
    if (!user) return '';
    return `vantoris://pay?member=${encodeURIComponent(user.id || user.email || '')}&v=1`;
  }, [user]);

  const qrImg = payload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(payload)}`
    : '';

  function stopScan() {
    try { readerRef.current?.reset(); } catch { /* already stopped */ }
    readerRef.current = null;
    const video = videoRef.current;
    const stream = video?.srcObject;
    if (stream?.getTracks) stream.getTracks().forEach((t) => t.stop());
    if (video) video.srcObject = null;
    setScanning(false);
  }

  function found(raw) {
    const id = readMember(raw);
    stopScan();
    setPeerId(id);
    setScanNote('Code read. Continue to Pay to review the send. Nothing has been sent.');
  }

  async function copyLink() {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setScanNote('Could not copy. The code is still on screen.');
    }
  }

  async function tryScan() {
    setScanNote('');
    stopScan();
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanNote('This browser has no camera. Use the photo button or paste the code.');
      return;
    }
    if (!window.isSecureContext) {
      setScanNote('Camera needs a secure page. Open the site with https.');
      return;
    }
    try {
      const scannerModuleUrl = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm';
      const { BrowserQRCodeReader } = await import(/* @vite-ignore */ scannerModuleUrl);
      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;
      setScanning(true);
      setScanNote('Point the camera at a Vantoris member QR.');
      await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error, controls) => {
        if (result?.getText()) {
          controls.stop();
          found(result.getText());
        }
      });
    } catch (e) {
      stopScan();
      const denied = e?.name === 'NotAllowedError' || /permission/i.test(e?.message || '');
      setScanNote(denied ? 'Camera permission was denied. Allow camera, or paste the code.' : (e.message || 'Camera could not start.'));
    }
  }

  async function onPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const scannerModuleUrl = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm';
      const { BrowserQRCodeReader } = await import(/* @vite-ignore */ scannerModuleUrl);
      const reader = new BrowserQRCodeReader();
      const url = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(url);
      URL.revokeObjectURL(url);
      found(result.getText());
    } catch {
      setScanNote('No QR code found in that photo. Try again, closer and in focus.');
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3">
        <Link to="/" className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Back"><ArrowLeft size={20} /></Link>
        <h1 className="font-bold text-navy">Member QR</h1>
      </div>
      <div className="mx-auto max-w-md space-y-6 p-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-brass">Your receive code</p>
          <div className="mx-auto mt-4 flex h-[240px] w-[240px] items-center justify-center">
            {qrImg ? <img src={qrImg} alt="Your member payment QR" width={240} height={240} /> : <QrCode size={64} className="text-slate-300" />}
          </div>
          <button type="button" onClick={copyLink} className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
            {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy pay link'}
          </button>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 font-bold text-navy"><ScanLine size={18} className="text-brass" /> Scan a member</p>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
            {!scanning && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Camera off</div>}
          </div>
          <button type="button" onClick={scanning ? stopScan : tryScan} className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white">
            {scanning ? 'Stop scan' : 'Open camera'}
          </button>
          <label className="block w-full cursor-pointer rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-navy">
            Scan a photo
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
          </label>
          <input value={peerId} onChange={(e) => setPeerId(e.target.value)} placeholder="Or paste member id or pay link" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          <button type="button" onClick={() => peerId.trim() && navigate(`/move-money?action=send&to=${encodeURIComponent(peerId.trim())}`)} disabled={!peerId.trim()} className="w-full rounded-full border border-navy py-3 text-sm font-bold text-navy disabled:opacity-40">
            Continue to Pay
          </button>
          {scanNote && <p className="text-xs text-slate-500">{scanNote}</p>}
          <p className="text-[11px] text-slate-400">A scan finds the member. It does not send money until you confirm the amount in Pay.</p>
        </div>
      </div>
    </div>
  );
}
