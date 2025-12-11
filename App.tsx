
import React, { useState, useRef, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppMode } from './types';
import StudyArchitect from './components/StudyArchitect';
import ImageTools from './components/ImageTools';
import VeoGen from './components/VeoGen';
import { Brain, Image as ImgIcon, Video, Command, Check, Sparkles, ArrowRight, Play, Upload, Wand2, Zap, FileText, Layers, Plus, ChevronDown, Monitor, Share2, Grid, Moon, Sun, HelpCircle, Code, ShieldCheck, Microscope, Linkedin, Github } from 'lucide-react';

// --- Theme Toggle Component ---
const ThemeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        // Apply theme class to html element
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    return (
        <button 
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-gray-200 dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#222]"
        >
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
    );
};

// --- Landing Page Components ---

const LandingNav: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    return (
        <nav className="fixed top-0 w-full z-50 bg-[#FAFAFA]/90 dark:bg-[#09090B]/90 backdrop-blur-md h-16 md:h-24 transition-all duration-300 border-b border-gray-200 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
                         <Brain size={18} className="md:w-5 md:h-5" />
                    </div>
                    <span className="font-bold text-lg md:text-2xl tracking-tight text-gray-900 dark:text-white">StudySim</span>
                </div>

                {/* Center Links */}
                <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-500 dark:text-gray-400">
                    <a href="#how-it-works" className="hover:text-black dark:hover:text-white transition-colors">How it works</a>
                    <a href="#benefits" className="hover:text-black dark:hover:text-white transition-colors">Benefits</a>
                    <a href="#faq" className="hover:text-black dark:hover:text-white transition-colors">FAQ</a>
                </div>

                {/* Right Buttons */}
                <div className="flex items-center gap-3 md:gap-4">
                    <ThemeToggle />
                    <button className="text-[15px] font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors hidden sm:block">Log In</button>
                    <button 
                        onClick={onStart}
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm md:text-[15px] font-bold transition-all transform hover:scale-105"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </nav>
    );
};

const Hero: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    return (
        <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none opacity-50 dark:opacity-100">
                 <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] animate-blob"></div>
                 <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
                 <div className="absolute -bottom-20 left-1/2 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-8">
                            Interactive learning for <span className="block mt-2 font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x pb-2">everyone.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Transform static content into active understanding. Upload any material and let AI build custom simulations and smart notes instantly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button 
                                onClick={onStart}
                                className="group bg-gray-900 dark:bg-white text-white dark:text-black text-lg font-bold px-8 py-4 rounded-2xl hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Start Learning 
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="px-8 py-4 rounded-2xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                View Demo
                            </button>
                        </div>
                        
                        {/* Social Proof / Trust */}
                        <div className="mt-12 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500 font-medium">
                            <div className="flex -space-x-3">
                                {[
                                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&fit=crop",
                                    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&q=80&fit=crop",
                                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&q=80&fit=crop",
                                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&q=80&fit=crop"
                                ].map((src, i) => (
                                    <img 
                                        key={i} 
                                        src={src} 
                                        alt="Student" 
                                        className="w-10 h-10 rounded-full border-2 border-white dark:border-black object-cover" 
                                    />
                                ))}
                            </div>
                            <span>Trusted by 10,000+ students</span>
                        </div>
                    </div>

                    {/* Right Card - Dynamic Product Mockup */}
                    <div className="relative perspective-1000 group">
                         {/* Card Glow */}
                         <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                         
                         {/* Card Container */}
                         <div className="relative bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl transform transition-transform duration-500 hover:rotate-1 hover:scale-[1.01]">
                            
                            {/* Mock Window Header */}
                            <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center px-6 gap-2 bg-gray-50 dark:bg-white/5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                <div className="ml-4 px-3 py-1 bg-gray-200 dark:bg-white/10 rounded-md text-[10px] font-mono text-gray-500">studysim.app</div>
                            </div>

                            {/* Mock Interface */}
                            <div className="p-6 md:p-8 grid gap-6">
                                {/* Chat Bubble (Input) */}
                                <div className="flex gap-4 items-end animate-in fade-in slide-in-from-bottom-2 duration-700">
                                    <img 
                                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&q=80&fit=crop" 
                                        alt="User"
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" 
                                    />
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-none p-4 max-w-[80%] text-sm text-gray-600 dark:text-gray-300">
                                        Can you visualize projectile motion with drag?
                                    </div>
                                </div>

                                {/* AI Response + Simulator */}
                                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                                    <div className="flex-1 space-y-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-4 text-sm text-gray-800 dark:text-gray-200">
                                            Sure! I've generated an interactive simulator for you. Adjust the angle and velocity below.
                                        </div>
                                        
                                        {/* Mini Simulator Mockup */}
                                        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative border border-white/10 shadow-inner group-hover:shadow-purple-500/20 transition-shadow">
                                            {/* Grid Lines */}
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                            
                                            {/* Animated Projectile */}
                                            <div className="absolute bottom-4 left-4 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-[bounce_2s_infinite]"></div>
                                            <div className="absolute bottom-4 left-4 w-32 h-32 border-t-2 border-r-2 border-dashed border-white/30 rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 origin-bottom-left" style={{ transform: 'scale(1)' }}></div>
                                            
                                            {/* Controls Overlay */}
                                            <div className="absolute bottom-0 inset-x-0 p-3 bg-black/50 backdrop-blur-sm flex gap-2">
                                                <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full w-2/3 bg-purple-500"></div>
                                                </div>
                                                <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full w-1/3 bg-blue-500"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Gradient Bridge to HowItWorks */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-b from-transparent to-white dark:to-[#0C0C0C] pointer-events-none"></div>
        </div>
    );
};

