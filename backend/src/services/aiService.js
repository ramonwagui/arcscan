const OpenAI = require('openai');

/**
 * Serviço de IA para interação com documentos (RAG Simplementado via Groq)
 */
class AIService {
    constructor() {
        this._updateConfig();
    }

    _updateConfig() {
        this.apiKey = process.env.GROQ_API_KEY;
        // O Groq usa o SDK da OpenAI mas com um baseURL diferente
        const isValid = this.apiKey && this.apiKey.startsWith('gsk_') && this.apiKey.length > 20;

        if (isValid) {
            this.client = new OpenAI({
                apiKey: this.apiKey,
                baseURL: 'https://api.groq.com/openai/v1'
            });
        } else {
            this.client = null;
        }
    }

    async askDocument(docTitle, docContent, userQuestion) {
        if (!this.client) this._updateConfig();

        if (!this.client) {
            // Mock mode se não houver chave real (gsk_...)
            console.log(`[GROQ MOCK] Respondendo simuladamente para: ${docTitle}`);
            return `Esta é uma resposta simulada (chave GROQ_API_KEY não configurada no .env).\n\nPara usar a inteligência real do Groq, pegue uma chave gratuita em console.groq.com e adicione no arquivo .env do backend.\n\nConteúdo lido: ${docContent?.length || 0} caracteres do documento "${docTitle}".`;
        }

        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `Você é um assistente de gestão documental do sistema Arcscan.
                        Responda em PORTUGUÊS BRASILEIRO.
                        Use apenas os fatos presentes no documento fornecido.
                        Se não souber a resposta, diga honestamente que a informação não foi encontrada.`
                    },
                    {
                        role: "user",
                        content: `DOCUMENTO: ${docTitle}
                        CONTEÚDO EXTRAÍDO:
                        ---
                        ${docContent || '(Sem texto disponível)'}
                        ---

                        PERGUNTA: ${userQuestion}`
                    }
                ],
                model: "llama-3.3-70b-versatile", // Modelo de alta performance e gratuito no Groq
                temperature: 0.1, // Mais preciso
            });

            const text = completion.choices[0]?.message?.content;
            if (!text) throw new Error('O Groq não gerou uma resposta.');
            return text;
        } catch (error) {
            console.error('[GROQ SERVICE ERROR]', error.status || 'UNKNOWN', error.message);

            if (error.status === 401) {
                return "Erro: Sua chave GROQ_API_KEY é inválida. Verifique em console.groq.com";
            }
            if (error.status === 429) {
                return "Erro: Limite de taxa do Groq atingido. Tente novamente em 1 minuto.";
            }

            throw new Error('Falha técnica ao falar com a IA via Groq.');
        }
    }
}

module.exports = new AIService();
