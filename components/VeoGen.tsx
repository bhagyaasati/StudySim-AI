
import React, { useState } from 'react';
import { generateVeoVideo } from '../services/geminiService';
import { LoadingState } from '../types';
import { Video, Sparkles, Film, Minus, Upload, Check } from 'lucide-react';

const VeoGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(LoadingState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleGenerate = async () => {
    if (!prompt && !imageFile) return;
    setLoading(LoadingState.LOADING);
    setError(null);
    setVideoUrl(null);

    try {
      let base64Image = undefined;
      let mimeType = undefined;

      if (imageFile) {
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
             const base64 = reader.result as string;
             resolve(base64.split(',')[1]);
          };
          reader.readAsDataURL(imageFile);
        });
        mimeType = imageFile.type;
      }

      const uri = await generateVeoVideo(prompt, base64Image, mimeType, aspectRatio);
      const res = await fetch(`${uri}&key=${process.env.API_KEY}`);
      if (!res.ok) throw new Error("Failed to download generated video");
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      setVideoUrl(localUrl);
      setLoading(LoadingState.SUCCESS);

    } catch (e: any) {
      console.error(e);
      setError("Generation Failed. " + (e.message || ""));
      setLoading(LoadingState.ERROR);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto min-h-[600px] justify-center items-center pb-8">
        
        <div className="w-full max-w-3xl modern-card flex flex-col relative overflow-hidden bg-surface transition-colors duration-300">
            
            <div className="p-6 md:p-10 lg:p-16 relative flex-1 flex flex-col transition-colors duration-300">
                 <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-3 py-1 md:px-4 md:py-1.5 text-[10px] md:text-xs font-bold uppercase rounded-full border border-purple-200 dark:border-purple-800">
                    Veo 3.1 AI
                 </div>

                <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
                    <div className="p-4 md:p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                         <Film size={24} className="text-white md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white leading-none tracking-tight transition-colors duration-300">Veo Studio</h2>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-zinc-400 mt-2 uppercase tracking-[0.2em] transition-colors duration-300">Cinema Generation Engine</p>
                    </div>
                </div>

                <div className="space-y-6 md:space-y-8 flex-1">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 ml-1 tracking-widest">Screenplay / Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe a cinematic scene in detail..."
                            className="w-full h-28 md:h-32 bg-surface-input border border-border rounded-2xl p-4 md:p-5 text-base text-gray-900 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 placeholder-gray-400 dark:placeholder-zinc-600 leading-relaxed transition-all duration-300"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 ml-1 tracking-widest">Reference Frame</label>
                             <div className="relative border-2 border-dashed border-border rounded-2xl h-14 bg-surface-highlight hover:bg-gray-100 dark:hover:bg-[#222] transition-colors group cursor-pointer">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs truncate px-4 gap-2 text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-white">
                                     {imageFile ? <><Check size={16} className="text-primary"/> {imageFile.name}</> : <><Upload size={16}/> UPLOAD IMAGE</>}
                                </div>
                             </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 ml-1 tracking-widest">Format</label>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setAspectRatio('16:9')}
                                    className={`flex-1 py-2 font-bold rounded-xl border text-xs transition-all ${aspectRatio === '16:9' ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' : 'bg-surface-highlight text-gray-500 dark:text-zinc-500 border-border hover:text-black dark:hover:text-white'}`}
                                >
                                    16:9
                                </button>
                                <button 
                                    onClick={() => setAspectRatio('9:16')}
                                    className={`flex-1 py-2 font-bold rounded-xl border text-xs transition-all ${aspectRatio === '9:16' ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' : 'bg-surface-highlight text-gray-500 dark:text-zinc-500 border-border hover:text-black dark:hover:text-white'}`}
                                >
                                    9:16
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading === LoadingState.LOADING || (!prompt && !imageFile)}
                        className="w-full py-4 md:py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/30 text-white flex items-center justify-center gap-3 text-lg mt-4 md:mt-6 rounded-2xl font-bold tracking-wide transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading === LoadingState.LOADING ? (
                            <>
                                <Sparkles className="animate-spin" size={20} />
                                RENDERING...
                            </>
                        ) : (
                            <>
                                <Video size={20} fill="white" />
                                ACTION!
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-3">
                            <Minus className="bg-red-500 text-white rounded-full p-0.5" size={14} /> {error}
                        </div>
                    )}

                    {videoUrl && (
                        <div className="mt-8 border-4 border-black bg-black rounded-xl shadow-2xl relative overflow-hidden group">
                             <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded font-bold text-[10px] animate-pulse z-10">REC</div>
                            <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default VeoGen;
