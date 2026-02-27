
import React from 'react';
import { Type, Image, Film, BookImage, ShieldCheck, Zap, Target, Key } from 'lucide-react';

export const HowItWorks: React.FC = () => {
    const features = [
        {
            icon: Type,
            title: 'Text Generation',
            description: 'Craft compelling social media captions, blog intros, or ad copy in seconds.',
            howTo: 'Enter a prompt describing the tone and topic. Optional: Upload an image for context.',
            benefit: 'Saves hours of writer\'s block and ensures high-converting copy.',
            cost: '1 Credit'
        },
        {
            icon: Image,
            title: 'Image Generation',
            description: 'Generate stunning, high-resolution visuals tailored to your brand.',
            howTo: 'Describe the scene, style, and lighting. Use a reference image for specific compositions.',
            benefit: 'No more expensive stock photos or complex design tools.',
            cost: '2 Credits'
        },
        {
            icon: Film,
            title: 'Video Generation',
            description: 'Create 10-second cinematic videos using state-of-the-art Veo technology.',
            howTo: 'Provide a detailed prompt. Uploading a starting image helps guide the visual style.',
            benefit: 'High-end video production at a fraction of the cost.',
            cost: '35 Credits'
        },
        {
            icon: BookImage,
            title: 'Story Generation',
            description: 'The ultimate marketing tool. Combines video generation with a persuasive sales pitch.',
            howTo: 'Upload at least one image and describe your product or story goal.',
            benefit: 'Complete, ready-to-post marketing assets in one click.',
            cost: '35 Credits'
        }
    ];

    return (
        <section className="mt-16 border-t border-brand-border pt-16 pb-24">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-brand-text mb-4">How It Works</h2>
                    <p className="text-brand-text-secondary">Master the art of AI content creation with our powerful suite of tools.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="bg-brand-bg/50 border border-brand-border p-6 rounded-2xl hover:border-brand-primary/30 transition-all group">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary group-hover:scale-110 transition-transform">
                                    <f.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-brand-text">{f.title}</h3>
                            </div>
                            <p className="text-brand-text-secondary text-sm mb-4">{f.description}</p>
                            
                            <div className="space-y-3 border-t border-brand-border pt-4">
                                <div className="flex items-start space-x-2 text-xs">
                                    <Zap size={14} className="text-brand-primary mt-0.5 flex-shrink-0" />
                                    <p><span className="text-brand-text font-semibold">How to use:</span> <span className="text-brand-text-secondary">{f.howTo}</span></p>
                                </div>
                                <div className="flex items-start space-x-2 text-xs">
                                    <Target size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <p><span className="text-brand-text font-semibold">Benefit:</span> <span className="text-brand-text-secondary">{f.benefit}</span></p>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-2">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded">Cost: {f.cost}</span>
                                    {f.requirement && (
                                        <span className="flex items-center text-[10px] text-yellow-500 font-medium">
                                            <Key size={10} className="mr-1" /> {f.requirement}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center text-center p-6">
                        <ShieldCheck className="text-brand-primary mb-4" size={32} />
                        <h4 className="font-bold text-brand-text mb-2">Secure & Private</h4>
                        <p className="text-xs text-brand-text-secondary">Your data and generations are private. We use enterprise-grade encryption for all processing.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6">
                        <Zap className="text-brand-primary mb-4" size={32} />
                        <h4 className="font-bold text-brand-text mb-2">Lightning Fast</h4>
                        <p className="text-xs text-brand-text-secondary">Most content is generated in under 30 seconds. Videos take slightly longer due to high-quality rendering.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