const ProcessCard: React.FC<{ 
    step: string;
    title: string; 
    desc: string; 
    theme: 'yellow' | 'blue' | 'red'; 
    icon: React.ReactNode; 
    delay: string;
    children?: React.ReactNode; 
}> = ({ step, title, desc, theme, icon, delay, children }) => {
    
    // Theme configurations for Light (Solid/Flat) and Dark (Neon/Glow) modes
    const themes = {
        yellow: {
            light: 'bg-[#FFC800] border-[#E5B800] text-black',
            dark: 'dark:bg-zinc-900 dark:border-yellow-500/50 dark:text-yellow-100 dark:shadow-[inset_0_0_30px_rgba(234,179,8,0.1)]',
            iconBg: 'bg-white text-black'
        },
        blue: {
            light: 'bg-[#3B82F6] border-[#2563EB] text-white',
            dark: 'dark:bg-zinc-900 dark:border-blue-500/50 dark:text-blue-100 dark:shadow-[inset_0_0_30px_rgba(59,130,246,0.1)]',
            iconBg: 'bg-white/20 text-white backdrop-blur-md'
        },
        red: {
            light: 'bg-[#C2410C] border-[#9A3412] text-white',
            dark: 'dark:bg-zinc-900 dark:border-red-500/50 dark:text-red-100 dark:shadow-[inset_0_0_30px_rgba(239,68,68,0.1)]',
            iconBg: 'bg-white/20 text-white backdrop-blur-md'
        }
    };

    const t = themes[theme];

    return (
        <div className={`relative overflow-hidden rounded-[2rem] h-[350px] md:h-[420px] flex flex-col p-6 md:p-8 transition-all hover:scale-[1.02] duration-500 shadow-xl border ${t.light} ${t.dark} group z-10`}>
            <div className="relative z-10 flex flex-col h-full">
                {/* Step Indicator */}
                <span className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Step {step}</span>
                
                <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 leading-tight">{title}</h3>
                <p className="text-sm md:text-lg font-medium opacity-90 leading-relaxed mb-6">{desc}</p>
                
                {/* Centered/Bottom Content (Interactive Element) */}
                <div className="mt-auto flex justify-center w-full">
                    {children ? children : (
                        <div className={`p-4 rounded-2xl border border-white/30 shadow-lg animate-float ${t.iconBg}`}>
                            {icon}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Dark Mode Glow Effect */}
            <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/5 to-transparent"></div>
        </div>
    );
};

const HowItWorks: React.FC = () => {
    return (
        <div id="how-it-works" className="py-20 md:py-32 px-4 md:px-6 bg-white dark:bg-[#0C0C0C] relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-16 md:mb-24 text-center md:text-left">
                     <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium text-gray-900 dark:text-white tracking-tight leading-none">
                        The way learning <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">should've</span> <br className="hidden md:block"/>
                        been done in the first place.
                     </h2>
                </div>

                <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 z-0 pointer-events-none">
                         {/* Light Mode: Dashed Grey */}
                         <div className="w-full h-full border-t-2 border-dashed border-gray-300 dark:hidden"></div>
                         {/* Dark Mode: Neon Glow */}
                         <div className="hidden dark:block w-full h-1 bg-gradient-to-r from-yellow-500/20 via-blue-500/20 to-red-500/20 blur-xl"></div>
                         <div className="hidden dark:block w-full h-px bg-gradient-to-r from-yellow-500/50 via-blue-500/50 to-red-500/50"></div>
                    </div>

                    {/* Card 1: Input */}
                    <ProcessCard 
                        step="01"
                        title="Upload" 
                        desc="Upload PDFs, paste links, or type any topic to begin."
                        theme="yellow"
                        icon={<Upload size={40} />}
                        delay="0s"
                    >
                        <div className="bg-white p-4 rounded-xl shadow-lg transform rotate-3 transition-transform group-hover:rotate-6 border border-gray-100 animate-float text-black">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-500">
                                    <FileText size={20} />
                                </div>
                                <div className="space-y-1">
                                    <div className="w-24 h-2 bg-gray-200 rounded-full"></div>
                                    <div className="w-16 h-2 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </ProcessCard>

                    {/* Card 2: Process */}
                    <ProcessCard 
                        step="02"
                        title="Analyze" 
                        desc="AI Architect breaks down the concept and retrieves context."
                        theme="blue"
                        icon={<Brain size={40} />}
                        delay="0.1s"
                    >
                         <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 animate-float" style={{ animationDelay: '1s' }}>
                            <Brain size={40} className="text-white drop-shadow-md" />
                         </div>
                    </ProcessCard>

                    {/* Card 3: Output */}
                    <ProcessCard 
                        step="03"
                        title="Simulate" 
                        desc="Interact with HTML5 simulations and smart notes."
                        theme="red"
                        icon={<Play size={40} />}
                        delay="0.2s"
                    >
                        <div className="relative animate-float" style={{ animationDelay: '2s' }}>
                            <div className="bg-white text-black px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 transform -rotate-3 group-hover:rotate-0 transition-transform border border-gray-100">
                                <Zap size={20} className="text-yellow-500 fill-yellow-500" /> Live Demo
                            </div>
                        </div>
                    </ProcessCard>
                </div>
            </div>

            {/* Gradient Bridge to Benefits */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-b from-transparent to-[#F4F4F5] dark:to-[#09090B] pointer-events-none"></div>
        </div>
    );
};

// --- SPOTLIGHT CARD IMPLEMENTATION ---
type ThemeColor = 'blue' | 'purple' | 'yellow' | 'green' | 'pink' | 'orange';

const BenefitItem: React.FC<{ 
    icon: any; 
    title: string; 
    desc: string; 
    colorTheme: ThemeColor; 
    delay?: string 
}> = ({ icon: Icon, title, desc, colorTheme, delay = '0ms' }) => {
    const divRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        divRef.current.style.setProperty('--mouse-x', `${x}px`);
        divRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    // Color Mapping
    const colorClasses = {
        blue: {
            bg: 'bg-blue-100 dark:bg-blue-500/20',
            text: 'text-blue-700 dark:text-blue-400',
        },
        purple: {
            bg: 'bg-purple-100 dark:bg-purple-500/20',
            text: 'text-purple-700 dark:text-purple-400',
        },
        yellow: {
            bg: 'bg-amber-100 dark:bg-yellow-500/20',
            text: 'text-amber-700 dark:text-yellow-400',
        },
        green: {
            bg: 'bg-emerald-100 dark:bg-green-500/20',
            text: 'text-emerald-700 dark:text-green-400',
        },
        pink: {
            bg: 'bg-pink-100 dark:bg-pink-500/20',
            text: 'text-pink-700 dark:text-pink-400',
        },
        orange: {
            bg: 'bg-orange-100 dark:bg-orange-500/20',
            text: 'text-orange-700 dark:text-orange-400',
        },
    };

    const currentTheme = colorClasses[colorTheme];

    return (
        <div 
            ref={divRef}
            onMouseMove={handleMouseMove}
            className={`group relative p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 opacity-0 animate-fade-in-up`}
            style={{ animationDelay: delay }}
        >
            {/* Spotlight Gradient */}
            <div 
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1), transparent 40%)`
                }}
            />
            {/* Dark Mode Spotlight specific (lighter center) */}
            <div 
                className="pointer-events-none absolute -inset-px opacity-0 dark:group-hover:opacity-100 transition duration-300 z-0 hidden dark:block"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.06), transparent 40%)`
                }}
            />

            <div className={`w-12 h-12 md:w-14 md:h-14 ${currentTheme.bg} rounded-2xl flex items-center justify-center mb-5 md:mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm relative z-10`}>
                <Icon size={24} className={`${currentTheme.text} md:w-7 md:h-7`} />
            </div>
            
            <h3 className="text-xl md:text-2xl font-extrabold dark:font-bold text-gray-900 dark:text-white mb-2 md:mb-3 relative z-10">{title}</h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium relative z-10">{desc}</p>
        </div>
    );
};

