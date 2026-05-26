import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, Layout, Type, Download, Plus, Cpu } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- CONFIGURAÇÃO GEMINI (Obtenha sua chave em aistudio.google.com) ---
const GEN_AI = new GoogleGenerativeAI('SUA_CHAVE_API_AQUI');

export default function App() {
  const [project, setProject] = useState({
    photos: [],
    settings: {
      projectName: 'Projeto Mágico',
      format: '16:9',
      title: 'Título Sugerido pela IA',
      subtitle: 'Legenda Mágica',
      filter: 'none'
    }
  });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const canvasRef = useRef(null);

  // --- 🪄 FUNÇÃO "DESIGN MÁGICO" (ESTILO CANVA + GEMINI) ---
  const applyMagicDesign = async () => {
    if (project.photos.length === 0) return alert('Adicione fotos primeiro!');

    setIsAiLoading(true);
    try {
      const model = GEN_AI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Prompt para o Gemini atuar como um Designer do Canva
      const prompt = `Atue como um Diretor de Arte do Canva.
Tenho um projeto de vídeo com ${project.photos.length} fotos.
Sugira: 1 Título criativo, 1 Subtítulo e um estilo de filtro (vintage, modern, ou cinematic).
Responda APENAS em formato JSON: {"title": "...", "subtitle": "...", "filter": "..."}`;

      const result = await model.generateContent(prompt);
      const response = JSON.parse(result.response.text());

      setProject((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          title: response.title,
          subtitle: response.subtitle,
          filter: response.filter
        }
      }));
    } catch (error) {
      console.error('Erro na IA:', error);
      alert('Houve um erro ao consultar o Gemini. Verifique sua API Key.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- 🎨 MOTOR DE RENDERIZAÇÃO ESTILO CANVA ---
  const drawFrame = useCallback(
    (ctx) => {
      if (!canvasRef.current) return;

      const cw = canvasRef.current.width;
      const ch = canvasRef.current.height;

      // Fundo limpo
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);

      // Lógica de camadas (Layers) igual ao Canva
      const slide = project.photos[0]; // Simplificado para o exemplo
      if (slide && slide.img) {
        ctx.save();
        // Borda arredondada suave (Google/Canva Style)
        ctx.beginPath();
        ctx.roundRect(50, 50, cw - 100, ch - 100, 30);
        ctx.clip();
        ctx.drawImage(slide.img, 0, 0, cw, ch);
        ctx.restore();
      }

      // Overlay de Título IA
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(project.settings.title, cw / 2, ch - 150);
      ctx.font = '25px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(project.settings.subtitle, cw / 2, ch - 100);
    },
    [project]
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans">
      {/* SIDEBAR DE FERRAMENTAS IA */}
      <aside className="w-24 bg-white border-r border-zinc-200 flex flex-col items-center py-8 gap-6 shadow-sm">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Cpu size={24} />
        </div>

        <button onClick={applyMagicDesign} className="group relative flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all">
            <Sparkles size={24} />
          </div>
          <span className="text-[10px] font-bold mt-1 text-purple-600">MAGIC</span>
        </button>

        <div className="h-px w-8 bg-zinc-100" />

        <button className="p-4 rounded-2xl text-zinc-400 hover:bg-zinc-100 transition-all">
          <Layout size={24} />
        </button>
        <button className="p-4 rounded-2xl text-zinc-400 hover:bg-zinc-100 transition-all">
          <Type size={24} />
        </button>
      </aside>

      {/* EDITOR PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-zinc-800 tracking-tight">CanvaAI Editor</h1>
            <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase">Google Gemini 1.5 Pro</div>
          </div>

          <button className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2">
            <Download size={16} /> Baixar Vídeo
          </button>
        </header>

        {/* VIEWPORT */}
        <div className="flex-1 p-12 flex items-center justify-center relative">
          <div className="relative w-full max-w-4xl aspect-video bg-white shadow-2xl rounded-[40px] border-[16px] border-white overflow-hidden">
            <canvas ref={canvasRef} width={1920} height={1080} className="w-full h-full object-contain" />

            {isAiLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                <p className="text-purple-600 font-bold animate-pulse">Gemini está criando seu design...</p>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE */}
        <footer className="h-32 bg-white border-t border-zinc-200 flex items-center px-8 gap-4 overflow-x-auto">
          <label className="flex-shrink-0 w-24 h-20 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-zinc-400 hover:border-blue-400 hover:bg-blue-50 cursor-pointer">
            <Plus size={20} />
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.src = url;
                setProject((p) => ({ ...p, photos: [{ img, url }] }));

                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                  img.onload = () => drawFrame(ctx);
                }
              }}
            />
          </label>

          {project.photos.map((p, i) => (
            <div key={i} className="flex-shrink-0 h-20 aspect-video rounded-xl bg-zinc-100 overflow-hidden border-2 border-blue-500 shadow-lg">
              <img src={p.url} className="w-full h-full object-cover" alt={`Foto ${i + 1}`} />
            </div>
          ))}
        </footer>
      </main>
    </div>
  );
}
