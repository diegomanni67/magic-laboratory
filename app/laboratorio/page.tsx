"use client";
import { useState } from 'react';

export default function MagicLaboratoryPage() {
  const [activeTab, setActiveTab] = useState('Laboratorio');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  const tabs = ['Laboratorio', 'Crónicas', 'Archivo Maestro'];

  const handlePublicar = () => {
    // Aquí después conectaremos con Supabase
    alert(`Publicando en ${activeTab}: ${titulo}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Magic Laboratory</h1>

        <div className="flex gap-4 mb-8 border-b border-gray-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium ${activeTab === tab ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Formulario de publicación */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-8">
          <h2 className="text-lg font-bold mb-4">Publicar en {activeTab}</h2>
          <input 
            className="w-full p-2 mb-4 border rounded-xl"
            placeholder="Título del aporte"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <textarea 
            className="w-full p-2 mb-4 border rounded-xl h-32"
            placeholder="Describe tu idea, anécdota o recomendación..."
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />
          <button 
            onClick={handlePublicar}
            className="bg-purple-600 text-white px-6 py-2 rounded-xl font-medium"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}