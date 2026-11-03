import React, { useState } from 'react';
import { 
  getExtensionSourceFiles, 
  downloadExtensionZip, 
  downloadSingleFile, 
  downloadManifestDirectly, 
  ExtensionSourceFile 
} from '../utils/extension-generator';
import { ScrollMeterLogo } from './PlatformIcons';
import { Download, X, Copy, Check, FileCode, Folder, ExternalLink, Terminal, AlertTriangle, FileCheck } from 'lucide-react';

interface ExtensionPackagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExtensionPackagerModal({ isOpen, onClose }: ExtensionPackagerModalProps) {
  const files = getExtensionSourceFiles();
  const [selectedFile, setSelectedFile] = useState<ExtensionSourceFile>(files[0]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      await downloadExtensionZip();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSelectedFile = () => {
    const filename = selectedFile.path.split('/').pop() || selectedFile.path;
    const mime = selectedFile.path.endsWith('.json')
      ? 'application/json'
      : selectedFile.path.endsWith('.html')
      ? 'text/html'
      : selectedFile.path.endsWith('.css')
      ? 'text/css'
      : 'text/javascript';
    downloadSingleFile(filename, selectedFile.code, mime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-[#111713] border border-[#2b3d2f] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#152017]">
          <div className="flex items-center gap-3">
            <ScrollMeterLogo className="w-6 h-6 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                ScrollMeter Chrome Extension Package (Manifest V3)
              </h2>
              <p className="text-xs text-slate-400">
                Ready to unpack and install directly into Chrome, Edge, or Brave
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct manifest.json download button */}
            <button
              onClick={downloadManifestDirectly}
              title="Download only manifest.json file"
              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#72f534]" />
              <span>manifest.json ডাউনলোড</span>
            </button>

            {/* Full Extension ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={downloading}
              className="px-4 py-2 bg-[#72f534] hover:bg-[#86ff4d] text-black font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Packing...' : 'Download Full ZIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view of files and code */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar file tree */}
          <div className="w-full md:w-72 border-r border-white/10 p-3 bg-[#0d130f] space-y-3 overflow-y-auto max-h-60 md:max-h-none">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 block mb-1">
                Source Files
              </span>
              <div className="space-y-1">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      selectedFile.path === file.path
                        ? 'bg-[#72f534]/15 text-[#72f534] font-medium border border-[#72f534]/30'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{file.path}</span>
                    </div>
                    {file.path === 'manifest.json' && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-[#72f534]/20 text-[#72f534] rounded font-semibold shrink-0">
                        Root
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Troubleshooting Alert Box */}
            <div className="p-3 bg-[#1e2316] rounded-xl border border-[#424823] text-[11px] text-amber-200/90 space-y-1.5">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>manifest.json খুঁজে পাচ্ছেন না?</span>
              </div>
              <p className="text-[10px] leading-relaxed text-amber-100/80">
                উইন্ডোজে ডিফল্টভাবে <span className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">.json</span> এক্সটেনশন হাইড থাকে, তাই ফাইলের নাম শুধুই <b className="text-white">"manifest"</b> (JSON File) দেখায়। সেটিই আসল ফাইল!
              </p>
            </div>

            {/* Quick Install Instructions Guide */}
            <div className="p-3 bg-[#152217] rounded-xl border border-[#2b3e2e] text-[11px] text-slate-300 space-y-1.5">
              <div className="font-bold text-[#72f534] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                ইনস্টল করার নিয়ম:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[10px] leading-relaxed">
                <li>ZIP ফাইল Extract/Unzip করুন।</li>
                <li>ক্রোমে <span className="font-mono text-white">chrome://extensions</span> এ যান।</li>
                <li>উপরে ডানে <b className="text-white">Developer mode</b> অন করুন।</li>
                <li><b className="text-[#72f534]">Load unpacked</b> এ ক্লিক করে আনজিপ করা মূল ফোল্ডারটি সিলেক্ট করুন।</li>
              </ol>
            </div>
          </div>

          {/* Main code editor display */}
          <div className="flex-1 flex flex-col bg-[#080d09] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0f1711] border-b border-white/5 flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="font-mono text-xs text-white font-medium">
                  {selectedFile.path}
                </span>
                <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                  — {selectedFile.description}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadSelectedFile}
                  title={`Download ${selectedFile.path}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                >
                  <Download className="w-3 h-3 text-[#72f534]" />
                  <span>Download file</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-[#72f534]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
