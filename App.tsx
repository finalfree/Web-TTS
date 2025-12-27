import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Square, 
  Settings2, 
  Mic, 
  Volume2,
  AlertCircle,
  Languages,
  Search
} from 'lucide-react';
import AudioVisualizer from './components/AudioVisualizer';
import { VoiceOption } from './types';

const App: React.FC = () => {
  // State
  const [text, setText] = useState<string>("Hello! Type something here and I will read it out loud using Microsoft Edge Neural voices.");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [systemVoices, setSystemVoices] = useState<VoiceOption[]>([]);
  const [voiceFilter, setVoiceFilter] = useState<string>(""); // Filter state
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // We don't use AudioContext for native TTS as it's not exposed, 
  // so we pass null to visualizer to trigger "simulation" mode.
  const analyserNode = null; 

  // Load System Voices (Edge/Browser)
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length === 0) return;

      // Filter and Sort: Prioritize "Microsoft" voices for Edge feel
      const formatted: VoiceOption[] = voices.map(v => ({
        id: v.name,
        name: `${v.name} (${v.lang})`,
        lang: v.lang,
        default: v.default
      })).sort((a, b) => {
        // Prioritize Microsoft voices
        const aIsEdge = a.id.includes('Microsoft');
        const bIsEdge = b.id.includes('Microsoft');
        if (aIsEdge && !bIsEdge) return -1;
        if (!aIsEdge && bIsEdge) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setSystemVoices(formatted);

      // Set default voice if not set
      if (!selectedVoice && formatted.length > 0) {
        // Try to find a Microsoft English voice first
        const edgeVoice = formatted.find(v => v.id.includes('Microsoft') && v.lang?.startsWith('en'));
        const defaultVoice = formatted.find(v => v.default);
        setSelectedVoice(edgeVoice ? edgeVoice.id : (defaultVoice ? defaultVoice.id : formatted[0].id));
      }
    };

    loadVoices();
    
    // Some browsers load voices async
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  const stopAudio = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  const handlePlay = async () => {
    setError(null);
    stopAudio();

    if (!text.trim()) {
      setError("Please enter some text to speak.");
      return;
    }

    try {
      const utter = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === selectedVoice);
      
      if (voice) utter.voice = voice;
      
      // Setup state tracking for system speech
      utter.onstart = () => setIsPlaying(true);
      utter.onend = () => setIsPlaying(false);
      utter.onerror = (e) => {
        setIsPlaying(false);
        console.error(e);
        // Sometimes cancel triggers error, ignore if intentional
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
             setError(`System TTS error: ${e.error}`);
        }
      };

      window.speechSynthesis.speak(utter);
    } catch (e: any) {
      setError("Failed to use system speech.");
    }
  };

  // Filter logic
  const filteredVoices = systemVoices.filter(v => 
    v.name.toLowerCase().includes(voiceFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center p-4 md:p-8">
      
      {/* Header */}
      <header className="w-full max-w-4xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-blue-600 rounded-lg">
              <Mic className="w-6 h-6 text-white" />
            </span>
            OmniVoice Studio
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Native Browser Text-to-Speech (Edge Optimized)
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
           <span className="text-xs text-zinc-400 font-medium">
             System Engine Ready
           </span>
        </div>
      </header>

      <main className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Main Control Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          
          {/* Left Panel: Settings */}
          <div className="p-6 md:col-span-1 bg-zinc-900/50 space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Configuration
              </label>
              
               <div className="flex items-center gap-3 p-3 rounded-lg border bg-zinc-800/50 border-zinc-700 text-zinc-300">
                  <Languages className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Browser Native</div>
                    <div className="text-[10px] opacity-70">Using local/OS voices</div>
                  </div>
                </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Voice Selection
              </label>

              {/* Filter Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <input 
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-lg pl-9 pr-2.5 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-zinc-600 transition-all"
                  placeholder="Filter (e.g. 'Natural', 'JP')..."
                  value={voiceFilter}
                  onChange={(e) => setVoiceFilter(e.target.value)}
                />
              </div>

              <select 
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                 {systemVoices.length === 0 ? (
                     <option>Loading system voices...</option>
                  ) : filteredVoices.length === 0 ? (
                     <option disabled>No voices match filter</option>
                  ) : (
                    filteredVoices.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))
                  )}
              </select>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Tip: For the best experience, use Microsoft Edge on Windows to access high-quality "Microsoft Natural" voices.
              </p>
            </div>
          </div>

          {/* Right Panel: Input & Vis */}
          <div className="p-6 md:col-span-2 flex flex-col h-full min-h-[500px]">
            
            {/* Visualizer Area */}
            <div className="mb-6 relative group">
               <AudioVisualizer analyser={analyserNode} isPlaying={isPlaying} />
               {!isPlaying && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-zinc-700 text-sm font-medium">Ready to speak</p>
                 </div>
               )}
            </div>

            {/* Text Input */}
            <div className="flex-1 mb-4 relative">
              <textarea 
                className="w-full h-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-zinc-200 resize-none focus:ring-1 focus:ring-blue-500 outline-none text-base leading-relaxed placeholder-zinc-600 font-light"
                placeholder="Enter text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="absolute bottom-4 right-4 text-xs text-zinc-600">
                {text.length} chars
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4 border-t border-zinc-800 pt-6">
              {!isPlaying ? (
                <button
                  onClick={handlePlay}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-lg font-medium transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Speak Text
                </button>
              ) : (
                <button
                  onClick={stopAudio}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded-lg font-medium transition-all"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Stop
                </button>
              )}
            </div>

          </div>
        </div>
      </main>

      <footer className="mt-8 text-zinc-600 text-xs text-center max-w-lg leading-relaxed">
        <p>Built with React & Tailwind.</p>
        <p>Running in Native Mode.</p>
      </footer>
    </div>
  );
};

export default App;