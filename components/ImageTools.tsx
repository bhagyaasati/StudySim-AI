
import React, { useState } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { LoadingState } from '../types';
import { Image as ImageIcon, Wand2, Download, Minus, Check, Upload } from 'lucide-react';

const ImageTools: React.FC = () => {
  const [mode, setMode] = useState<'GENERATE' | 'EDIT'>('GENERATE');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(LoadingState.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [size, setSize] = useState<'1K'|'2K'|'4K'>('1K');
  const [aspect, setAspect] = useState<any>('1:1');

  const handleAction = async () => {
    if (!prompt) return;
    setLoading(LoadingState.LOADING);
    setResultImage(null);

    try {
        if (mode === 'GENERATE') {
            const url = await generateImage(prompt, size, aspect);
            setResultImage(url);
        } else {
            if (!sourceFile) throw new Error("Please upload an image to edit.");
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(sourceFile);
            });
            const url = await editImage(base64, sourceFile.type, prompt);
            setResultImage(url);
        }
        setLoading(LoadingState.SUCCESS);
    } catch (e) {
        console.error(e);
        setLoading(LoadingState.ERROR);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 h-auto lg:h-[calc(100vh-160px)] min-h-0 lg:min-h-[600px] max-w-7xl mx-auto pb-8">
        
        {/* CONTROL PANEL */}
        <div className="w-full lg:w-[400px] flex flex-col flex-shrink-0">
            <div className="modern-card flex-1 flex flex-col overflow-hidden relative p-6 md:p-8 bg-surface">
                
                <div className="flex items-center gap-5 mb-8 md:mb-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        {mode === 'GENERATE' ? <ImageIcon size={28} className="md:w-8 md:h-8" /> : <Wand2 size={28} className="md:w-8 md:h-8" />}
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-tight leading-none">Imagine</h2>
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => setMode('GENERATE')} className={`text-[10px] font-bold px-4 py-1.5 rounded-full border transition-colors tracking-wider ${mode === 'GENERATE' ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent' : 'border-gray-300 dark:border-zinc-800 text-gray-500 dark:text-zinc-500 hover:text-black dark:hover:text-white'}`}>GENERATE</button>
                            <button onClick={() => setMode('EDIT')} className={`text-[10px] font-bold px-4 py-1.5 rounded-full border transition-colors tracking-wider ${mode === 'EDIT' ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent' : 'border-gray-300 dark:border-zinc-800 text-gray-500 dark:text-zinc-500 hover:text-black dark:hover:text-white'}`}>EDIT</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 md:space-y-8 flex-1">
                    {mode === 'EDIT' && (
                        <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 tracking-widest">Source Image</label>
                                <div className="relative border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl h-16 bg-surface-highlight hover:bg-gray-100 dark:hover:bg-[#222] transition-colors group cursor-pointer">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs truncate px-4 gap-2 text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-white">
                                    {sourceFile ? <><Check size={16} className="text-primary"/> {sourceFile.name}</> : <><Upload size={16}/> UPLOAD SOURCE</>}
                                </div>
                                </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 tracking-widest">
                            {mode === 'GENERATE' ? 'Prompt' : 'Instruction'}
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={mode === 'GENERATE' ? "Describe your vision..." : "What should we change?"}
                            className="w-full h-32 md:h-40 bg-surface-input border border-border rounded-2xl p-4 md:p-5 text-sm text-gray-900 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-gray-400 dark:placeholder-zinc-600 leading-relaxed transition-all duration-300"
                        />
                    </div>

                    {mode === 'GENERATE' && (
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 tracking-widest">Quality</label>
                                    <select value={size} onChange={(e) => setSize(e.target.value as any)} className="w-full bg-surface-input border border-border rounded-xl p-3 text-xs text-gray-900 dark:text-gray-200 focus:outline-none">
                                    <option value="1K">1K (Standard)</option>
                                    <option value="2K">2K (High Res)</option>
                                    <option value="4K">4K (Ultra)</option>
                                    </select>
                            </div>
                            <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-3 tracking-widest">Aspect</label>
                                    <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="w-full bg-surface-input border border-border rounded-xl p-3 text-xs text-gray-900 dark:text-gray-200 focus:outline-none">
                                    <option value="1:1">Square</option>
                                    <option value="3:4">Portrait</option>
                                    <option value="16:9">Landscape</option>
                                    </select>
                            </div>
                        </div>
                    )}
                </div>
                
                <button
                    onClick={handleAction}
                    disabled={loading === LoadingState.LOADING}
                    className="w-full py-4 md:py-5 bg-gradient-to-r from-pink-600 to-rose-600 hover:shadow-lg hover:shadow-pink-500/25 text-white font-bold tracking-wide rounded-2xl transition-all flex items-center justify-center gap-2 text-sm mt-6 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    {loading === LoadingState.LOADING ? <Wand2 className="animate-spin" /> : mode === 'GENERATE' ? 'GENERATE' : 'APPLY EDITS'}
                </button>
            </div>
        </div>

        {/* OUTPUT CANVAS */}
        <div className="flex-1 modern-card flex flex-col relative overflow-hidden bg-surface min-h-[400px]">
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-main) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                {loading === LoadingState.LOADING && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                        <p className="text-[10px] font-mono text-gray-500 dark:text-zinc-500 animate-pulse tracking-widest uppercase">RENDERING PIXELS...</p>
                    </div>
                )}
                
                {resultImage && loading === LoadingState.SUCCESS && (
                    <div className="relative group max-h-full max-w-full w-full flex justify-center">
                        <img src={resultImage} alt="Generated" className="max-h-[500px] lg:max-h-full max-w-full object-contain rounded-xl shadow-2xl" />
                        <a 
                            href={resultImage} 
                            download="generated-image.png"
                            className="absolute bottom-4 right-4 bg-white text-black p-3 md:p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                            <Download size={20} />
                        </a>
                    </div>
                )}

                {!resultImage && loading !== LoadingState.LOADING && (
                    <div className="flex flex-col items-center justify-center opacity-10">
                         <ImageIcon size={64} className="mb-6 text-gray-900 dark:text-white"/>
                         <h3 className="text-2xl md:text-3xl font-black uppercase text-gray-900 dark:text-white tracking-widest text-center">Empty Canvas</h3>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ImageTools;
