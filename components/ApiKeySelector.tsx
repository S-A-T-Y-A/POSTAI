
import React from 'react';

interface ApiKeySelectorProps {
    onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
    const handleSelectKey = async () => {
        try {
            await (window as any).aistudio.openSelectKey();
            // Assume success and optimistically update UI
            onKeySelected();
        } catch (e) {
            console.error('Failed to open API key selector', e);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-surface/80 backdrop-blur-md border-t border-brand-border p-4 shadow-2xl z-20 animate-fade-in">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <h3 className="font-bold text-brand-text">API Key Required for Video Generation</h3>
                    <p className="text-sm text-brand-text-secondary">
                        Please select an API key from a paid GCP project to use Veo. See the{' '}
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline hover:text-brand-secondary">
                            billing documentation
                        </a>.
                    </p>
                </div>
                <button
                    onClick={handleSelectKey}
                    className="flex-shrink-0 px-6 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-lg transition-all duration-300 ease-in-out transform hover:shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-0.5"
                >
                    Select API Key
                </button>
            </div>
        </div>
    );
};
