import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Layers, 
  ShieldCheck, 
  Tv, 
  ArrowRight,
  Check,
  ChevronRight,
  Terminal,
  FolderArchive,
  Compass,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { ScrollMeterLogo, PlatformIcon } from './PlatformIcons';
import { Platform } from '../types/scrollmeter';
import { downloadManifestDirectly } from '../utils/extension-generator';

interface LaunchGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
  onSimulateWatch: () => void;
  onSwitchPlatform: (p: Platform) => void;
  onOpenTab: (tab: 'overview' | 'creators' | 'history' | 'settings') => void;
}

export function LaunchGuideModal({
  isOpen,
  onClose,
  onDownloadZip,
  onSimulateWatch,
  onSwitchPlatform,
  onOpenTab,
}: LaunchGuideModalProps) {
  const [activeGuideTab, setActiveGuideTab] = useState<'live-test' | 'chrome-install'>('live-test');
  const [hasTestedWatch, setHasTestedWatch] = useState(false);

  if (!isOpen) return null;

  const handleTestWatchClick = () => {
    onSimulateWatch();
    setHasTestedWatch(true);
    setTimeout(() => setHasTestedWatch(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-[#111713] border border-[#263728] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#202e22] flex items-center justify-between bg-[#141d16]">
          <div className="flex items-center gap-3">
            <ScrollMeterLogo className="w-7 h-7" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Launch &amp; Testing Center (লঞ্চ ও টেস্ট গাইড)
                </h2>
                <span className="text-[10px] bg-[#72f534]/20 text-[#72f534] font-semibold px-2 py-0.5 rounded-full border border-[#72f534]/30">
                  Ready to Test
                </span>
              </div>
              <p className="text-xs text-slate-400">
                You can test everything right now in this preview OR install it in real Google Chrome!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#202e22] bg-[#0e1410] px-6 text-xs">
          <button
            onClick={() => setActiveGuideTab('live-test')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeGuideTab === 'live-test'
                ? 'border-[#72f534] text-[#72f534]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>1. Instant Live Test (এখনই ওয়েব ব্রাউজারে টেস্ট করুন)</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('chrome-install')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeGuideTab === 'chrome-install'
                ? 'border-[#72f534] text-[#72f534]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>2. Real Chrome Install (আসল গুগল ক্রোমে ইনস্টল করুন)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {activeGuideTab === 'live-test' ? (
            <div className="space-y-5">
              {/* Live interactive action bar */}
              <div className="p-4 bg-[#162218] border border-[#2b3e2e] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#72f534]/15 border border-[#72f534]/30 flex items-center justify-center text-[#72f534]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      Interactive Live Test Trigger
                    </h3>
                    <p className="text-xs text-slate-400">
                      Click below to simulate watching a reel and watch the live numbers update!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTestWatchClick}
                  className="w-full sm:w-auto px-4 py-2 bg-[#72f534] hover:bg-[#86ff4d] text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg"
                >
                  {hasTestedWatch ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Reel Logged! +1</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Simulate Watching Reel (+1)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step by step guide */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#72f534]">
                  কীভাবে এখনই ফুল ফিচার টেস্ট করবেন (Test Walkthrough):
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Step 1 */}
                  <div className="p-3.5 bg-[#121a14] border border-[#213024] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#72f534] bg-[#72f534]/10 px-2 py-0.5 rounded-lg">
                        ধাপ ১: রিলস প্লেয়ার ও কাউন্টার
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      মাঝখানের ভিডিও স্ক্রিনে <b>Play / Next Reel</b> বাটনে চাপুন। রিলের উপরে বাম পাশে <b>সবুজ প্লে আইকন ও লাইভ কাউন্ট ব্যাজ</b> দেখতে পাবেন। ৩ সেকেন্ড দেখলেই অটোমেটিক রিল কাউন্ট হবে!
                    </p>
                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => {
                          onClose();
                        }}
                        className="text-[11px] text-[#72f534] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        ভিডিও ফিড দেখুন <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 bg-[#121a14] border border-[#213024] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#72f534] bg-[#72f534]/10 px-2 py-0.5 rounded-lg">
                        ধাপ ২: ৪টি সোশ্যাল মিডিয়া সুইচ
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      উপরে <b>YouTube Shorts, Instagram Reels, TikTok, এবং Facebook Reels</b> ট্যাবে ক্লিক করে প্ল্যাটফর্ম পরিবর্তন করুন। প্রতিটি প্ল্যাটফর্মের রিলস এবং টাইম আলাদাভাবে কাউন্ট হবে।
                    </p>
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {(['youtube', 'instagram', 'tiktok', 'facebook'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            onSwitchPlatform(p);
                            onClose();
                          }}
                          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-md text-[10px] text-slate-200 flex items-center gap-1 cursor-pointer capitalize"
                        >
                          <PlatformIcon platform={p} className="w-2.5 h-2.5" />
                          <span>{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 bg-[#121a14] border border-[#213024] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#72f534] bg-[#72f534]/10 px-2 py-0.5 rounded-lg">
                        ধাপ ৩: View Details &amp; History
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      পপআপের <b>"View Details &gt;"</b> বা নিচের <b>History</b> ট্যাবে ক্লিক করুন। সেখানে <b>Hours Lost in a Day</b>, <b>Full Week &amp; Full Month Summary</b>, এবং <b>Daily Average</b> দেখতে পাবেন।
                    </p>
                    <button
                      onClick={() => {
                        onOpenTab('history');
                        onClose();
                      }}
                      className="text-[11px] text-[#72f534] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      হিস্ট্রি ও বিস্তারিত অ্যানালিটিক্স খুলুন <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 bg-[#121a14] border border-[#213024] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#72f534] bg-[#72f534]/10 px-2 py-0.5 rounded-lg">
                        ধাপ ৪: Local-First IndexedDB &amp; Privacy
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      নিচের <b>Settings</b> ট্যাবে গিয়ে <b>Privacy &amp; Storage</b> এ যান। সেখানে <b>IndexedDB Local Storage</b> স্ট্যাটাস, <b>AES-GCM পাসফ্রেজ এনক্রিপশন</b>, এবং <b>JSON/CSV এক্সপোর্ট</b> টেস্ট করতে পারবেন।
                    </p>
                    <button
                      onClick={() => {
                        onOpenTab('settings');
                        onClose();
                      }}
                      className="text-[11px] text-[#72f534] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      প্রাইভেসি ও এনক্রিপশন সেটিংস খুলুন <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Chrome Install Quick Step Cards */}
              <div className="p-4 bg-[#17251a] border border-[#2d4231] rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FolderArchive className="w-5 h-5 text-[#72f534] shrink-0" />
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        আসল Google Chrome-এ ইনস্টল করার সহজ নিয়ম
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        ScrollMeter একটি 100% সম্পূর্ণ Chrome Manifest V3 Extension
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={downloadManifestDirectly}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                      title="Download manifest.json directly"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-[#72f534]" />
                      <span>manifest.json ডাউনলোড</span>
                    </button>

                    <button
                      onClick={onDownloadZip}
                      className="px-3.5 py-1.5 bg-[#72f534] hover:bg-[#86ff4d] text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow transition-transform active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Extension ZIP</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Crucial manifest.json troubleshooting guide callout */}
              <div className="p-4 bg-[#232616] border border-[#525725] rounded-2xl space-y-2.5 text-xs text-amber-100">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>আনজিপ করার পর manifest.json দেখতে পাচ্ছেন না? এটি পড়ুন:</span>
                </div>
                <div className="space-y-2 text-slate-300 leading-relaxed text-xs">
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <b className="text-white">১. উইন্ডোজের ফাইল এক্সটেনশন লুকানো (Windows File Extension Hide):</b>
                    <p className="text-slate-400">
                      Windows অপারেটিং সিস্টেমে ডিফল্টভাবে ফাইলের নামের শেষের <span className="font-mono text-amber-300">.json</span> লুকানো থাকে। ফলে ফোল্ডারে ফাইলটির নাম শুধুই <b className="text-white">"manifest"</b> দেখায় (এবং Type কলামে 'JSON File' লেখা থাকে)। এটিই আসল <b>manifest.json</b> ফাইল!
                    </p>
                    <p className="text-[11px] text-slate-400">
                      👉 <b>যেভাবে .json দেখবেন:</b> Windows File Explorer-এর উপরে <span className="text-[#72f534] font-medium">View &gt; Show &gt; File name extensions</span> টিক দিয়ে অন করলেই <span className="font-mono text-white">manifest.json</span> দেখতে পাবেন।
                    </p>
                  </div>

                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <b className="text-white">২. Chrome-এ ফোল্ডার নির্বাচন (Load unpacked folder):</b>
                    <p className="text-slate-400">
                      ZIP আনজিপ করার পর ভেতরে যদি ডাবল ফোল্ডার তৈরি হয়, তবে ঠিক যে ফোল্ডারটি খুললে <span className="font-mono text-white">manifest</span>, <span className="font-mono text-white">background</span>, <span className="font-mono text-white">content</span>, <span className="font-mono text-white">popup</span> ফাইলগুলো রয়েছে, Chrome-এর <b>"Load unpacked"</b> বাটনে চাপ দিয়ে ওই নির্দিষ্ট ফোল্ডারটি সিলেক্ট করতে হবে।
                    </p>
                  </div>

                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <b className="text-white">৩. আলাদাভাবে manifest.json নিতে চান?</b>
                      <p className="text-slate-400 text-[11px]">
                        কোনো ঝামেলা ছাড়া এখনই এক ক্লিকে সরাসরি manifest.json ফাইলটি ডাউনলোড করে ফোল্ডারে রাখতে পারেন:
                      </p>
                    </div>
                    <button
                      onClick={downloadManifestDirectly}
                      className="px-3 py-1.5 bg-[#72f534] hover:bg-[#86ff4d] text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download manifest.json (এক ক্লিকে)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step-by-step numbered list */}
              <div className="space-y-3">
                <div className="p-3 bg-[#111813] border border-[#202e23] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#72f534] text-black font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ১
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">ZIP ফাইলটি ডাউনলোড ও আনজিপ করুন</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      উপরে দেওয়া <b className="text-white">"Download Extension ZIP"</b> বাটনে ক্লিক করে <span className="font-mono text-[#72f534]">scrollmeter-chrome-extension-v3.zip</span> ফাইলটি ডাউনলোড করুন এবং আপনার কম্পিউটারে Extract (Unzip) করুন।
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#111813] border border-[#202e23] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#72f534] text-black font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ২
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">ক্রোম এক্সটেনশন পেজে যান</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      আপনার Google Chrome ব্রাউজারের অ্যাড্রেস বারে <span className="font-mono text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/10">chrome://extensions/</span> লিখে এন্টার চাপুন।
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#111813] border border-[#202e23] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#72f534] text-black font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ৩
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">"Developer mode" অন করুন</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Chrome Extensions পেজের উপরে ডান কোণায় থাকা <b className="text-white">Developer mode</b> টগল সুইচটি অন করে দিন।
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#111813] border border-[#202e23] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#72f534] text-black font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ৪
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">"Load unpacked" দিয়ে ফোল্ডার সিলেক্ট করুন</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      উপরে বাম পাশে <b className="text-[#72f534]">"Load unpacked"</b> বাটনে ক্লিক করে আনজিপ করা ফোল্ডারটি (যেখানে manifest.json আছে) সিলেক্ট করুন। সাথে সাথে ScrollMeter ইনস্টল হয়ে যাবে!
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#111813] border border-[#202e23] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#72f534] text-black font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ৫
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">টেস্ট করুন YouTube Shorts বা Instagram Reels এ!</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      এবার নতুন ট্যাবে <span className="font-mono text-white">youtube.com/shorts</span> বা <span className="font-mono text-white">instagram.com/reels</span> খুলুন। ভিডিও দেখার সাথে সাথে ScrollMeter ব্যাকগ্রাউন্ডে এবং পপআপে আপনার দেখার সময় ও সংখ্যা ট্র্যাক করবে!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#202e22] bg-[#141d16] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#72f534]" />
            <span>100% Local-First &amp; Privacy Guaranteed. No cloud telemetry.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={onDownloadZip}
              className="px-4 py-2 bg-[#72f534] hover:bg-[#86ff4d] text-black font-semibold rounded-xl flex items-center gap-1.5 shadow transition-transform active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Extension ZIP</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
