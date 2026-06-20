'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaqService } from '@/services/faqService';
import { Faq } from '@/types';
import Button from '@/components/Button';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminFaqPage() {
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFaqs = async () => {
        setLoading(true);
        const data = await FaqService.getAll();
        setFaqs(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleDelete = async (id: string) => {
        if(confirm('Tem certeza que deseja excluir esta pergunta?')) {
            await FaqService.delete(id);
            fetchFaqs();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Gerenciar FAQs</h1>
                <Link href="/admin/faq/new">
                    <Button className="flex items-center gap-2"><Plus size={18}/> Nova Pergunta</Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando perguntas...</div>
                ) : faqs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-4">
                        <p>Nenhuma pergunta cadastrada.</p>
                        <Link href="/admin/faq/new">
                            <Button variant="outline">Criar a primeira</Button>
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm w-1/2">Pergunta (PT)</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {faqs.map((faq) => (
                                <tr key={faq.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        {faq.isActive ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                <CheckCircle size={12}/> Ativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                                                <XCircle size={12}/> Inativo
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 font-medium text-gray-800">{faq.question.pt}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/faq/${faq.id}`}>
                                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit size={18} />
                                                </button>
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(faq.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}