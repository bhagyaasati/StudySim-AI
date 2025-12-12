
import React, { useEffect, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface Props {
  content: string;
  variant?: 'default' | 'chat';
}

declare global {
  interface Window {
    katex: any;
  }
}

const MarkdownRenderer: React.FC<Props> = ({ content, variant = 'default' }) => {
  const isChat = variant === 'chat';

  // --- Helper: Parse Inline (Bold + Inline Math + Links) ---
  const parseInline = (text: string) => {
    // 1. Split by inline math ($...$)
    const mathParts = text.split(/(\$[^$]+\$)/g);
    
    return mathParts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        // Render Math
        const latex = part.slice(1, -1);
        try {
           if (window.katex) {
             const html = window.katex.renderToString(latex, { throwOnError: false, displayMode: false });
             return <span key={i} dangerouslySetInnerHTML={{ __html: html }} className="inline-math text-base" />;
           }
           return <span key={i} className="font-mono bg-yellow-100 dark:bg-yellow-900 px-1 rounded">{latex}</span>;
        } catch (e) {
           return <span key={i} className="text-red-500">{latex}</span>;
        }
      }

      // 2. Parse Links [text](url)
      const linkParts = part.split(/(\[[^\]]+\]\([^)]+\))/g);
      return (
          <React.Fragment key={i}>
              {linkParts.map((subPart, j) => {
                  const linkMatch = subPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                  if (linkMatch) {
                      return (
                          <a 
                            key={j} 
                            href={linkMatch[2]} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline font-medium"
                          >
                              {linkMatch[1]}
                          </a>
                      );
                  }

                  // 3. Parse Bold (**text**)
                  const boldParts = subPart.split(/(\*\*.*?\*\*)/g);
                  return (
                    <React.Fragment key={j}>
                        {boldParts.map((boldPart, k) => {
                            if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                                return (
                                    <strong key={k} className={`font-black ${isChat ? '' : 'text-gray-900 dark:text-white'}`}>
                                        {boldPart.slice(2, -2)}
                                    </strong>
                                );
                            }
                            return <span key={k}>{boldPart}</span>;
                        })}
                    </React.Fragment>
                  );
              })}
          </React.Fragment>
      );
    });
  };

  // --- BLOCK PARSER ---
  const lines = content.replace(/\\n/g, '\n').split('\n');
  const blocks: any[] = [];
  
  let i = 0;
  while (i < lines.length) {
      const line = lines[i].trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
          i++;
          continue;
      }

      // 1. Block Math ($$)
      if (trimmed.startsWith('$$')) {
          let mathContent = trimmed.replace('$$', '');
          if (trimmed === '$$' || !trimmed.endsWith('$$') || trimmed.length === 2) {
             let j = i + 1;
             while (j < lines.length) {
                 if (lines[j].trim().includes('$$')) {
                     mathContent += '\n' + lines[j].trim().replace('$$', '');
                     i = j;
                     break;
                 }
                 mathContent += '\n' + lines[j];
                 j++;
             }
             if (j === lines.length) i = j;
          } else {
             mathContent = trimmed.slice(2, -2);
          }
          blocks.push({ type: 'math', content: mathContent });
          i++;
          continue;
      }

      // 2. Tables
      if (trimmed.startsWith('|')) {
          const rows = [];
          let j = i;
          while (j < lines.length && lines[j].trim().startsWith('|')) {
              rows.push(lines[j].trim());
              j++;
          }
          blocks.push({ type: 'table', rows });
          i = j;
          continue;
      }

      // 3. Headings
      if (line.startsWith('# ')) {
          blocks.push({ type: 'h1', content: line.replace('# ', '') });
          i++; continue;
      }
      if (line.startsWith('## ')) {
          blocks.push({ type: 'h2', content: line.replace('## ', '') });
          i++; continue;
      }
      if (line.startsWith('### ')) {
          blocks.push({ type: 'h3', content: line.replace('### ', '') });
          i++; continue;
      }
      if (line.startsWith('#### ')) {
          blocks.push({ type: 'h4', content: line.replace('#### ', '') });
          i++; continue;
      }

      // 4. Blockquotes
      if (line.startsWith('> ')) {
          blocks.push({ type: 'blockquote', content: line.replace('> ', '') });
          i++; continue;
      }

      // 5. Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          blocks.push({ type: 'ul', content: trimmed.substring(2) });
          i++; continue;
      }
      if (/^\d+\.\s/.test(trimmed)) {
          const dotIndex = trimmed.indexOf('.');
          blocks.push({ type: 'ol', num: trimmed.substring(0, dotIndex+1), content: trimmed.substring(dotIndex+1).trim() });
          i++; continue;
      }

      // 6. Image Placeholder
      const placeholderMatch = trimmed.match(/^\[(IMAGE_PLACEHOLDER|IMAGE):\s*(.*?)\]$/i);
      if (placeholderMatch) {
           const content = placeholderMatch[2].replace(/^"|"$/g, '');
           blocks.push({ type: 'image_placeholder', content });
           i++; continue;
      }

      // 7. Standard Images ![alt](url)
      const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageMatch) {
          blocks.push({ type: 'image', alt: imageMatch[1], src: imageMatch[2] });
          i++; continue;
      }

      // 8. Default Paragraph
      blocks.push({ type: 'p', content: line });
      i++;
  }

  // --- RENDERER ---
  return (
    <div className={`
      ${isChat ? 'text-sm space-y-2 text-inherit' : 'text-base md:text-lg space-y-4 text-gray-700 dark:text-gray-300'} 
      leading-relaxed font-normal w-full
    `}>
        {blocks.map((block, idx) => {
            switch (block.type) {
                case 'h1':
                    return (
                        <h1 key={idx} className={`font-serif font-bold text-gray-900 dark:text-white leading-tight ${isChat ? 'text-lg mb-1 mt-2' : 'text-3xl md:text-4xl mb-4 mt-8 pb-3 border-b border-gray-200 dark:border-white/10'}`}>
                            {block.content}
                        </h1>
                    );
                case 'h2':
                    return (
                        <div key={idx} className={`${isChat ? 'mt-3 mb-1' : 'mt-8 mb-4'}`}>
                            <h2 className={`font-sans font-bold flex items-center gap-2 ${isChat ? 'text-base text-gray-100' : 'text-xl md:text-2xl text-gray-800 dark:text-gray-100 pb-2'}`}>
                                {!isChat && <div className="w-1.5 h-6 bg-primary rounded-full"></div>}
                                {block.content}
                            </h2>
                        </div>
                    );
                case 'h3':
                     return (
                        <h3 key={idx} className={`font-bold text-gray-800 dark:text-gray-200 ${isChat ? 'text-sm mt-2 opacity-90' : 'text-lg md:text-xl mt-4 mb-2'}`}>
                            {block.content}
                        </h3>
                    );
                case 'h4':
                    return (
                       <h4 key={idx} className={`font-bold text-gray-700 dark:text-gray-300 ${isChat ? 'text-xs mt-2 uppercase tracking-wider' : 'text-base md:text-lg mt-3 mb-1 uppercase tracking-wide opacity-80'}`}>
                           {block.content}
                       </h4>
                   );
                case 'blockquote':
                    return (
                        <div key={idx} className={`my-3 rounded-xl border flex items-start gap-3 ${isChat ? 'bg-white/10 border-white/20 p-3' : 'bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-white/10 p-4 shadow-sm'}`}>
                            <div className={`mt-1 h-full w-1 rounded-full ${isChat ? 'bg-current opacity-50' : 'bg-primary/50'}`}></div>
                            <p className={`font-medium italic leading-relaxed break-words w-full ${isChat ? 'text-inherit' : 'text-gray-800 dark:text-gray-200 font-serif'}`}>
                                {parseInline(block.content)}
                            </p>
                        </div>
                    );
                case 'ul':
                    return (
                        <div key={idx} className={`flex items-start gap-3 ${isChat ? 'ml-0' : 'ml-2 md:ml-4'}`}>
                            <div className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isChat ? 'bg-current opacity-60' : 'bg-primary'}`}></div>
                            <p className="flex-1">{parseInline(block.content)}</p>
                        </div>
                    );
                case 'ol':
                     return (
                         <div key={idx} className={`flex items-start gap-2 ${isChat ? 'ml-0' : 'ml-2 md:ml-4'}`}>
                             <span className={`font-bold tabular-nums ${isChat ? 'opacity-80' : 'text-primary'}`}>{block.num}</span>
                             <p className="flex-1">{parseInline(block.content)}</p>
                         </div>
                     );
                case 'image':
                     return (
                         <div key={idx} className="my-6 w-full flex justify-center">
                             <img 
                                 src={block.src} 
                                 alt={block.alt} 
                                 className="rounded-xl shadow-lg max-h-[500px] object-contain bg-black/5 dark:bg-white/5 border border-border" 
                                 loading="lazy"
                             />
                         </div>
                     );
                case 'image_placeholder':
                    return (
                        <div key={idx} className="my-6 p-6 bg-surface-highlight border-2 border-dashed border-border rounded-xl flex flex-col items-center text-center gap-3 group hover:border-primary/50 transition-colors">
                            <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shadow-sm">
                                <ImageIcon size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic max-w-lg">
                                {block.content}
                            </p>
                        </div>
                    );
                case 'math':
                    try {
                         const latex = block.content;
                         if (window.katex) {
                             const html = window.katex.renderToString(latex, { throwOnError: false, displayMode: true });
                             return (
                                 <div key={idx} className="my-4 p-4 md:p-6 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-x-auto flex justify-center">
                                     <div dangerouslySetInnerHTML={{ __html: html }} />
                                 </div>
                             );
                         }
                         return <div key={idx} className="p-4 bg-gray-100 font-mono text-center">{latex}</div>;
                    } catch(e) {
                         return <div key={idx} className="text-red-500">Error rendering math</div>;
                    }
                case 'table':
                     const rows = block.rows as string[];
                     const parsedRows = rows.map(r => r.split('|').filter(c => c.trim() !== '').map(c => c.trim()));
                     const hasHeader = parsedRows.length > 1 && parsedRows[1][0].includes('---');
                     const headerRow = hasHeader ? parsedRows[0] : null;
                     const bodyRows = hasHeader ? parsedRows.slice(2) : parsedRows;

                     return (
                         <div key={idx} className="w-full overflow-x-auto my-4 rounded-xl border border-border shadow-sm bg-surface">
                             <table className="min-w-full divide-y divide-border">
                                 {headerRow && (
                                     <thead className="bg-surface-highlight">
                                         <tr>
                                             {headerRow.map((cell: string, ci: number) => (
                                                 <th key={ci} className="px-4 py-3 text-left text-xs md:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                                     {parseInline(cell)}
                                                 </th>
                                             ))}
                                         </tr>
                                     </thead>
                                 )}
                                 <tbody className="bg-surface divide-y divide-border">
                                     {bodyRows.map((row: string[], ri: number) => (
                                         <tr key={ri} className="even:bg-surface-highlight hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                             {row.map((cell: string, ci: number) => (
                                                 <td key={ci} className="px-4 py-3 text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-normal">
                                                     {parseInline(cell)}
                                                 </td>
                                             ))}
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     );
                default:
                    return (
                        <p key={idx} className={`${isChat ? 'text-inherit' : ''}`}>
                            {parseInline(block.content)}
                        </p>
                    );
            }
        })}
    </div>
  );
};

export default MarkdownRenderer;
