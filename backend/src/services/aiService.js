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
            console.log(`[GROQ MOCK] Respondendo simuladamente para: ${docTitle}`);
            return `Esta é uma resposta simulada (chave GROQ_API_KEY não configurada no .env).\n\nConteúdo lido: ${docContent?.length || 0} caracteres do documento "${docTitle}".`;
        }

        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `Você é um assistente de gestão documental do sistema Arcscan. Respondas em PORTUGUÊS BRASILEIRO. Use apenas os fatos presentes no documento fornecido.`
                    },
                    {
                        role: "user",
                        content: `DOCUMENTO: ${docTitle}\nCONTEÚDO: ${docContent || '(Vazio)'}\n\nPERGUNTA: ${userQuestion}`
                    }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
            });

            return completion.choices[0]?.message?.content || 'Sem resposta.';
        } catch (error) {
            console.error('[GROQ ERROR]', error.message);
            return 'Erro ao processar pergunta via IA.';
        }
    }

    async extractFields(category, ocrText) {
        if (!this.client) this._updateConfig();
        if (!this.client) return { status: 'mock', data: { info: 'Modo demonstração ativo' } };

        const prompts = {
            notas_fiscais: "Extraia CNPJ emitente, valor total e data de emissão.",
            contratos: "Extraia as partes (contratante/contratada), objeto, valor global e vigência.",
            convenios: "Extraia concedente, convenente, valor e prazo.",
            prontuarios: "Extraia nome do paciente, médico, data e diagnóstico/queixa.",
            outros: "Extraia os 3 pontos mais importantes do texto."
        };

        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Você é um extrator de dados JSON. Retorne APENAS um objeto JSON puro, sem markdown, sem explicações."
                    },
                    {
                        role: "user",
                        content: `Categoria: ${category}\nTexto: ${ocrText}\n\n${prompts[category] || prompts.outros}`
                    }
                ],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" },
                temperature: 0,
            });

            return JSON.parse(completion.choices[0]?.message?.content);
        } catch (error) {
            console.error('[GROQ EXTRACT ERROR]', error.message);
            return { error: 'Falha na extração de campos' };
        }
    }

    async classifyDocument(ocrText) {
        if (!this.client) this._updateConfig();
        if (!this.client) return { category: 'outros', confidence: 0 };

        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Classifique o documento em: contratos, notas_fiscais, oficios, convenios, projetos, prontuarios, outros. Retorne apenas JSON: { category, reason }."
                    },
                    {
                        role: "user",
                        content: `Texto do documento: ${ocrText.substring(0, 3000)}`
                    }
                ],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" },
                temperature: 0,
            });

            return JSON.parse(completion.choices[0]?.message?.content);
        } catch (error) {
            console.error('[GROQ CLASSIFY ERROR]', error.message);
            return { category: 'outros', reason: 'Erro na classificação' };
        }
    }

    async generateEmbedding(text) {
        if (!process.env.OPENAI_API_KEY) {
            // Mock: Retorna um vetor de 1536 dimensões (padrão pgvector)
            return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
        }

        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text.substring(0, 8000),
            });
            return response.data[0].embedding;
        } catch (err) {
            console.error('[EMBEDDING ERROR]', err.message);
            return Array(1536).fill(0);
        }
    }
}

module.exports = new AIService();
