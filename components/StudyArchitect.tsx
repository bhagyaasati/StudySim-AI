
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { analyzeStudyTopic, finalizeStudyPackage, generateQuiz, queryDeepDive, generateStudySimulator, getInterestingFacts } from '../services/geminiService';
import { LoadingState, StudyPlan, QuizQuestion, DeepDiveMessage, SavedSession } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { Brain, FileText, Image as ImgIcon, Video as VideoIcon, Loader2, X, CheckCircle, Play, Mic, Plus, ArrowRight, Paperclip, Music, FileType, GraduationCap, MessageSquare, Download, Share2, Send, RotateCcw, Sparkles, Clock, Trash2, Calendar, Gamepad2, ChevronRight, Maximize2, Minimize2, Lightbulb, Code2, Database, Eye, Check, AlertCircle, User, Sigma, Atom, Globe, Dna } from 'lucide-react';

type WorkflowStep = 'INPUT' | 'ANALYZING' | 'BUILDING' | 'DONE';
type ResultTab = 'NOTES' | 'SIMULATOR' | 'QUIZ' | 'DEEP_DIVE';

const StudyArchitect: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(LoadingState.IDLE);
  const [step, setStep] = useState<WorkflowStep>('INPUT');
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [result, setResult] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading Screen State
  const [progress, setProgress] = useState(0);
  const [waitFacts, setWaitFacts] = useState<string[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Result Tabs State
  const [activeTab, setActiveTab] = useState<ResultTab>('NOTES');
  
  // Simulator State
  const [isGeneratingSim, setIsGeneratingSim] = useState(false);
  const [isFullScreenSim, setIsFullScreenSim] = useState(false);
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Quiz State
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Deep Dive State
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<DeepDiveMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // History / Session State
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // --- Persistence Logic ---
  useEffect(() => {
    const saved = localStorage.getItem('studysim_sessions');
    if (saved) {
        try {
            setSessions(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }
  }, []);

  // --- Escape Key Listener for Full Screen ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullScreenSim) {
            setIsFullScreenSim(false);
        }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullScreenSim]);

  const saveSessionsToStorage = (updatedSessions: SavedSession[]) => {
      setSessions(updatedSessions);
      localStorage.setItem('studysim_sessions', JSON.stringify(updatedSessions));
  };

  const updateCurrentSession = (updates: Partial<SavedSession>) => {
      if (!currentSessionId) return;
      const updatedSessions = sessions.map(s => 
          s.id === currentSessionId ? { ...s, ...updates, result: updates.result ? { ...s.result, ...updates.result } : s.result } : s
      );
      saveSessionsToStorage(updatedSessions);
  };

  // Auto-save quiz and chat changes
  useEffect(() => {
      if (currentSessionId && step === 'DONE') {
          updateCurrentSession({ quizQuestions, chatHistory });
      }
  }, [quizQuestions, chatHistory]);

  const loadSession = (session: SavedSession) => {
      setInputText(session.topic);
      setPlan(session.plan);
      setResult(session.result);
      setQuizQuestions(session.quizQuestions || []);
      setChatHistory(session.chatHistory || []);
      setCurrentSessionId(session.id);
      setStep('DONE');
      setActiveTab('NOTES');
      setShowHistory(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const updated = sessions.filter(s => s.id !== id);
      saveSessionsToStorage(updated);
      if (currentSessionId === id) {
          setStep('INPUT');
          setCurrentSessionId(null);
      }
  };

  // --- Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          setFiles(prev => [...prev, ...newFiles]);
      }
  };

  const removeFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = async () => {
    if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], "voice_note.webm", { type: 'audio/webm' });
                setFiles(prev => [...prev, file]);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied", err);
            alert("Could not access microphone.");
        }
    }
  };

  // --- Loading Logic Helpers ---
  const startProgressSimulation = () => {
      setProgress(0);
      const interval = setInterval(() => {
          setProgress(prev => {
              if (prev >= 95) {
                  clearInterval(interval);
                  return 95;
              }
              // Fast at start, slow at end
              const increment = Math.max(0.5, (95 - prev) / 20);
              return prev + increment;
          });
      }, 500);
      return interval;
  };

  const startFactRotation = () => {
      setCurrentFactIndex(0);
      const interval = setInterval(() => {
          setCurrentFactIndex(prev => prev + 1);
      }, 30000); // Rotate every 30 seconds
      return interval;
  };

  // --- MAIN FLOW ---
  const handleStartStudy = async () => {
    if (!inputText && files.length === 0) return;
    setLoading(LoadingState.LOADING);
    setStep('ANALYZING'); // Step 1: Research & Architect
    
    // Start Progress
    const progInterval = startProgressSimulation();
    let factInterval: ReturnType<typeof setInterval> | null = null;
    
    try {
        let mediaData = undefined;
        let isVideo = false;
        
        const mediaFile = files.find(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        
        if (mediaFile) {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(mediaFile);
            });
            mediaData = { data: base64, mimeType: mediaFile.type };
            isVideo = mediaFile.type.startsWith('video/');
        }

        const combinedInput = inputText + (files.length > 0 ? `\n\n[Attached Files: ${files.map(f => f.name).join(', ')}]` : "");

        // 1. Facts & Search
        const { facts, searchContext } = await getInterestingFacts(combinedInput);
        if (facts.length > 0) {
            setWaitFacts(facts);
            factInterval = startFactRotation();
        }

        // 2. Architect Plan (Silent Phase)
        const planData = await analyzeStudyTopic(combinedInput, mediaData, isVideo, searchContext);
        setPlan(planData);

        // 3. Generate Content (Building Phase)
        setStep('BUILDING');
        // We do not stop here. We immediately proceed to generate the notes using the plan.
        const resultData = await finalizeStudyPackage(planData.markdownPlan, inputText);
        
        // 4. Finish
        setResult(resultData);
        setLoading(LoadingState.SUCCESS);
        setStep('DONE');
        setActiveTab('NOTES');
        setProgress(100);
        
        // Save Session
        const newSession: SavedSession = {
            id: Date.now().toString(),
            topic: inputText || "Untitled Study Session",
            timestamp: Date.now(),
            plan: planData,
            result: resultData,
            quizQuestions: [],
            chatHistory: []
        };
        saveSessionsToStorage([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);

        setQuizQuestions([]);
        setChatHistory([]);
    } catch (e) {
        console.error(e);
        setLoading(LoadingState.ERROR);
        setStep('INPUT');
    } finally {
        clearInterval(progInterval);
        if (factInterval) clearInterval(factInterval);
    }
  };

  const handleGenerateSimulator = async () => {
      if (!plan || !result) return;
      setIsGeneratingSim(true);
      try {
          const code = await generateStudySimulator(plan.markdownPlan, result.markdown);
          const updatedResult = { ...result, simulatorCode: code };
          setResult(updatedResult);
          
          if (currentSessionId) {
             const updatedSessions = sessions.map(s => 
                  s.id === currentSessionId ? { ...s, result: updatedResult } : s
             );
             saveSessionsToStorage(updatedSessions);
          }

      } catch (e) {
          console.error("Failed to generate simulator", e);
      }
      setIsGeneratingSim(false);
  };

  const extractSimulatorCode = (text: string) => {
      const match = text.match(/```html([\s\S]*?)```/);
      return match ? match[1] : null;
  };
  const simulatorCode = result?.simulatorCode || (result ? extractSimulatorCode(result.markdown) : null);

  const handleCopyCode = async () => {
    if (!simulatorCode) return;
    try {
        await navigator.clipboard.writeText(simulatorCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
        console.error('Failed to copy code', err);
        // Fallback or alert if needed
    }
  };

  const handleExportPDF = () => {
      const element = document.getElementById('markdown-content');
      if (!element) return;
      // @ts-ignore
      if (typeof window.html2pdf !== 'undefined') {
          const opt = {
              margin: [0.5, 0.5, 0.5, 0.5],
              filename: `StudySim_${(inputText || 'Notes').slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, letterRendering: true },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
          };
          // @ts-ignore
          window.html2pdf().set(opt).from(element).save();
      } else {
          window.print();
      }
  };

  const handleExportDOCX = () => {
      const element = document.getElementById('markdown-content');
      if (!element) return;
      
      const rawContent = element.innerHTML;
      const docContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>StudySim Notes</title>
            <style>
                body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.6; color: #000000; }
                h1 { font-size: 24pt; color: #2E74B5; border-bottom: 2px solid #2E74B5; padding-bottom: 10px; margin-bottom: 20px; }
                h2 { font-size: 18pt; color: #1F4E79; margin-top: 20px; }
                h3 { font-size: 14pt; color: #2E74B5; margin-top: 15px; }
                p { font-size: 11pt; margin-bottom: 10px; }
                li { margin-bottom: 5px; }
                strong { color: #2E74B5; }
                code { background-color: #F0F0F0; padding: 2px 4px; border-radius: 4px; font-family: 'Consolas', monospace; }
                .study-header { text-align: center; margin-bottom: 40px; }
            </style>
        </head>
        <body>
            <div class="study-header">
                <h1>${inputText || "StudySim Generated Notes"}</h1>
                <p>Generated by StudySim AI on ${new Date().toLocaleDateString()}</p>
            </div>
            ${rawContent}
        </body>
        </html>
      `;
      
      const blob = new Blob(['\ufeff', docContent], {
          type: 'application/msword;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `StudySim_${(inputText || 'Notes').slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleGenerateQuiz = async () => {
      if (!result) return;
      setQuizLoading(true);
      try {
          const questions = await generateQuiz(result.markdown);
          setQuizQuestions(questions);
          setSelectedAnswers({});
          setQuizSubmitted(false);
      } catch (e) {
          console.error("Quiz Error", e);
      }
      setQuizLoading(false);
  };

  const handleQuizSubmit = () => {
      setQuizSubmitted(true);
  };

  const handleChatSubmit = async (e?: React.FormEvent, manualInput?: string) => {
      e?.preventDefault();
      const inputToUse = manualInput || chatInput;
      if (!inputToUse.trim() || chatLoading) return;

      const userMsg: DeepDiveMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: inputToUse,
          timestamp: Date.now()
      };

      setChatHistory(prev => [...prev, userMsg]);
      setChatInput('');
      setChatLoading(true);

      try {
          const response = await queryDeepDive(chatHistory, result?.markdown || "", userMsg.content);
          const aiMsg: DeepDiveMessage = {
              id: (Date.now() + 1).toString(),
              role: 'ai',
              content: response,
              timestamp: Date.now()
          };
          setChatHistory(prev => [...prev, aiMsg]);
      } catch (e) {
          console.error("Chat Error", e);
      }
      setChatLoading(false);
  };

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const displayText = result ? result.markdown.replace(/```html([\s\S]*?)```/, '') : '';

  // Suggestions for empty chat
  const chatSuggestions = [
    "Explain the key concepts simply",
    "Give me a real-world example",
    "Create a practice problem",
    "Summarize the main points"
  ];

  // Input Suggestions
  const inputSuggestions = [
    { icon: <Atom size={14}/>, text: "Quantum Mechanics" },
    { icon: <Sigma size={14}/>, text: "Calculus Derivatives" },
    { icon: <Globe size={14}/>, text: "French Revolution" },
    { icon: <Dna size={14}/>, text: "Photosynthesis" }
  ];

  // --- RENDER ---
  if (step === 'INPUT') {
      return (
        <div className="relative w-full h-[calc(100vh-100px)] min-h-[600px] flex flex-col items-center justify-center p-4">
            {/* Background Gradients */}
            <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 w-full h-full" style={{ maskImage: 'radial-gradient(circle at center, black 30%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 100%)' }}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-purple-500/30 dark:bg-purple-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[128px] animate-blob"></div>
                </div>
            </div>

            {/* History Toggle */}
            <button 
                onClick={() => setShowHistory(true)} 
                className="absolute top-2 left-2 md:top-4 md:left-4 z-20 p-3 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black backdrop-blur-xl transition-all shadow-lg text-gray-700 dark:text-gray-200 active:scale-95 border border-white/20"
                title="View History"
            >
                <Clock size={20} />
            </button>

            {/* History Sidebar */}
            {showHistory && (
                <div className="absolute inset-y-0 left-0 w-full md:w-80 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border-r border-border shadow-2xl z-30 flex flex-col transition-transform animate-in slide-in-from-left duration-300 md:rounded-r-[2rem]">
                    <div className="p-4 md:p-6 border-b border-border flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2"><Clock size={18}/> History</h3>
                        <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full active:scale-95 transition-transform"><X size={18}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {sessions.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10 text-sm flex flex-col items-center gap-2">
                                <Clock size={24} className="opacity-50"/>
                                <span>No recent sessions found.</span>
                            </div>
                        ) : (
                            sessions.map(s => (
                                <div key={s.id} onClick={() => loadSession(s)} className="p-4 rounded-xl bg-surface-highlight hover:bg-gray-100 dark:hover:bg-[#252525] border border-border cursor-pointer group transition-all relative active:scale-98">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">{s.topic}</h4>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(s.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => deleteSession(e, s.id)} 
                                        className="absolute top-2 right-2 p-1.5 bg-white dark:bg-black rounded-lg text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all active:scale-90"
                                        title="Delete Session"
                                    >
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8 md:mb-10">
                    <h2 className="text-3xl md:text-5xl font-medium text-gray-900 dark:text-white mb-3 tracking-tight">
                    What do you want to <span className="font-serif italic bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">master</span> today?
                    </h2>
                    <p className="text-base md:text-lg text-gray-500 dark:text-gray-400">
                        Upload notes, record a lecture, or ask a question.
                    </p>
                </div>
                
                {/* Input Card Container */}
                <div className="bg-white dark:bg-[#161616] rounded-3xl md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/50 border border-gray-100 dark:border-white/5 p-3 transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-black/80 focus-within:ring-2 focus-within:ring-purple-500/20 group">
                    
                    {files.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto p-3 custom-scrollbar border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 rounded-t-2xl">
                            {files.map((f, i) => (
                                <div key={i} className="animate-in fade-in zoom-in-95 duration-200 flex-shrink-0 bg-white dark:bg-[#252525] pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <span className="truncate max-w-[100px] md:max-w-[120px]">{f.name}</span>
                                    <button onClick={() => removeFile(i)} className="w-5 h-5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 flex items-center justify-center transition-colors"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea 
                        className="w-full bg-transparent text-lg md:text-xl p-4 md:p-6 min-h-[100px] md:min-h-[120px] outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 resize-none font-sans"
                        placeholder="Type a topic, paste a link, or describe your goal..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                    />

                    {/* Suggestion Chips */}
                    {!inputText && files.length === 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide pb-4">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mr-1 flex-shrink-0">Try:</span>
                            {inputSuggestions.map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setInputText(s.text)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-[#202020] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] border border-gray-200 dark:border-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors whitespace-nowrap active:scale-95"
                                >
                                    {s.icon} {s.text}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 pb-2 pt-2 gap-3 border-t border-gray-100 dark:border-white/5 mt-1">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="p-3 md:p-4 rounded-full hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500 dark:text-gray-400 transition-all active:scale-95 active:bg-gray-200 dark:active:bg-[#333]" 
                                title="Upload File"
                            >
                                <Plus size={22} />
                            </button>
                            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" />
                            <button 
                                onClick={toggleRecording} 
                                className={`p-3 md:p-4 rounded-full transition-all active:scale-95 ${isRecording ? 'bg-red-50 text-red-500 ring-2 ring-red-500/20 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}
                                title="Record Audio"
                            >
                                <Mic size={22} />
                            </button>
                        </div>
                        <button 
                            onClick={handleStartStudy} 
                            disabled={!inputText && files.length === 0} 
                            className={`px-8 py-3.5 md:py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto text-sm md:text-base active:scale-95 disabled:active:scale-100 ${(!inputText && files.length === 0) ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:shadow-pink-500/30 hover:-translate-y-0.5'}`}
                        >
                            {loading === LoadingState.LOADING ? <Loader2 className="animate-spin" size={20} /> : <>Start Learning <ArrowRight size={20} /></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- DONE STATE / RESULTS ---
  return (
    <div className="flex flex-col h-full min-h-[600px] gap-4 md:gap-6 max-w-7xl mx-auto pb-8 md:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Navigation & Status Header */}
        <div className="flex flex-wrap items-center justify-between px-2 md:px-4 gap-4">
             <div className="flex items-center gap-4">
                 <button onClick={() => setStep('INPUT')} className="flex items-center gap-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors active:scale-95">
                     <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-sm">
                        <ArrowRight className="rotate-180" size={14}/>
                     </div>
                     <span className="font-bold text-sm hidden sm:inline">Back</span>
                 </button>
                 <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-700"></div>
                 <span className="text-sm font-mono font-bold text-primary tracking-wider uppercase">{step === 'DONE' ? 'RESULTS' : `${step} PHASE`}</span>
             </div>
             
             {/* Top Right Navigation Menu */}
             {step === 'DONE' && (
                 <div className="flex bg-surface-highlight border border-border rounded-xl p-1 gap-1 overflow-x-auto max-w-full scrollbar-hide shadow-sm">
                    {[
                        { id: 'NOTES', icon: FileText, label: 'Notes' },
                        { id: 'SIMULATOR', icon: Gamepad2, label: 'Simulator' },
                        { id: 'QUIZ', icon: GraduationCap, label: 'Quiz' },
                        { id: 'DEEP_DIVE', icon: MessageSquare, label: 'Deep Dive' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ResultTab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap active:scale-95
                            ${activeTab === tab.id 
                                ? 'bg-white dark:bg-[#252525] text-primary shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        </button>
                    ))}
                 </div>
             )}
        </div>

        {/* --- LOADING OVERLAY WITH FACTS --- */}
        {(step === 'ANALYZING' || step === 'BUILDING') && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-[#050505]/95 backdrop-blur-lg transition-all duration-500 px-6 text-center">
                
                <div className="max-w-xl w-full flex flex-col items-center">
                    {/* Spinner */}
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-primary animate-spin mb-8"></div>
                    
                    {/* Status Text */}
                    <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2 animate-fade-in">
                        {step === 'ANALYZING' ? "Deconstructing Topic..." : "Authoring Content..."}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">AI is architecting your learning experience</p>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-12 relative shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] w-full h-full" style={{ backgroundImage: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)', backgroundSize: '200% 100%' }}></div>
                        </div>
                    </div>

                    {/* Rotating Facts */}
                    {waitFacts.length > 0 && (
                        <div className="bg-surface-highlight border border-border p-6 rounded-2xl w-full shadow-lg relative overflow-hidden group min-h-[140px] flex items-center justify-center">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                            <div className="absolute top-4 right-4 text-gray-300 dark:text-gray-600">
                                <Lightbulb size={24} />
                            </div>
                            
                            <div key={currentFactIndex} className="animate-fade-in flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-primary tracking-widest mb-3">Did you know?</span>
                                <p className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed italic">
                                    "{waitFacts[currentFactIndex % waitFacts.length]}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 modern-card bg-surface overflow-hidden relative flex flex-col shadow-2xl border border-white/20 dark:border-white/5 transition-all">
            
            {step === 'DONE' && result && (
                <div className="flex-1 flex flex-col h-full relative">
                     {/* Tab Content */}
                     <div className="flex-1 overflow-y-auto bg-surface custom-scrollbar relative">
                        
                        {/* NOTES TAB */}
                        {activeTab === 'NOTES' && (
                            <div className="p-4 md:p-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-end gap-2 mb-4 print:hidden">
                                     <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-1.5 bg-surface-highlight border border-border rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors active:scale-95">
                                        <Download size={12} /> PDF
                                     </button>
                                     <button onClick={handleExportDOCX} className="flex items-center gap-2 px-3 py-1.5 bg-surface-highlight border border-border rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors active:scale-95">
                                        <FileText size={12} /> DOCX
                                     </button>
                                </div>
                                <div id="markdown-content">
                                    <MarkdownRenderer content={displayText} />
                                </div>
                            </div>
                        )}

                        {/* SIMULATOR TAB */}
                        {activeTab === 'SIMULATOR' && (
                            simulatorCode ? (
                                <>
                                    {isFullScreenSim ? createPortal(
                                        <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in duration-200">
                                            {/* Header */}
                                            <div className="p-4 bg-white/5 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                                        <Gamepad2 size={16} className="text-white"/>
                                                    </div>
                                                    <div>
                                                        <span className="text-white text-sm font-bold tracking-wide block">Interactive Simulator</span>
                                                        <span className="text-[10px] text-gray-400 font-mono uppercase">Full Screen Mode</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={handleCopyCode} 
                                                        className="text-xs font-bold text-gray-300 hover:text-white px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 active:scale-95"
                                                    >
                                                        {copiedCode ? <Check size={14} className="text-green-400"/> : <Code2 size={14}/>} 
                                                        <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsFullScreenSim(false)} 
                                                        className="text-xs font-bold text-white bg-red-600/80 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 active:scale-95"
                                                    >
                                                        <Minimize2 size={14}/> Exit Fullscreen
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex-1 w-full h-full bg-[#111]">
                                                <iframe
                                                    srcDoc={simulatorCode}
                                                    className="w-full h-full border-0 block"
                                                    title="Simulator Fullscreen"
                                                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation"
                                                />
                                            </div>
                                        </div>,
                                        document.body
                                    ) : (
                                        <div className="w-full h-full min-h-[500px] relative bg-[#0a0a0a] flex flex-col transition-all duration-300 animate-in fade-in">
                                            {/* Simulator Header */}
                                            <div className="p-3 bg-white/5 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                                        <Gamepad2 size={16} className="text-white"/>
                                                    </div>
                                                    <div>
                                                        <span className="text-white text-sm font-bold tracking-wide block">Interactive Simulator</span>
                                                        <span className="text-[10px] text-gray-400 font-mono uppercase">HTML5 • Canvas • Physics</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={handleCopyCode} 
                                                        className="text-xs font-bold text-gray-300 hover:text-white px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 active:scale-95"
                                                    >
                                                        {copiedCode ? <Check size={14} className="text-green-400"/> : <Code2 size={14}/>} 
                                                        <span className="hidden sm:inline">{copiedCode ? 'Copied' : 'Copy Code'}</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsFullScreenSim(true)} 
                                                        className="text-xs font-bold text-gray-300 hover:text-white px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 active:scale-95"
                                                    >
                                                        <Maximize2 size={14}/>
                                                        <span className="hidden sm:inline">Expand</span>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Iframe Container */}
                                            <div className="flex-1 relative w-full h-full bg-[#111]">
                                                <iframe
                                                    srcDoc={simulatorCode}
                                                    className="w-full h-full border-0 block"
                                                    title="Simulator"
                                                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-6 md:p-8 text-center relative overflow-hidden animate-in fade-in">
                                    {/* Background decorative blob */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-[64px] animate-pulse"></div>

                                    <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 md:mb-8 shadow-2xl transform transition-transform hover:scale-105 duration-500 ring-4 ring-white/10">
                                        <Gamepad2 size={32} className="text-white md:w-10 md:h-10" />
                                    </div>
                                    <h3 className="relative z-10 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">Want a real-life simulator?</h3>
                                    <p className="relative z-10 text-gray-500 dark:text-gray-400 max-w-md mb-8 md:mb-10 text-base md:text-lg">
                                        AI Architect can code a custom HTML5 physics engine based on your notes in real-time.
                                    </p>
                                    
                                    {isGeneratingSim ? (
                                        <div className="relative z-10 flex flex-col items-center gap-4 bg-surface-highlight border border-border px-8 py-6 rounded-2xl shadow-lg animate-in zoom-in-95 duration-300">
                                            <div className="relative">
                                                <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white animate-pulse">Compiling Physics Engine...</span>
                                            <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 px-3 py-1 rounded-full animate-in fade-in slide-in-from-bottom-2 duration-700">
                                                <Database size={12}/> Research bundle injected
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md">
                                            {/* Research Badge */}
                                            {plan && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                                    <Database size={16}/>
                                                    Research Context Attached
                                                    <div className="w-px h-4 bg-blue-300 dark:bg-blue-700"></div>
                                                    <button onClick={() => setShowPlanPreview(!showPlanPreview)} className="hover:underline flex items-center gap-1 text-xs">
                                                        <Eye size={12}/> {showPlanPreview ? 'Hide Source' : 'View Source'}
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {showPlanPreview && plan && (
                                                <div className="w-full h-40 overflow-y-auto bg-surface-highlight border border-border rounded-xl p-3 text-xs text-left shadow-inner">
                                                    <MarkdownRenderer content={plan.markdownPlan.substring(0, 1000) + '...'} />
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                                <button 
                                                    onClick={() => setActiveTab('NOTES')}
                                                    className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors order-2 sm:order-1 active:scale-95"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleGenerateSimulator}
                                                    className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 order-1 sm:order-2 active:scale-95"
                                                >
                                                    <Sparkles size={18} /> Initiate Simulation
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        )}

                        {/* QUIZ TAB */}
                        {activeTab === 'QUIZ' && (
                            <div className="p-4 md:p-10 max-w-3xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {quizQuestions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary ring-4 ring-primary/5">
                                            <GraduationCap size={40} />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Ready to test your knowledge?</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                                            Generate a quick 5-question quiz based on your study notes to reinforce what you've learned.
                                        </p>
                                        <button 
                                            onClick={handleGenerateQuiz}
                                            disabled={quizLoading}
                                            className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/30 flex items-center gap-2 active:scale-95 hover:-translate-y-1"
                                        >
                                            {quizLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                            {quizLoading ? 'Generating Questions...' : 'Generate Quiz'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8 pb-10">
                                        <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Topic Assessment</h3>
                                            <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                                {Object.keys(selectedAnswers).length}/{quizQuestions.length} Answered
                                            </span>
                                        </div>

                                        {quizQuestions.map((q, idx) => (
                                            <div key={q.id} className="bg-surface-highlight border border-border p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex gap-3">
                                                    <span className="text-primary opacity-50">0{idx + 1}.</span> 
                                                    {q.question}
                                                </h4>
                                                <div className="space-y-3 pl-0 md:pl-8">
                                                    {q.options.map((opt, oIdx) => {
                                                        const isSelected = selectedAnswers[q.id] === oIdx;
                                                        const isCorrect = q.correctAnswer === oIdx;
                                                        
                                                        let btnClass = "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group active:scale-[0.99] ";
                                                        
                                                        if (quizSubmitted) {
                                                            if (isCorrect) btnClass += "bg-green-100 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300";
                                                            else if (isSelected && !isCorrect) btnClass += "bg-red-100 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-300";
                                                            else btnClass += "bg-surface border-border opacity-50";
                                                        } else {
                                                            if (isSelected) btnClass += "bg-primary/10 border-primary text-primary font-medium shadow-sm";
                                                            else btnClass += "bg-surface border-border hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-gray-600";
                                                        }

                                                        return (
                                                            <button 
                                                                key={oIdx}
                                                                onClick={() => !quizSubmitted && setSelectedAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                                                disabled={quizSubmitted}
                                                                className={btnClass}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
                                                                        isSelected || (quizSubmitted && isCorrect) ? 'border-current' : 'border-gray-300 dark:border-gray-600 text-gray-400'
                                                                    }`}>
                                                                        {['A','B','C','D'][oIdx]}
                                                                    </div>
                                                                    <span>{opt}</span>
                                                                </div>
                                                                {quizSubmitted && (
                                                                    isCorrect ? <CheckCircle size={20} /> : (isSelected && <X size={20} />)
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                {quizSubmitted && (
                                                    <div className="mt-4 ml-0 md:ml-8 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-xl flex gap-3 items-start animate-in fade-in">
                                                        <Lightbulb size={16} className="mt-0.5 flex-shrink-0" />
                                                        <p>{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {!quizSubmitted && (
                                            <div className="flex justify-center pt-4 pb-8">
                                                <button 
                                                    onClick={handleQuizSubmit}
                                                    disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                                                    className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
                                                >
                                                    Submit Answers
                                                </button>
                                            </div>
                                        )}
                                        
                                        {quizSubmitted && (
                                             <div className="flex justify-center pt-4 pb-8">
                                                <button 
                                                    onClick={handleGenerateQuiz}
                                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 active:scale-95"
                                                >
                                                    <RotateCcw size={16} /> New Quiz
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DEEP DIVE TAB */}
                        {activeTab === 'DEEP_DIVE' && (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300 relative bg-gray-50/50 dark:bg-black/20">
                                
                                {/* Chat History Area */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
                                    {chatHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/10">
                                                <MessageSquare size={32} className="text-gray-900 dark:text-white" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Deep Dive</h3>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
                                                I'm your personal tutor for this topic. Ask me anything, or pick a suggestion below.
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                                                {chatSuggestions.map((s, i) => (
                                                    <button 
                                                        key={i}
                                                        onClick={() => handleChatSubmit(undefined, s)}
                                                        className="p-3 text-sm font-medium text-left bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-gray-700 dark:text-gray-300 active:scale-95"
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {chatHistory.map((msg) => (
                                                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2`}>
                                                    
                                                    {/* Avatar */}
                                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-800' : 'bg-gradient-to-br from-blue-600 to-purple-600'}`}>
                                                        {msg.role === 'user' ? <User size={14} className="text-gray-500 dark:text-gray-400"/> : <Brain size={14} className="text-white"/>}
                                                    </div>

                                                    {/* Message Bubble */}
                                                    <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                        <div className={`p-4 md:p-5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                                                            msg.role === 'user' 
                                                                ? 'bg-black dark:bg-white text-white dark:text-black rounded-tr-sm' 
                                                                : 'bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-tl-sm'
                                                        }`}>
                                                            {msg.role === 'user' ? (
                                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                            ) : (
                                                                <MarkdownRenderer content={msg.content} variant="chat" />
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    
                                    {/* Typing Indicator */}
                                    {chatLoading && (
                                        <div className="flex gap-4 animate-in fade-in">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex-shrink-0 flex items-center justify-center">
                                                <Brain size={14} className="text-white"/>
                                            </div>
                                            <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-12">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-t border-gray-200 dark:border-white/10">
                                    <div className="max-w-4xl mx-auto relative">
                                        <form onSubmit={(e) => handleChatSubmit(e)} className="relative group">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                                <Sparkles size={16} />
                                            </div>
                                            <input
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder="Ask a follow-up question..."
                                                className="w-full bg-gray-100 dark:bg-[#151515] border border-transparent focus:bg-white dark:focus:bg-black focus:border-primary/50 rounded-2xl py-4 pl-10 pr-14 outline-none transition-all shadow-inner focus:shadow-lg text-gray-900 dark:text-white placeholder-gray-500"
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={!chatInput.trim() || chatLoading} 
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md active:scale-95"
                                            >
                                                <ArrowRight size={16} />
                                            </button>
                                        </form>
                                        <div className="text-center mt-2">
                                            <p className="text-[10px] text-gray-400">AI can make mistakes. Check important info.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                     </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default StudyArchitect;