const Benefits: React.FC = () => {
    // Basic threshold observer for animation trigger
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div id="benefits" className="py-20 md:py-24 px-4 md:px-6 bg-[#F4F4F5] dark:bg-[#09090B] transition-colors duration-300 relative" ref={sectionRef}>
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-16 md:mb-20">
                    <span className="uppercase tracking-widest text-xs md:text-sm font-bold text-gray-400 mb-3 md:mb-4 block">Membership benefits</span>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium text-gray-900 dark:text-white tracking-tight">
                        It's "<span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">you'll never go back</span>" better.
                    </h2>
                </div>

                {isVisible && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <BenefitItem 
                            icon={Layers} 
                            colorTheme="blue" 
                            title="Context Architect" 
                            desc="Unlike generic chatbots, we analyze your full context to build a structured learning plan before writing a single word." 
                            delay="0ms"
                        />
                        <BenefitItem 
                            icon={Code} 
                            colorTheme="purple" 
                            title="Generative Sims" 
                            desc="The only platform that writes custom HTML5 physics engines for your specific topic in real-time. Don't just read, interact." 
                            delay="100ms"
                        />
                        <BenefitItem 
                            icon={Zap} 
                            colorTheme="yellow" 
                            title="Multimodal Input" 
                            desc="Upload a lecture recording, a photo of a whiteboard, or a PDF. We synthesize text, audio, and vision into one cohesive guide." 
                            delay="200ms"
                        />
                        <BenefitItem 
                            icon={ShieldCheck} 
                            colorTheme="green" 
                            title="Grounded Truth" 
                            desc="Powered by Google Search, our AI verifies facts and provides citations, reducing hallucinations and ensuring accuracy." 
                            delay="300ms"
                        />
                        <BenefitItem 
                            icon={Microscope} 
                            colorTheme="pink" 
                            title="Smart Assessments" 
                            desc="Instant quizzes that adapt to your weak points, with detailed AI-generated explanations for every answer." 
                            delay="400ms"
                        />
                        <BenefitItem 
                            icon={Share2} 
                            colorTheme="orange" 
                            title="Export Anywhere" 
                            desc="Your content is yours. Export notes to PDF, Word, or Markdown for seamless integration with Notion or Obsidian." 
                            delay="500ms"
                        />
                    </div>
                )}
            </div>

            {/* Gradient Bridge to ControlDemo */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-b from-transparent to-[#050505] pointer-events-none"></div>
        </div>
    );
};

