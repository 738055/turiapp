'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaqService } from '@/services/faqService';
import { Faq } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqPage() {
    const { t, language } = useLanguage();
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [loading, setLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            const data = await FaqService.getActive();
            setFaqs(data);
            setLoading(false);
        };
        fetchFaqs();
    }, []);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="pt-32 pb-12 px-6 bg-primary text-white">
                <div className="container mx-auto max-w-4xl text-center">
                    <h1 className="font-serif text-4xl md:text-5xl font-medium mb-4">{t.faq.title}</h1>
                    <p className="text-white/80 text-lg font-light">{t.faq.subtitle}</p>
                </div>
            </div>

            <div className="flex-1 container mx-auto max-w-3xl px-6 py-12">
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Carregando...</div>
                ) : faqs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm p-8">
                        {t.faq.empty}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div 
                                key={faq.id} 
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
                            >
                                <button 
                                    onClick={() => toggleAccordion(index)}
                                    className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none bg-white"
                                >
                                    <span className="font-serif font-bold text-lg text-gray-800 pr-4">
                                        {faq.question[language]}
                                    </span>
                                    {openIndex === index ? (
                                        <ChevronUp className="text-primary flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="text-gray-400 flex-shrink-0" />
                                    )}
                                </button>
                                
                                <div 
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                                        openIndex === index ? 'max-h-[500px] opacity-100 pb-6' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="pt-2 text-gray-600 leading-relaxed border-t border-gray-50">
                                        {faq.answer[language]}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </main>
    );
}