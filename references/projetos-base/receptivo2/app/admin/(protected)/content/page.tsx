'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PartnersManager from '@/components/Admin/PartnersManager';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { Trash2, Plus, Edit2, Eye, Type, UploadCloud, X, Loader2 } from 'lucide-react';

// O wrapper QuillEditor já encapsula o CSS internamente — nunca importar react-quill/dist/quill.snow.css aqui
const ReactQuill = dynamic(() => import('@/components/Admin/QuillEditor'), {
  ssr: false,
  loading: () => <p>Carregando Editor...</p>,
}) as any;

export default function ContentManagerPage() {
  const supabase = createClientComponentClient();
  
  const [activeTab, setActiveTab] = useState('banners');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [banners, setBanners] = useState<any>([]);
  const [products, setProducts] = useState<any>([]);
  const [posts, setPosts] = useState<any>([]);

  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, pRes, postRes] = await Promise.all([
        supabase.from('banners').select('*').order('display_order', { ascending: true }),
        supabase.from('products').select('id, title, images, featured').order('title', { ascending: true }),
        supabase.from('posts').select('*').order('created_at', { ascending: false })
      ]);
      if (bRes.data) setBanners(bRes.data);
      if (pRes.data) setProducts(pRes.data);
      if (postRes.data) setPosts(postRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const toggleFeatured = async (product: any) => {
    const newStatus = !product.featured;
    setProducts(products.map((p: any) => p.id === product.id ? { ...p, featured: newStatus } : p));
    await supabase.from('products').update({ featured: newStatus }).eq('id', product.id);
  };

  const handleSaveBanner = async () => {
    setSaving(true);
    try {
      if (editingBanner.id && typeof editingBanner.id !== 'number') {
        await supabase.from('banners').update(editingBanner).eq('id', editingBanner.id);
      } else {
        delete editingBanner.id;
        await supabase.from('banners').insert([editingBanner]);
      }
      await fetchData();
      setEditingBanner(null);
    } catch (error) {
      alert('Erro ao salvar banner');
    }
    setSaving(false);
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita.')) return;
    await supabase.from('banners').delete().eq('id', id);
    setBanners(banners.filter((b: any) => b.id !== id));
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSavePost = async () => {
    setSaving(true);
    try {
      const postToSave = { ...editingPost };
      if (!postToSave.slug) postToSave.slug = generateSlug(postToSave.title);
      
      if (postToSave.id && typeof postToSave.id !== 'number') {
         await supabase.from('posts').update(postToSave).eq('id', postToSave.id);
      } else {
         delete postToSave.id;
         await supabase.from('posts').insert([postToSave]);
      }
      await fetchData();
      setEditingPost(null);
    } catch (error) {
      alert('Erro ao salvar post');
    }
    setSaving(false);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta postagem?')) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts(posts.filter((p: any) => p.id !== id));
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-600" size={40}/></div>;

  return (
    <div className="pb-12">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Conteúdo (CMS)</h1>
            <p className="text-sm text-gray-500">Controle o que aparece no site em tempo real.</p>
         </div>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-gray-200 mb-8">
         {[
           { id: 'banners', label: 'Banners da Home' },
           { id: 'products', label: 'Produtos em Destaque' },
           { id: 'blog', label: 'Blog e Notícias (SEO)' },
           { id: 'partners', label: 'Carrossel de Parceiros' }
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
              {tab.label}
           </button>
         ))}
      </div>

      {activeTab === 'banners' && (
         <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
               <h3 className="font-bold text-gray-800">Lista de Banners da Home</h3>
               <button onClick={() => setEditingBanner({ title: '', subtitle: '', image_url: '', button_text: 'Saiba Mais', link: '', align: 'center', active: true, display_order: banners.length + 1 })} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors">
                  <Plus size={18}/> Novo Banner
               </button>
            </div>

            {editingBanner && (
               <div className="bg-white p-6 rounded-xl shadow-lg border border-primary-200 relative">
                  <button onClick={() => setEditingBanner(null)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24}/></button>
                  <h3 className="font-bold mb-4 text-lg">Editando Banner</h3>
                  
                  <div className="mb-6 bg-primary-50 border border-primary-100 p-4 rounded-lg flex items-start gap-3">
                     <UploadCloud className="text-primary-500 mt-1" />
                     <div>
                        <p className="font-bold text-primary-800">Upload da Imagem</p>
                        <p className="text-xs text-primary-600 mb-2">Tamanho recomendado: 1920x600px. Formatos: JPG, PNG ou WEBP.</p>
                        <input type="file" accept="image/*" onChange={async (e) => {
                           if (!e.target.files || e.target.files.length === 0) return;
                           try {
                             setSaving(true);
                             const url = await handleFileUpload(e.target.files[0], 'general');
                             setEditingBanner({ ...editingBanner, image_url: url });
                           } catch (err) { alert('Erro no upload'); } finally { setSaving(false); }
                        }} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div><label className="block text-xs font-bold text-gray-500 mb-1">Título</label><input type="text" className="w-full border rounded p-2" value={editingBanner.title} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} /></div>
                     <div><label className="block text-xs font-bold text-gray-500 mb-1">Subtítulo</label><input type="text" className="w-full border rounded p-2" value={editingBanner.subtitle} onChange={e => setEditingBanner({...editingBanner, subtitle: e.target.value})} /></div>
                     <div><label className="block text-xs font-bold text-gray-500 mb-1">Texto do Botão</label><input type="text" className="w-full border rounded p-2" value={editingBanner.button_text} onChange={e => setEditingBanner({...editingBanner, button_text: e.target.value})} /></div>
                     <div><label className="block text-xs font-bold text-gray-500 mb-1">Link do Botão (Ex: /tours)</label><input type="text" className="w-full border rounded p-2" value={editingBanner.link} onChange={e => setEditingBanner({...editingBanner, link: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                     <button disabled={saving} onClick={handleSaveBanner} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors">
                        {saving ? 'Salvando no banco...' : 'Salvar Banner'}
                     </button>
                  </div>
               </div>
            )}

            <div className="grid gap-4 mt-6">
               {banners.map((banner: any) => (
                  <div key={banner.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                     <div className="w-32 h-20 rounded bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        {banner.image_url ? <img src={banner.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sem Foto</div>}
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{banner.title || '(Sem título)'}</h4>
                        <p className="text-sm text-gray-500">{banner.subtitle}</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setEditingBanner(banner)} className="p-2 text-primary-600 hover:bg-primary-100 rounded" title="Editar Banner"><Edit2 size={18}/></button>
                        <button onClick={() => handleDeleteBanner(banner.id)} className="p-2 text-red-600 hover:bg-red-100 rounded" title="Excluir Banner"><Trash2 size={18}/></button>
                     </div>
                  </div>
               ))}
               
               {/* Aviso de lista vazia */}
               {banners.length === 0 && !editingBanner && (
                  <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                     Nenhum banner cadastrado no momento. Clique no botão <b>"Novo Banner"</b> acima para adicionar imagens à página inicial.
                  </div>
               )}
            </div>
         </div>
      )}

      {activeTab === 'products' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs">
                  <tr><th className="px-6 py-4">Passeio / Produto</th><th className="px-6 py-4 text-center">Aparecer na Home?</th></tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {products.map((product: any) => (
                     <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 flex items-center gap-3">
                           <img src={product.images?.[0] || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded object-cover border" alt={product.title} />
                           <span className="font-bold text-gray-800">{product.title}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <button onClick={() => toggleFeatured(product)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${product.featured ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}>
                              {product.featured ? 'SIM (Destaque)' : 'NÃO'}
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}

      {activeTab === 'blog' && (
         <div className="space-y-6">
             <div className="flex justify-between items-center bg-primary-50 p-4 rounded-lg border border-primary-100">
                <div className="flex flex-col">
                   <span className="font-bold text-primary-800 flex items-center gap-2"><Type size={20}/> Blog e SEO</span>
                   <span className="text-xs text-primary-600">Artigos ajudam o seu site a ser encontrado no Google.</span>
                </div>
                <button onClick={() => setEditingPost({ title: '', content: '', excerpt: '', cover_image: '', active: true, published: true })} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                   <Plus size={18}/> Criar Post
                </button>
             </div>

             {editingPost && (
               <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 relative animate-fadeIn">
                  <button onClick={() => setEditingPost(null)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24}/></button>
                  <h3 className="font-bold mb-4 text-lg">Escrever Artigo</h3>
                  
                  <div className="mb-4">
                     <label className="block text-xs font-bold text-gray-500 mb-1">Capa do Artigo (800x600px)</label>
                     <input type="file" accept="image/*" onChange={async (e) => {
                           if (!e.target.files || e.target.files.length === 0) return;
                           try {
                             setSaving(true);
                             const url = await handleFileUpload(e.target.files[0], 'blog');
                             setEditingPost({ ...editingPost, cover_image: url });
                           } catch (err) { alert('Erro no upload'); } finally { setSaving(false); }
                     }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700" />
                     {editingPost.cover_image && <img src={editingPost.cover_image} className="mt-2 h-32 rounded object-cover" />}
                  </div>

                  <div className="mb-4">
                     <label className="block text-xs font-bold text-gray-500 mb-1">Título do Artigo</label>
                     <input type="text" className="w-full border rounded p-2 text-lg font-bold" placeholder="Ex: Melhores compras" value={editingPost.title} onChange={e => {
                        setEditingPost({...editingPost, title: e.target.value, slug: generateSlug(e.target.value)});
                     }} />
                  </div>
                  
                  <div className="mb-4">
                     <label className="block text-xs font-bold text-gray-500 mb-1">URL amigavel para SEO</label>
                     <input type="text" className="w-full border rounded p-2 bg-gray-50 text-gray-500 text-sm" value={editingPost.slug || ''} readOnly />
                  </div>

                  <div className="mb-4">
                     <label className="block text-xs font-bold text-gray-500 mb-1">Resumo (Aparece nos cards e no Google)</label>
                     <textarea className="w-full border rounded p-2" rows={2} value={editingPost.excerpt} onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})}></textarea>
                  </div>

                  <div className="mb-6">
                     <label className="block text-xs font-bold text-gray-500 mb-1">Conteúdo Completo</label>
                     <div className="bg-white">
                        <ReactQuill 
                           theme="snow" 
                           value={editingPost.content || ''} 
                           onChange={(value: string) => setEditingPost({...editingPost, content: value})}
                           className="h-64 mb-12"
                        />
                     </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                     <button disabled={saving} onClick={handleSavePost} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">
                        {saving ? 'Publicando...' : 'Publicar Artigo'}
                     </button>
                  </div>
               </div>
             )}
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post: any) => (
                   <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                      <div className="h-40 overflow-hidden relative bg-gray-100">
                         {post.cover_image && <img src={post.cover_image} className="w-full h-full object-cover" />}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                         <h4 className="font-bold text-gray-800 mb-2 leading-tight">{post.title}</h4>
                         <p className="text-xs text-gray-500 mb-4 line-clamp-2">{post.excerpt}</p>
                         <div className="mt-auto flex justify-end gap-2 border-t pt-3">
                            <button onClick={() => window.open(`/blog/${post.slug}`, '_blank')} className="p-1.5 text-gray-400 hover:text-primary-600 bg-gray-50 rounded" title="Ver no site"><Eye size={16}/></button>
                            <button onClick={() => setEditingPost(post)} className="p-1.5 text-primary-600 hover:text-white hover:bg-primary-600 bg-primary-50 rounded" title="Editar Artigo"><Edit2 size={16}/></button>
                            <button onClick={() => handleDeletePost(post.id)} className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded" title="Deletar Artigo"><Trash2 size={16}/></button>
                         </div>
                      </div>
                   </div>
                ))}
                {posts.length === 0 && !editingPost && (
                   <div className="col-span-full p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                     Nenhum artigo publicado ainda. Crie conteúdo para atrair visitas do Google!
                   </div>
                )}
             </div>
         </div>
      )}

      {activeTab === 'partners' && (
         <PartnersManager />
      )}
    </div>
  );
}

