import { pipeline, env } from '@xenova/transformers';

// Skip local checks for models since we are running in browser context usually
env.allowLocalModels = false;
env.useBrowserCache = true;

class AIModelManager {
    static instance: AIModelManager;
    private toxicityClassifier: any = null;
    private featureExtractor: any = null;

    // Singleton pattern
    static getInstance(): AIModelManager {
        if (!AIModelManager.instance) {
            AIModelManager.instance = new AIModelManager();
        }
        return AIModelManager.instance;
    }

    /**
     * text-classification task
     * Model: Xenova/distilbert-base-uncased-finetuned-sst-2-english
     * Used for: Detecting negative sediment/toxicity in lobby names
     */
    async classifyToxicity(text: string) {
        if (!this.toxicityClassifier) {
            console.log('⏳ Loading Toxicity Model...');
            // Using a sentiment model as a proxy for toxicity (Negative = Toxic)
            this.toxicityClassifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            console.log('✅ Toxicity Model Loaded');
        }

        const result = await this.toxicityClassifier(text);
        // Result format: [{ label: 'POSITIVE', score: 0.99 }]
        // We consider 'NEGATIVE' with high confidence as potentially toxic/hostile
        return result[0];
    }

    /**
     * feature-extraction task
     * Model: Xenova/all-MiniLM-L6-v2
     * Used for: Creating embeddings for semantic search matchmaker
     */
    async getEmbeddings(text: string) {
        if (!this.featureExtractor) {
            console.log('⏳ Loading Matchmaker Model...');
            this.featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            console.log('✅ Matchmaker Model Loaded');
        }

        const output = await this.featureExtractor(text, { pooling: 'mean', normalize: true });
        // Returns a Tensor, we want the array
        return output.data;
    }

    /**
     * Calculate Cosine Similarity between two embedding arrays
     */
    cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]) {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            magnitudeA += a[i] * a[i];
            magnitudeB += b[i] * b[i];
        }

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) return 0;

        return dotProduct / (magnitudeA * magnitudeB);
    }
}

export const getAiManager = () => AIModelManager.getInstance();
