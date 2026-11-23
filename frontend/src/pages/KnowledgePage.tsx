import React, { useState } from 'react';
import { Send, Bot, User, BookOpen, Sparkles, MessageSquare } from 'lucide-react';
import { apiClient } from '../api/client';

interface Citation {
  document_id: string;
  title: string;
  chunk_index: number;
  snippet: string;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export const KnowledgePage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      content: 'Hello! I am DesignOps AI Copilot. Ask me anything regarding your enterprise documents, procurement guidelines, design systems, or operational workflows. I cite source documents for every answer.'
    }
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const res = await apiClient<{ conversation_id: string; answer: string; citations: Citation[] }>(
        '/api/knowledge/chat',
        {
          method: 'POST',
          body: JSON.stringify({ message: userText, conversation_id: conversationId })
        }
      );
      setConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          content: res.answer,
          citations: res.citations
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          content: `Error retrieving grounded answer: ${err.message || 'Please check backend status.'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Enterprise RAG Knowledge Copilot</h2>
            <p className="text-xs text-slate-400">Vector-Grounded Retrieval • Groq Hosted Inference</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Session</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 max-w-3xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-emerald-400 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-2">
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* Citations / Source References */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-emerald-400" /> Grounded Source References:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.citations.map((cite, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs hover:border-slate-700 transition-colors"
                      >
                        <div className="font-semibold text-emerald-400 truncate">{cite.title}</div>
                        <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">"{cite.snippet}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Retrieving vectors & synthesizing enterprise response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/90">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus-within:border-emerald-500/50 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask questions about company policies, technical docs, invoices..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
