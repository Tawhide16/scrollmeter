import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSettings, Platform, ViewingEvent } from '../types/scrollmeter';
import { 
  exportEventsAsJson, 
  exportEventsAsCsv, 
  importEventsFromJson,
  permanentlyDeleteAllLocalData,
  purgeDataOlderThanDays,
  purgeDataForPlatform
} from '../utils/storage';
import { generateMarkdownReport, triggerFileDownload } from '../utils/export-helpers';
import { buildDailySummary } from '../utils/analytics';
import { 
  encryptData, 
  decryptData, 
  createVerificationToken, 
  verifyPassphrase,
  EncryptedPayload 
} from '../utils/crypto';
import { PlatformIcon } from './PlatformIcons';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Bell, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Sliders, 
  Info, 
  CheckCircle,
  Eye,
  Lock,
  Unlock,
  Key,
  Layers,
  HardDrive,
  CloudOff,
  AlertTriangle,
  FileText,
  Database
} from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  events: ViewingEvent[];
  onBack: () => void;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onImportEvents: (events: ViewingEvent[]) => void;
  onResetSeedData: () => void;
  onClearAllData: () => void;
  onTriggerTestNotification: () => void;
  onOpenExtensionExport: () => void;
}

export function SettingsView({
  settings,
  events,
  onBack,
  onUpdateSettings,
  onImportEvents,
  onResetSeedData,
  onClearAllData,
  onTriggerTestNotification,
  onOpenExtensionExport,
}: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'preferences' | 'privacy'>('preferences');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);

  // Encryption modal / state
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [passphraseConfirmInput, setPassphraseConfirmInput] = useState('');
  const [isProcessingCrypto, setIsProcessingCrypto] = useState(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);

  // Purge / Wipe confirmation modals
  const [showPermanentWipeConfirm, setShowPermanentWipeConfirm] = useState(false);
  const [showPlatformPurgeModal, setShowPlatformPurgeModal] = useState(false);
  const [platformToPurge, setPlatformToPurge] = useState<Platform>('tiktok');

  const showFeedback = (text: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const togglePlatform = (p: Platform) => {
    const updated = {
      ...settings,
      enabledPlatforms: {
        ...settings.enabledPlatforms,
        [p]: !settings.enabledPlatforms[p],
      },
    };
    onUpdateSettings(updated);
  };

  // Export JSON (Plain or Encrypted)
  const handleExportJson = async (withEncryption = false) => {
    try {
      let encryptedPayload: EncryptedPayload | undefined;
      if (withEncryption) {
        if (!settings.encryptionEnabled) {
          showFeedback('Please enable encryption and set a passphrase first', 'warn');
          return;
        }
        const promptPass = window.prompt('Enter your encryption passphrase to encrypt the export:');
        if (!promptPass) return;
        encryptedPayload = await encryptData(events, promptPass);
      }

      const json = exportEventsAsJson(events, settings, encryptedPayload);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scrollmeter-${withEncryption ? 'encrypted-' : ''}export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showFeedback(`Exported ${withEncryption ? 'encrypted' : 'JSON'} backup successfully!`);
    } catch (err) {
      showFeedback('Failed to export data', 'error');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const csv = exportEventsAsCsv(events);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrollmeter-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Exported CSV successfully!');
  };

  // Export Markdown Wellbeing Report
  const handleExportMarkdown = () => {
    const summary = buildDailySummary(events);
    const md = generateMarkdownReport(events, summary);
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerFileDownload(`scrollmeter-report-${dateStr}.md`, md, 'text/markdown;charset=utf-8');
    showFeedback('Exported Markdown report successfully!');
  };

  // Import JSON Backup
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Check if encrypted
        if (parsed.isEncrypted && parsed.encryptedData) {
          const pass = window.prompt('This backup is encrypted with AES-GCM 256-bit. Please enter your passphrase:');
          if (!pass) return;
          try {
            const decryptedEvents = await decryptData<ViewingEvent[]>(parsed.encryptedData, pass);
            if (decryptedEvents && decryptedEvents.length > 0) {
              onImportEvents(decryptedEvents);
              showFeedback(`Decrypted & imported ${decryptedEvents.length} events!`);
            } else {
              showFeedback('No events found in decrypted file', 'warn');
            }
          } catch {
            showFeedback('Incorrect passphrase or corrupted encrypted backup', 'error');
          }
          return;
        }

        const imported = importEventsFromJson(content);
        if (imported && imported.length > 0) {
          onImportEvents(imported);
          showFeedback(`Imported ${imported.length} events successfully!`);
        } else {
          showFeedback('Failed to parse valid events from JSON file.', 'warn');
        }
      } catch (err) {
        showFeedback('Corrupted or invalid JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Enable / Disable Web Crypto Encryption
  const handleSaveEncryptionPassphrase = async () => {
    if (!passphraseInput || passphraseInput.length < 6) {
      setCryptoError('Passphrase must be at least 6 characters.');
      return;
    }
    if (passphraseInput !== passphraseConfirmInput) {
      setCryptoError('Passphrases do not match.');
      return;
    }

    setIsProcessingCrypto(true);
    setCryptoError(null);

    try {
      // Test derive key and create verification token
      await createVerificationToken(passphraseInput);
      
      onUpdateSettings({
        ...settings,
        encryptionEnabled: true,
        encryptionPassphraseSet: true,
      });

      setShowEncryptionModal(false);
      setPassphraseInput('');
      setPassphraseConfirmInput('');
      showFeedback('Local AES-GCM 256-bit encryption enabled!');
    } catch (err) {
      setCryptoError('Failed to initialize Web Crypto keys: ' + (err as Error).message);
    } finally {
      setIsProcessingCrypto(false);
    }
  };

  const handleDisableEncryption = () => {
    if (window.confirm('Disable local database encryption? Data will be stored as standard local plaintext in IndexedDB.')) {
      onUpdateSettings({
        ...settings,
        encryptionEnabled: false,
        encryptionPassphraseSet: false,
      });
      showFeedback('Local encryption disabled.');
    }
  };

  // Permanent Wipe All Local Data
  const handleExecutePermanentWipe = async () => {
    await permanentlyDeleteAllLocalData();
    onClearAllData();
    setShowPermanentWipeConfirm(false);
    showFeedback('All local viewing data permanently wiped from IndexedDB.', 'warn');
  };

  // Selective Purge by Date
  const handlePurgeOlderThan = async (days: number) => {
    if (window.confirm(`Purge all viewing history older than ${days} days from local IndexedDB?`)) {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const filtered = events.filter((e) => e.startedAt >= cutoff);
      const purgedCount = events.length - filtered.length;
      await purgeDataOlderThanDays(days);
      onImportEvents(filtered);
      showFeedback(`Purged ${purgedCount} events older than ${days} days.`);
    }
  };

  // Selective Purge by Platform
  const handleExecutePlatformPurge = async () => {
    const filtered = events.filter((e) => e.platform !== platformToPurge);
    const purgedCount = events.length - filtered.length;
    await purgeDataForPlatform(platformToPurge);
    onImportEvents(filtered);
    setShowPlatformPurgeModal(false);
    showFeedback(`Purged ${purgedCount} events from ${platformToPurge}.`);
  };

  return (
    <div className="w-[380px] h-full max-h-full bg-[#101511] text-slate-100 rounded-3xl border border-[#233125] shadow-2xl overflow-hidden flex flex-col font-sans select-none">
      {/* 1. Header (Pinned) */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#101511]">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Back to Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-[17px] text-white">Settings & Privacy</h1>
            <p className="text-[11px] text-slate-400">Controls, notifications, and local data</p>
          </div>
        </div>
      </div>

      {/* 2. Top Segmented Sub-Tabs with Smooth Sliding Animation */}
      <div className="px-5 pt-3 pb-2 border-b border-white/5 shrink-0 bg-[#101511]">
        <div className="flex bg-[#162118] border border-[#263728] rounded-xl p-1 text-xs relative">
          <button
            type="button"
            onClick={() => setActiveSettingsTab('preferences')}
            className={`relative flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSettingsTab === 'preferences' ? 'text-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            {activeSettingsTab === 'preferences' && (
              <motion.div
                layoutId="activeSettingsTab"
                className="absolute inset-0 bg-[#72f534] rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Preferences</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('privacy')}
            className={`relative flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSettingsTab === 'privacy' ? 'text-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            {activeSettingsTab === 'privacy' && (
              <motion.div
                layoutId="activeSettingsTab"
                className="absolute inset-0 bg-[#72f534] rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy & IndexedDB</span>
            </span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div 
          className={`border-b px-4 py-2 text-xs flex items-center gap-2 shrink-0 ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : feedbackMsg.type === 'warn'
              ? 'bg-amber-950/80 border-amber-800 text-amber-200'
              : 'bg-[#72f534]/15 border-[#72f534]/30 text-[#72f534]'
          }`}
        >
          {feedbackMsg.type === 'error' ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 3. Main Content Area with Smooth Crossfade Animation */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 p-5">
        <AnimatePresence mode="wait">
          {activeSettingsTab === 'preferences' ? (
            <motion.div
              key="settings-preferences"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-5"
            >
              {/* Manifest V3 Real Extension Download Banner */}
              <div className="p-3.5 bg-gradient-to-r from-[#172e1b] to-[#142318] border border-[#2b4c2f] rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#72f534]" />
                    Chrome Extension Files
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Unpack & load Manifest V3 into Chrome
                  </div>
                </div>
                <button
                  onClick={onOpenExtensionExport}
                  className="px-3 py-1.5 rounded-xl bg-[#72f534] hover:bg-[#86ff4d] text-black font-semibold text-xs transition-colors cursor-pointer"
                >
                  Get ZIP
                </button>
              </div>

              {/* 1. Platform Tracking Toggles */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Platform Tracking Toggles
                </span>

                <div className="space-y-1.5 bg-[#172219] p-2.5 rounded-2xl border border-[#263728]">
                  {(['youtube', 'instagram', 'tiktok', 'facebook'] as const).map((p) => {
                    const names = {
                      youtube: 'YouTube Shorts',
                      instagram: 'Instagram Reels',
                      tiktok: 'TikTok Feed',
                      facebook: 'Facebook Reels',
                    };
                    const isEnabled = settings.enabledPlatforms[p];

                    return (
                      <div
                        key={p}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <PlatformIcon platform={p} className="w-5 h-5 shadow" />
                          <span className="text-xs font-medium text-slate-200">{names[p]}</span>
                        </div>

                        <button
                          onClick={() => togglePlatform(p)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isEnabled ? 'bg-[#72f534]' : 'bg-[#263328]'
                          }`}
                          aria-label={`Toggle tracking for ${names[p]}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#101511] shadow transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Active View Threshold Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active View Threshold
                  </span>
                  <span className="text-xs font-bold text-[#72f534]">
                    {settings.viewThresholdSeconds} seconds
                  </span>
                </div>

                <div className="bg-[#172219] p-3.5 rounded-2xl border border-[#263728] space-y-2">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Videos must play for at least this duration before counting as viewed.
                  </p>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={settings.viewThresholdSeconds}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        viewThresholdSeconds: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#72f534] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1s (Sensitive)</span>
                    <span>2s (Recommended)</span>
                    <span>10s (Strict)</span>
                  </div>
                </div>
              </div>

              {/* 3. In-page Floating Pill */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  In-Page Floating Pill
                </span>

                <div className="bg-[#172219] p-3.5 rounded-2xl border border-[#263728] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Show in-page counter</div>
                      <div className="text-[11px] text-slate-400">
                        Displays floating badge on social websites
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          inPageIndicatorEnabled: !settings.inPageIndicatorEnabled,
                        })
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.inPageIndicatorEnabled ? 'bg-[#72f534]' : 'bg-[#263328]'
                      }`}
                      aria-label="Toggle in-page floating counter"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#101511] shadow transition duration-200 ease-in-out ${
                          settings.inPageIndicatorEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.inPageIndicatorEnabled && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Pill Position:</span>
                      <select
                        value={settings.inPageIndicatorPosition}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            inPageIndicatorPosition: e.target.value as any,
                          })
                        }
                        className="bg-[#101511] text-xs text-slate-200 border border-[#2b3d2d] rounded-lg px-2 py-1 focus:outline-none focus:border-[#72f534]"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Scheduled Daily Summary */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Daily Report Notification
                </span>

                <div className="bg-[#172219] p-3.5 rounded-2xl border border-[#263728] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#72f534]" />
                      <span className="text-xs font-medium text-white">Daily Summary Reminder</span>
                    </div>
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          dailyReportEnabled: !settings.dailyReportEnabled,
                        })
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.dailyReportEnabled ? 'bg-[#72f534]' : 'bg-[#263328]'
                      }`}
                      aria-label="Toggle daily report notification"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#101511] shadow transition duration-200 ease-in-out ${
                          settings.dailyReportEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.dailyReportEnabled && (
                    <div className="pt-2 border-t border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Scheduled Time:</span>
                        <input
                          type="time"
                          value={settings.dailyReportTime}
                          onChange={(e) =>
                            onUpdateSettings({
                              ...settings,
                              dailyReportTime: e.target.value,
                            })
                          }
                          className="bg-[#101511] text-xs text-white border border-[#2b3d2d] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#72f534]"
                        />
                      </div>

                      <button
                        onClick={onTriggerTestNotification}
                        className="w-full py-1.5 px-3 rounded-xl bg-[#203123] hover:bg-[#283e2c] border border-[#2e4732] text-xs text-[#72f534] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Send Test Notification Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings-privacy"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-5"
            >
              {/* Local-First Architecture Guarantee */}
              <div className="bg-[#172219] p-4 rounded-2xl border border-[#263728] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Database className="w-4 h-4 text-[#72f534]" />
                  <span>Local-First Data Storage Architecture</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#111812] border border-[#233125]">
                    <span className="text-slate-300">Activity Data Storage:</span>
                    <span className="font-mono text-[11px] text-[#72f534] font-bold">IndexedDB (Local)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#111812] border border-[#233125]">
                    <span className="text-slate-300">Preferences & Settings:</span>
                    <span className="font-mono text-[11px] text-[#72f534] font-bold">Chrome Storage Local</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#111812] border border-[#233125]">
                    <span className="text-slate-300">Cloud Synchronisation:</span>
                    <span className="font-mono text-[11px] text-amber-300 font-bold flex items-center gap-1">
                      <CloudOff className="w-3 h-3" />
                      DISABLED (Opt-in only)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#111812] border border-[#233125]">
                    <span className="text-slate-300">Analytics Computing:</span>
                    <span className="font-mono text-[11px] text-[#72f534] font-bold">100% Client-Side Pure Logic</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  <b>Zero Network Transmission:</b> Your viewing history, creator interactions, and browsing activity are never sent to external servers or telemetry backends.
                </p>
              </div>

              {/* Optional Web Crypto API Encryption */}
              <div className="bg-[#172219] p-4 rounded-2xl border border-[#263728] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#72f534]" />
                    <span className="text-xs font-bold text-white">Local Web Crypto API Encryption</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    settings.encryptionEnabled
                      ? 'bg-[#72f534]/15 text-[#72f534] border border-[#72f534]/30'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}>
                    {settings.encryptionEnabled ? 'AES-GCM 256-bit' : 'Disabled'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Encrypt your viewing records locally using hardware-accelerated AES-GCM (256-bit) and PBKDF2 SHA-256 key derivation.
                </p>

                {settings.encryptionEnabled ? (
                  <div className="space-y-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-[#142318] border border-[#2b4c2f] flex items-center justify-between text-xs">
                      <span className="text-[#72f534] flex items-center gap-1.5 font-medium">
                        <Lock className="w-3.5 h-3.5" />
                        Storage is encrypted
                      </span>
                      <button
                        onClick={handleDisableEncryption}
                        className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer hover:underline"
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowEncryptionModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-[#203123] hover:bg-[#283e2c] border border-[#2e4732] text-xs text-[#72f534] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Set Up Local Passphrase Encryption
                  </button>
                )}
              </div>

              {/* Data Retention & Selective Purge */}
              <div className="bg-[#172219] p-4 rounded-2xl border border-[#263728] space-y-3">
                <span className="text-xs font-bold text-white block">Data Retention & Purging</span>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Retention Horizon:</span>
                  <select
                    value={settings.retentionDays}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        retentionDays: parseInt(e.target.value, 10),
                      })
                    }
                    className="bg-[#101511] text-xs text-slate-200 border border-[#2b3d2d] rounded-lg px-2 py-1 focus:outline-none focus:border-[#72f534]"
                  >
                    <option value={7}>Keep 7 days</option>
                    <option value={30}>Keep 30 days</option>
                    <option value={90}>Keep 90 days</option>
                    <option value={0}>Keep forever</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handlePurgeOlderThan(30)}
                    className="py-1.5 px-2 bg-[#203123] hover:bg-[#283e2c] border border-[#2e4732] rounded-xl text-xs text-slate-200 transition-colors cursor-pointer text-center"
                  >
                    Purge &gt; 30 Days
                  </button>
                  <button
                    onClick={() => setShowPlatformPurgeModal(true)}
                    className="py-1.5 px-2 bg-[#203123] hover:bg-[#283e2c] border border-[#2e4732] rounded-xl text-xs text-slate-200 transition-colors cursor-pointer text-center"
                  >
                    Purge by Platform
                  </button>
                </div>
              </div>

              {/* Export & Import Controls */}
              <div className="bg-[#172219] p-4 rounded-2xl border border-[#263728] space-y-3">
                <span className="text-xs font-bold text-white block">Export & Backup</span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExportJson(false)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#203123] hover:bg-[#283e2c] border border-[#2e4732] rounded-xl text-xs text-white font-medium transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#72f534]" />
                    Export JSON
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#203123] hover:bg-[#283e2c] border border-[#2e4732] rounded-xl text-xs text-white font-medium transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#72f534]" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#203123] hover:bg-[#283e2c] border border-[#2e4732] rounded-xl text-xs text-white font-medium transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#72f534]" />
                    Export Markdown Report
                  </button>
                </div>

                {settings.encryptionEnabled && (
                  <button
                    onClick={() => handleExportJson(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#1b2b1d] hover:bg-[#243a27] border border-[#305034] rounded-xl text-xs text-[#72f534] font-medium transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Export Encrypted JSON Backup
                  </button>
                )}

                <div className="pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    Import JSON Backup
                  </button>
                </div>
              </div>

              {/* Reset Demo Data & Permanent Wipe */}
              <div className="p-3.5 bg-[#172219] rounded-2xl border border-[#263728] flex items-center justify-between text-xs">
                <button
                  onClick={onResetSeedData}
                  className="text-slate-400 hover:text-white flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Demo Data
                </button>
                <button
                  onClick={() => setShowPermanentWipeConfirm(true)}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1.5 hover:underline cursor-pointer font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Permanently Wipe All Data
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Encryption Setup Modal */}
      {showEncryptionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121913] border border-[#273a2a] rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Lock className="w-4 h-4 text-[#72f534]" />
              <h3>Set Local Encryption Passphrase</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your viewing records will be encrypted with AES-GCM 256-bit using the Web Crypto API. ScrollMeter never stores your passphrase in plaintext.
            </p>

            {cryptoError && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
                {cryptoError}
              </div>
            )}

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Passphrase (min 6 characters):</label>
                <input
                  type="password"
                  value={passphraseInput}
                  onChange={(e) => setPassphraseInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0e130f] border border-[#283c2a] rounded-xl text-xs text-white focus:outline-none focus:border-[#72f534]"
                  placeholder="Enter secure passphrase"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Confirm Passphrase:</label>
                <input
                  type="password"
                  value={passphraseConfirmInput}
                  onChange={(e) => setPassphraseConfirmInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0e130f] border border-[#283c2a] rounded-xl text-xs text-white focus:outline-none focus:border-[#72f534]"
                  placeholder="Re-enter passphrase"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowEncryptionModal(false);
                  setPassphraseInput('');
                  setPassphraseConfirmInput('');
                  setCryptoError(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEncryptionPassphrase}
                disabled={isProcessingCrypto}
                className="px-4 py-1.5 rounded-xl bg-[#72f534] hover:bg-[#86ff4d] text-black font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessingCrypto ? 'Deriving Keys...' : 'Enable Encryption'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Wipe Confirmation Modal */}
      {showPermanentWipeConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#191212] border border-rose-900/60 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3>Permanently Delete All Activity?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will irreversibly wipe all viewing events from your local computer's IndexedDB and cache. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPermanentWipeConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePermanentWipe}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs cursor-pointer"
              >
                Wipe Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Purge Modal */}
      {showPlatformPurgeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121913] border border-[#273a2a] rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Trash2 className="w-4 h-4 text-amber-400" />
              <h3>Purge History by Platform</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Select a platform to delete all recorded viewing sessions for that platform from local storage:
            </p>

            <div className="space-y-2">
              {(['youtube', 'instagram', 'tiktok', 'facebook'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformToPurge(p)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    platformToPurge === p
                      ? 'bg-[#1e2f20] border-[#72f534] text-white font-semibold'
                      : 'bg-[#151c16] border-[#253527] text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={p} className="w-4 h-4" />
                    <span className="capitalize">{p}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {events.filter((e) => e.platform === p).length} events
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPlatformPurgeModal(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePlatformPurge}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs cursor-pointer"
              >
                Purge Selected Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
