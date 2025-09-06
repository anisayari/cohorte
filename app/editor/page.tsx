'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import EditorToolbar from '@/components/EditorToolbar';
import EditorDocument from '@/components/EditorDocument';
import PersonaModal from '@/components/PersonaModal';
import ConversationSidebar from '@/components/ConversationSidebar';
import PersonaSidebar from '@/components/PersonaSidebar';
import FloatingActions from '@/components/FloatingActions';
import CommentSystem from '@/components/CommentSystem';
import SelectionPopup from '@/components/SelectionPopup';
import PersonaCommentModal from '@/components/PersonaCommentModal';
import { ConversationStorage, Conversation, Message } from '@/lib/conversation-storage';
import { CommentStorage } from '@/lib/comment-storage';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function EditorPage() {
  const [content, setContent] = useState<string>('');
  interface Persona {
    id?: string;
    first_name: string;
    last_name: string;
    age: number;
    city: string;
    profession: string;
    values?: string[];
    mini_description?: string;
  }
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasHighlights, setHasHighlights] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [genRunning, setGenRunning] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genList, setGenList] = useState<Persona[]>([]);
  const totalToGenerate = 5;
  const [savedPops, setSavedPops] = useState<{ id: string; seed: string; createdAt: number; personas: Persona[] }[]>([]);
  const [selectedPopId, setSelectedPopId] = useState<string>('');
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentModalText, setCommentModalText] = useState<string>('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [personaSidebarOpen, setPersonaSidebarOpen] = useState(true);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    // Load or create initial conversation
    const conversations = ConversationStorage.getAllConversations();
    if (conversations.length > 0) {
      const latest = conversations[0];
      setCurrentConversation(latest);
      loadConversationContent(latest);
    } else {
      createNewConversation();
    }
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        setSelectedText(selection.toString());
        
        // Check formatting of selected text
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const parentElement = container.nodeType === 3 ? container.parentElement : container as HTMLElement;
        
        if (parentElement) {
          const computedStyle = window.getComputedStyle(parentElement);
          setIsBold(computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700);
          setIsItalic(computedStyle.fontStyle === 'italic');
          setIsUnderline(computedStyle.textDecoration.includes('underline'));
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleFormat = (format: string) => {
    switch (format) {
      case 'bold':
        execCommand('bold');
        setIsBold(!isBold);
        break;
      case 'italic':
        execCommand('italic');
        setIsItalic(!isItalic);
        break;
      case 'underline':
        execCommand('underline');
        setIsUnderline(!isUnderline);
        break;
      case 'left':
      case 'center':
      case 'right':
      case 'justify':
        execCommand('justify' + format.charAt(0).toUpperCase() + format.slice(1));
        setTextAlign(format as typeof textAlign);
        break;
      case 'orderedList':
        execCommand('insertOrderedList');
        break;
      case 'unorderedList':
        execCommand('insertUnorderedList');
        break;
      case 'indent':
        execCommand('indent');
        break;
      case 'outdent':
        execCommand('outdent');
        break;
      case 'undo':
        execCommand('undo');
        break;
      case 'redo':
        execCommand('redo');
        break;
    }
  };

  const handleFontSize = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      '10': '1',
      '13': '2',
      '16': '3',
      '18': '4',
      '24': '5',
      '32': '6',
      '48': '7'
    };
    execCommand('fontSize', sizeMap[size] || '3');
    setFontSize(size);
  };

  const handleFontFamily = (family: string) => {
    execCommand('fontName', family);
    setFontFamily(family);
  };

  const handleSavePdf = async () => {
    if (!editorRef.current) return;
    
    try {
      // Create a clone of the editor content
      const element = editorRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Top margin
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `document_${timestamp}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error while generating PDF:', error);
      alert('Error while generating PDF');
    }
  };

  // No-op: plain text is read directly from contentEditable when needed


  function aggregateCategory(scores: number[], tones: string[]): 'good' | 'neutral' | 'bad' {
    const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
    const exciteBoost = tones.filter(t => t === 'exciting').length / Math.max(1, tones.length) * 10;
    const adj = Math.max(0, Math.min(100, avg + exciteBoost));
    if (adj >= 70) return 'good';
    if (adj <= 40) return 'bad';
    return 'neutral';
  }

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const text = (editorRef.current?.innerText || '').trim();
      if (!text) {
        alert('Please enter text to analyze.');
        return;
      }
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, personas })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'API error');

      const chunks: { index: number; start: number; end: number; text: string }[] = data.chunks || [];
      const analyses: any[] = data.analyses || [];

      // Aggregate per chunk and rebuild HTML with colored spans
      let html = '';
      let cursor = 0;
      const plain = text; // because we used innerText above
      for (const c of chunks) {
        // Guard against gaps
        if (c.start > cursor) {
          const gap = plain.slice(cursor, c.start);
          html += gap
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>');
        }
        interface Judgment {
          chunk_index: number;
          sentiment_score: number;
          tone?: string;
        }
        interface Analysis {
          judgments?: Judgment[];
        }
        const perPersona = analyses.map((a: Analysis) => a.judgments?.find((j) => j.chunk_index === c.index)).filter(Boolean);
        const scores = perPersona.map((j) => Number((j as Judgment).sentiment_score) || 0);
        const tones = perPersona.map((j) => String((j as Judgment).tone || 'neutral'));
        const cat = aggregateCategory(scores, tones);
        const safe = c.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>');
        html += `<span class="analysis-chunk analysis-${cat}">${safe}</span>`;
        cursor = c.end;
      }
      // trailing text
      if (cursor < plain.length) {
        const tail = plain.slice(cursor)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>');
        html += tail;
      }
      setContent(html);
      setHasHighlights(true);
    } catch (e) {
      console.error(e);
      alert('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // Load saved populations on mount
  useEffect(() => {
    try {
      const key = 'cohorte_populations_v1';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(arr)) setSavedPops(arr);
    } catch {}
  }, []);

  const openGenerateModal = () => {
    setModalOpen(true);
    setGenRunning(false);
    setGenList([]);
    setGenProgress(0);
  };
  const closeGenerateModal = () => {
    if (genRunning) return;
    setModalOpen(false);
  };
  const confirmGenerateModal = async (seed: string) => {
    setGenRunning(true);
    setGenList([]);
    setGenProgress(0);
    try {
      const built: Persona[] = [];
      for (let i = 0; i < totalToGenerate; i++) {
        const res = await fetch('/api/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: 1, seed: seed ?? '' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'API error');
        const persona = (data.personas && data.personas[0]) || null;
        if (persona) {
          built.push(persona);
          setGenList([...built]);
          setGenProgress((i + 1) / totalToGenerate);
        }
      }
      setPersonas(built);
      // persist population
      const pop = { id: crypto.randomUUID(), seed: seed || '', createdAt: Date.now(), personas: built };
      const key = 'cohorte_populations_v1';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(pop);
      const trimmed = existing.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(trimmed));
      setSavedPops(trimmed);
      setSelectedPopId(pop.id);
    } catch (e) {
      console.error(e);
      alert('Failed to generate personas');
    } finally {
      setGenRunning(false);
    }
  };

  const loadPopulation = (id: string) => {
    const pop = savedPops.find(p => p.id === id);
    if (pop) {
      setPersonas(pop.personas);
      setSelectedPopId(pop.id);
    }
  };

  const handleClearHighlights = () => {
    const text = (editorRef.current?.innerText || '').replace(/\r\n|\r|\n/g, '\n');
    const safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    setContent(safe);
    setHasHighlights(false);
  };

  const createNewConversation = () => {
    const newConv = ConversationStorage.createNewConversation();
    ConversationStorage.saveConversation(newConv);
    setCurrentConversation(newConv);
    setContent('');
    setPersonas([]);
    setHasHighlights(false);
  };

  const loadConversationContent = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    // Load the last state from the conversation messages
    if (conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        try {
          const data = JSON.parse(lastMessage.content);
          setContent(data.content || '');
          setPersonas(data.personas || []);
          setHasHighlights(data.hasHighlights || false);
        } catch (e) {
          console.error('Failed to parse conversation state', e);
        }
      }
    } else {
      setContent('');
      setPersonas([]);
      setHasHighlights(false);
    }
  };

  const handleAnalyzeSelection = async (text: string) => {
    if (!personas || personas.length === 0) {
      alert('Please generate personas first');
      return;
    }

    try {
      // Create a comment thread for the selected text
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) return;
      
      const range = selection.getRangeAt(0);
      const startOffset = getTextOffset(editorRef.current!, range.startContainer, range.startOffset);
      const endOffset = startOffset + text.length;
      
      // Create thread
      const colors = ['#FFE082', '#FFCCBC', '#C5E1A5', '#B3E5FC', '#F8BBD0'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const thread = CommentStorage.createThread(
        currentConversation?.id || 'default',
        startOffset,
        endOffset,
        text,
        randomColor
      );
      CommentStorage.saveThread(thread);
      
      // Analyze with personas
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text, 
          personas: personas.slice(0, 3)
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'API error');

      // Add persona comments
      const analyses = data.analyses || [];
      interface AnalysisResult {
        judgments?: {
          reasoning?: string;
          rationale?: string;
          sentiment_score: number;
          tone?: string;
        }[];
      }
      analyses.forEach((analysis: AnalysisResult, index: number) => {
        if (analysis.judgments && analysis.judgments.length > 0) {
          const judgment = analysis.judgments[0];
          const persona = personas[index];
          
          CommentStorage.addComment(thread.id, {
            text: `${judgment.reasoning || judgment.rationale} (Sentiment: ${judgment.sentiment_score}/100)`,
            author: `${persona.first_name} ${persona.last_name}`,
            authorType: 'ai',
            personaId: persona.id
          });
        }
      });
      
      // Clear selection
      selection.removeAllRanges();
    } catch (e) {
      console.error('Error during analysis:', e);
      alert('Error during analysis');
    }
  };

  const getTextOffset = (root: Node, node: Node, offset: number): number => {
    let textOffset = 0;
    let currentNode: Node | null = root;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null
    );

    while (currentNode = walker.nextNode()) {
      if (currentNode === node) {
        return textOffset + offset;
      }
      textOffset += (currentNode as Text).length;
    }

    return textOffset;
  };

  const handleRephraseSelection = async () => {
    // TODO: Implement rephrase functionality
    alert('Rephrase functionality coming soon!');
  };

  const handleCommentSelection = (text: string) => {
    // Open modal to select personas for commenting
    setCommentModalText(text);
    setCommentModalOpen(true);
  };

  const handlePersonaComment = async (selectedPersonaIndices: number[]) => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) return;
    
    const range = selection.getRangeAt(0);
    const startOffset = getTextOffset(editorRef.current!, range.startContainer, range.startOffset);
    const endOffset = startOffset + commentModalText.length;
    
    // Create comment thread
    const colors = ['#FFE082', '#FFCCBC', '#C5E1A5', '#B3E5FC', '#F8BBD0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const thread = CommentStorage.createThread(
      currentConversation?.id || 'default',
      startOffset,
      endOffset,
      commentModalText,
      randomColor
    );
    CommentStorage.saveThread(thread);
    
    // Analyze with selected personas
    if (selectedPersonaIndices.length > 0) {
      const selectedPersonas = selectedPersonaIndices.map(i => personas[i]);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: commentModalText, 
            personas: selectedPersonas
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'API error');

        // Add persona comments
        const analyses = data.analyses || [];
        interface AnalysisResult {
        judgments?: {
          reasoning?: string;
          rationale?: string;
          sentiment_score: number;
          tone?: string;
        }[];
      }
      analyses.forEach((analysis: AnalysisResult, index: number) => {
          if (analysis.judgments && analysis.judgments.length > 0) {
            const judgment = analysis.judgments[0];
            const persona = selectedPersonas[index];
            
            CommentStorage.addComment(thread.id, {
              text: `${judgment.reasoning || judgment.rationale} (Sentiment: ${judgment.sentiment_score}/100)`,
              author: `${persona.first_name} ${persona.last_name}`,
              authorType: 'ai',
              personaId: persona.id
            });
          }
        });
      } catch (e) {
        console.error('Error during persona analysis:', e);
      }
    }
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setCommentModalOpen(false);
    setCommentModalText('');
    
    // Trigger refresh
    window.dispatchEvent(new CustomEvent('threadsUpdated'));
  };

  const handleAnalyzeSelectionForComment = async (text: string, threadId: string) => {
    if (!personas || personas.length === 0) {
      alert('Please generate personas first');
      return;
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text, 
          personas: personas.slice(0, 3) // Analyze with the first 3 personas
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'API error');

      // Add persona comments
      const analyses = data.analyses || [];
      interface AnalysisResult {
        judgments?: {
          reasoning?: string;
          rationale?: string;
          sentiment_score: number;
          tone?: string;
        }[];
      }
      analyses.forEach((analysis: AnalysisResult, index: number) => {
        if (analysis.judgments && analysis.judgments.length > 0) {
          const judgment = analysis.judgments[0];
          const persona = personas[index];
          
          CommentStorage.addComment(threadId, {
            text: `${judgment.reasoning} (Sentiment: ${judgment.sentiment_score}/100, Tone: ${judgment.tone})`,
            author: `${persona.first_name} ${persona.last_name}`,
            authorType: 'ai',
            personaId: persona.id
          });
        }
      });
    } catch (e) {
      console.error('Error during analysis:', e);
    }
  };

  const saveCurrentState = useCallback(() => {
    if (!currentConversation) return;
    
    const state = {
      content: content,
      personas: personas,
      hasHighlights: hasHighlights
    };
    
    const message: Message = {
      role: 'assistant',
      content: JSON.stringify(state),
      timestamp: new Date().toISOString()
    };
    
    ConversationStorage.addMessage(currentConversation.id, message);
    
    // Update title if it's still the default
    if (currentConversation.title === 'New script' && editorRef.current?.innerText) {
      const firstLine = editorRef.current.innerText.split('\n')[0].slice(0, 50);
      if (firstLine) {
        ConversationStorage.updateConversationTitle(currentConversation.id, firstLine);
      }
    }
  }, [currentConversation, content, personas, hasHighlights, editorRef]);

  // Auto-save when content changes
  useEffect(() => {
    if (!currentConversation) return;
    const timer = setTimeout(() => {
      saveCurrentState();
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, personas, hasHighlights, currentConversation, saveCurrentState]);

  return (
    <div className="min-h-screen bg-gray-100">
      <ConversationSidebar
        currentConversationId={currentConversation?.id || null}
        onSelectConversation={(id) => {
          const conv = ConversationStorage.getConversation(id);
          if (conv) loadConversationContent(conv);
        }}
        onNewConversation={createNewConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <PersonaSidebar
        personas={personas}
        isOpen={personaSidebarOpen}
        onToggle={() => setPersonaSidebarOpen(!personaSidebarOpen)}
        savedPops={savedPops}
        selectedPopId={selectedPopId}
        onLoadPopulation={loadPopulation}
        onDeletePersonas={(indices) => {
          const newPersonas = personas.filter((_, i) => !indices.includes(i));
          setPersonas(newPersonas);
          // Update localStorage if using saved population
          if (selectedPopId && typeof window !== 'undefined') {
            const key = 'cohorte_populations_v1';
            const pops = JSON.parse(localStorage.getItem(key) || '[]');
            const popIndex = pops.findIndex((p: {id: string}) => p.id === selectedPopId);
            if (popIndex !== -1) {
              if (newPersonas.length === 0) {
                // Delete the entire population if all personas are deleted
                pops.splice(popIndex, 1);
                setSelectedPopId('');
              } else {
                // Otherwise just update the personas
                pops[popIndex].personas = newPersonas;
              }
              localStorage.setItem(key, JSON.stringify(pops));
              setSavedPops(pops);
            }
          }
        }}
      />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'} ${personaSidebarOpen ? 'mr-80' : 'mr-0'}`}>
      <EditorToolbar
        isBold={isBold}
        isItalic={isItalic}
        isUnderline={isUnderline}
        fontSize={fontSize}
        fontFamily={fontFamily}
        textAlign={textAlign}
        onFormat={handleFormat}
        onFontSize={handleFontSize}
        onFontFamily={handleFontFamily}
        onSavePdf={handleSavePdf}
      />
      <EditorDocument
        ref={editorRef}
        content={content}
        onContentChange={setContent}
      />
      <SelectionPopup
        onAnalyze={handleAnalyzeSelection}
        onRephrase={handleRephraseSelection}
        onComment={handleCommentSelection}
      />
      <CommentSystem
        documentId={currentConversation?.id || 'default'}
        editorRef={editorRef}
        personas={personas}
        onAnalyzeSelection={handleAnalyzeSelectionForComment}
      />
      <FloatingActions
        onGeneratePopulation={openGenerateModal}
        onAnalyze={handleAnalyze}
        onClearHighlights={handleClearHighlights}
        generating={genRunning}
        analyzing={analyzing}
        canClear={hasHighlights}
      />
      <PersonaModal
        open={modalOpen}
        onClose={closeGenerateModal}
        onConfirm={confirmGenerateModal}
        generating={genRunning}
        progress={genProgress}
        total={totalToGenerate}
        generated={genList}
      />
      <PersonaCommentModal
        isOpen={commentModalOpen}
        onClose={() => {
          setCommentModalOpen(false);
          setCommentModalText('');
        }}
        personas={personas}
        selectedText={commentModalText}
        onConfirm={handlePersonaComment}
      />
      </div>
    </div>
  );
}