const ControlDemo: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        let t = 0;

        const draw = () => {
            if (!canvas) return;
            const w = canvas.width = canvas.parentElement?.clientWidth || 300;
            const h = canvas.height = canvas.parentElement?.clientHeight || 300;
            
            ctx.clearRect(0, 0, w, h);
            
            // Draw Wave
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            
            // Wave parameters
            const amplitude = h * 0.15;
            const frequency = 0.02;
            
            for (let x = 0; x < w; x++) {
                const y = h / 2 + Math.sin(x * frequency + t) * amplitude;
                ctx.lineTo(x, y);
            }
            
            // Gradient Stroke for extra "Neon" feel or just solid
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset

            t += 0.05;
            frameId = requestAnimationFrame(draw);
        };
        
        draw();
        return () => cancelAnimationFrame(frameId);
    }, []);

    return (
        <div className="bg-[#050505] py-24 md:py-32 px-4 md:px-8 border-t border-white/5 relative overflow-hidden">
             
             {/* Main Card Container with Revolving Gradient Border */}
             <div className="max-w-7xl mx-auto relative group rounded-[2.5rem] p-[1px] overflow-hidden">
                
                {/* Spinning Conic Gradient for "Revolving Light Flow" */}
                <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,#2563EB_30%,#9333EA_60%,#DB2777_90%,transparent_100%)] animate-[spin_4s_linear_infinite] opacity-100" />
                
                {/* Secondary Blur Layer for "Glow" */}
                <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,#2563EB_30%,#9333EA_60%,#DB2777_90%,transparent_100%)] animate-[spin_4s_linear_infinite] opacity-60 blur-3xl" />

                {/* Inner Content Card (Black Background) */}
                <div className="relative bg-[#080808] rounded-[2.5rem] h-full p-8 md:p-16 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                     {/* Left: Text */}
                     <div className="text-center lg:text-left">
                         <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                             Don't just read it.<br />
                             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">Control it.</span>
                         </h2>
                         <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                             Why memorize a formula when you can adjust the variables and see the results? StudySim generates physics-accurate environments in seconds.
                         </p>
                         <button className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-2 transform hover:scale-105 duration-300">
                             Interactive Demo <ArrowRight size={20} />
                         </button>
                     </div>

                     {/* Right: Window Visual */}
                     <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
                         {/* Window Container */}
                         <div className="bg-[#111] border border-[#333] border-t-white/10 rounded-xl overflow-hidden shadow-2xl relative">
                             {/* Title Bar */}
                             <div className="bg-[#1a1a1a] px-4 py-3 flex items-center gap-2 border-b border-[#333]">
                                 <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                 <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                 <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                             </div>
                             
                             {/* Content Area */}
                             <div className="relative h-[300px] md:h-[400px] bg-black">
                                 <canvas ref={canvasRef} className="w-full h-full block" />
                                 
                                 {/* Bottom Controls Overlay */}
                                 <div className="absolute bottom-8 left-8 right-8 flex gap-4">
                                      {/* Slider 1 */}
                                      <div className="flex-1 bg-[#222] h-1.5 rounded-full overflow-hidden">
                                          <div className="h-full w-[40%] bg-[#facc15]"></div> {/* Yellow */}
                                      </div>
                                      {/* Slider 2 */}
                                      <div className="flex-1 bg-[#222] h-1.5 rounded-full overflow-hidden">
                                          <div className="h-full w-[70%] bg-[#4ade80]"></div> {/* Green */}
                                      </div>
                                      {/* Slider 3 */}
                                      <div className="flex-1 bg-[#222] h-1.5 rounded-full overflow-hidden">
                                          <div className="h-full w-[50%] bg-[#3b82f6]"></div> {/* Blue */}
                                      </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>
             </div>
        </div>
    );
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`group p-6 md:p-8 rounded-3xl cursor-pointer transition-all duration-300 border border-transparent 
            ${isOpen 
                ? 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/10 shadow-lg' 
                : 'bg-gray-50 dark:bg-[#151515] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] hover:border-gray-200 dark:hover:border-white/5'
            }`}
        >
            <div className="flex justify-between items-center gap-4">
                <h3 className={`font-bold text-lg md:text-xl transition-colors duration-300 ${isOpen ? 'text-lime-600 dark:text-lime-400' : 'text-gray-900 dark:text-white'}`}>
                    {question}
                </h3>
                <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-lime-100 dark:bg-lime-900/30 rotate-180' : 'bg-transparent'}`}>
                     <ChevronDown className={`transition-colors duration-300 ${isOpen ? 'text-lime-600 dark:text-lime-400' : 'text-gray-400'}`} size={20} />
                </div>
            </div>
            <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className={`pt-4 transition-all duration-500 delay-100 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                        <div className="h-px w-full bg-gray-200 dark:bg-zinc-800 mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base md:text-lg font-light">
                            {answer}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FAQ: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const faqs = [
        {
            question: "How does the simulator work?",
            answer: "StudySim uses Gemini 2.5 Flash and Pro models to analyze the physics and logic of your topic (e.g., 'Projectile Motion'). It then writes a custom, single-file HTML5/Canvas application from scratch that runs directly in your browser, complete with sliders and interactive elements."
        },
        {
            question: "What kind of files can I upload?",
            answer: "We support a multimodal workflow. You can upload PDFs, text files, images (like diagrams or whiteboard photos), and audio recordings (like lectures). The AI 'sees' and 'hears' your uploads to create a comprehensive study guide."
        },
        {
            question: "Is this better than standard ChatGPT or Gemini?",
            answer: "Standard chatbots are great for conversation, but StudySim is an Architect. We use a specialized multi-step pipeline (Research -> Plan -> Draft -> Code) designed specifically for education. This reduces errors and creates structured, deep content rather than generic summaries."
        },
        {
            question: "Can I use StudySim on my phone?",
            answer: "Absolutely. The entire platform, including the generated interactive simulations, is fully responsive and touch-friendly, so you can study on the go."
        },
        {
            question: "Is it free to use?",
            answer: "Yes! The core features, including note generation and standard simulations, are free. We use efficient models to keep costs low while delivering premium AI results."
        }
    ];

    const filteredFaqs = faqs.filter(f => 
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div id="faq" className="py-20 md:py-32 px-4 md:px-6 bg-white dark:bg-[#0C0C0C] relative">
             <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <span className="uppercase tracking-widest text-xs md:text-sm font-bold text-gray-400 mb-3 block">Common Questions</span>
                    <h2 className="text-4xl md:text-5xl font-medium text-gray-900 dark:text-white tracking-tight mb-8">
                        <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">Frequently</span> asked questions
                    </h2>
                    
                    {/* AI Search Bar */}
                    <div className="max-w-xl mx-auto relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-2xl p-1 flex items-center shadow-sm focus-within:shadow-lg focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                             <div className="p-3 text-gray-400">
                                <Sparkles size={20} />
                             </div>
                             <input 
                                type="text"
                                placeholder="Ask about features, pricing, or tech..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 h-10"
                             />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                     {filteredFaqs.length > 0 ? (
                         filteredFaqs.map((faq, i) => (
                             <FAQItem key={i} question={faq.question} answer={faq.answer} />
                         ))
                     ) : (
                         <div className="text-center py-10 text-gray-500">
                             <HelpCircle size={48} className="mx-auto mb-4 opacity-20"/>
                             <p>No answers found for "{searchQuery}". Try a different keyword.</p>
                         </div>
                     )}
                </div>
             </div>
        </div>
    );
};

const Footer: React.FC = () => {
    return (
        <footer className="relative bg-zinc-50 dark:bg-black py-24 md:py-32 overflow-visible transition-colors duration-500 border-t border-transparent dark:border-white/5">
            {/* Seamless Blend Gradient (Top) - Reaches up into previous section */}
            <div className="absolute -top-32 left-0 w-full h-32 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black dark:to-transparent pointer-events-none" />

            {/* The Data Core (Background Glow) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] pointer-events-none z-0">
                {/* Dark Mode Core: Cyan/Lime Nebula */}
                <div className="hidden dark:block absolute inset-0 bg-gradient-to-r from-lime-500/20 via-cyan-500/20 to-lime-500/20 blur-[100px] rounded-full animate-pulse" />
                
                {/* Light Mode Core: Purple/Blue Pastel */}
                <div className="block dark:hidden absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 blur-[80px] rounded-full animate-pulse" />
            </div>
            
            {/* Grid Overlay Texture (Subtle) */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-20 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#999 1px, transparent 1px), linear-gradient(90deg, #999 1px, transparent 1px)', 
                     backgroundSize: '40px 40px' 
                 }}>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                
                {/* Label */}
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-[0.3em] mb-6 animate-in fade-in slide-in-from-bottom-2 duration-1000 relative z-20">
                    Visualized by
                </p>

                {/* Hero Name with Gradient Animation */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-10 tracking-tight 
                    text-transparent bg-clip-text 
                    bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 
                    dark:from-lime-400 dark:via-cyan-400 dark:to-lime-400 
                    bg-[length:200%_auto] animate-gradient-x 
                    hover:scale-[1.02] transition-transform duration-500 cursor-default select-none drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                    Bhagya Asati
                </h1>

                {/* Social Links */}
                <div className="flex flex-col sm:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 relative z-20">
                    
                    {/* LinkedIn Button */}
                    <a 
                        href="https://www.linkedin.com/in/bhagya-asati-7463a2379/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all duration-300
                        bg-white border-zinc-300 text-zinc-800 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg
                        dark:bg-zinc-900/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-blue-400 dark:hover:text-white dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                    >
                        <Linkedin size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold tracking-wide">Connect</span>
                    </a>

                    {/* GitHub Button */}
                    <a 
                        href="https://github.com/bhagyaasati" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all duration-300
                        bg-white border-zinc-300 text-zinc-800 hover:border-purple-500 hover:text-purple-600 hover:shadow-lg
                        dark:bg-zinc-900/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-lime-400 dark:hover:text-white dark:hover:shadow-[0_0_20px_rgba(163,230,53,0.2)]"
                    >
                        <Github size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold tracking-wide">Connect</span>
                    </a>
                </div>
            </div>
        </footer>
    );
};

const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    return (
        <div className="bg-[#FAFAFA] dark:bg-[#050505] text-gray-900 dark:text-white font-sans min-h-screen relative z-50 overflow-y-auto selection:bg-pink-200 selection:text-pink-900">
            <LandingNav onStart={onStart} />
            <Hero onStart={onStart} />
            <HowItWorks />
            <Benefits />
            <ControlDemo />
            <FAQ />
            <Footer />
        </div>
    );
};

// --- APP COMPONENTS ---

const AppNavbar: React.FC<{ mode: AppMode, setMode: (m: AppMode) => void }> = ({ mode, setMode }) => {
    return (
        <div className="w-full flex justify-center pt-4 md:pt-8 pb-4 relative z-50 px-2 md:px-4">
            <div className="bg-surface border border-border rounded-full p-1.5 flex items-center shadow-terminal relative transition-colors duration-300 max-w-full overflow-x-auto scrollbar-hide">
                {/* Logo Section */}
                <div className="flex items-center gap-2 pl-3 md:pl-4 pr-3 md:pr-6 border-r border-border mr-1 md:mr-2 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center">
                        <Command size={12} className="text-gray-900 dark:text-white"/>
                    </div>
                    <span className="text-gray-900 dark:text-white font-bold text-sm tracking-tight hidden sm:inline">StudySim</span>
                </div>

                {/* Nav Pills */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {[
                        { id: AppMode.STUDY, icon: Brain, label: 'Study' },
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => setMode(item.id)}
                            className={`px-3 md:px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === item.id ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <item.icon size={14} /> <span className="hidden sm:inline">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="border-l border-border ml-1 md:ml-2 pl-2 md:pl-4 pr-2 flex items-center gap-2 flex-shrink-0">
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [showHero, setShowHero] = useState(true);
  const [mode, setMode] = useState<AppMode>(AppMode.STUDY);
  const appRef = useRef<HTMLDivElement>(null);

  const handleStartApp = () => {
      setShowHero(false);
      setTimeout(() => {
        appRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  return (
    <HashRouter>
      <div className="font-sans text-gray-900 dark:text-white min-h-screen relative selection:bg-primary/30 selection:text-white bg-bg transition-colors duration-300">
        
        {/* Fullscreen Landing Page Overlay */}
        {showHero && (
            <div className="fixed inset-0 z-50 bg-[#FAFAFA] dark:bg-[#050505] transition-opacity duration-700 ease-in-out overflow-y-auto">
                <LandingPage onStart={handleStartApp} />
            </div>
        )}

        {/* Main Application Container */}
        <div ref={appRef} className={`app-container transition-opacity duration-1000 flex flex-col ${showHero ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            <AppNavbar mode={mode} setMode={setMode} />
            <main className="flex-1 p-2 md:p-6 lg:px-8 relative z-10 w-full max-w-[1600px] mx-auto h-full flex flex-col">
                <div className="animate-fade-in flex-1 flex flex-col">
                    {mode === AppMode.STUDY && <StudyArchitect />}
                    {mode === AppMode.IMAGE_GEN && <ImageTools />}
                    {mode === AppMode.VIDEO_GEN && <VeoGen />}
                </div>
            </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
