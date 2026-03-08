const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Dados mockados para desenvolvimento sem Supabase
let mockDocuments = [
    {
        id: 'mock-doc-1',
        user_id: 'mock-user-id',
        title: 'Contrato de Prestação de Serviços 2024',
        filename: 'contrato_servicos_2024.pdf',
        file_path: 'mock/contrato_servicos_2024.pdf',
        file_size: 245760,
        file_type: 'application/pdf',
        category: 'contratos',
        ocr_text: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nPor este instrumento particular, as partes abaixo identificadas celebram o presente contrato de prestação de serviços técnicos de consultoria em tecnologia da informação.\n\nCONTRATANTE: Prefeitura Municipal de São Paulo, inscrita no CNPJ sob nº 46.396.098/0001-17, representada pelo seu Prefeito.\n\nCONTRATADA: TechSolutions Ltda., inscrita no CNPJ sob nº 12.345.678/0001-90.\n\nOBJETO: Prestação de serviços de desenvolvimento e manutenção de sistemas de gestão municipal.\n\nVALOR: R$ 150.000,00 (cento e cinquenta mil reais) mensais.\n\nPRAZO: 12 (doze) meses, com início em 01/01/2024.\n\nCLÁUSULAS GERAIS: O contratado se compromete a entregar os relatórios mensais de atividades até o 5º dia útil de cada mês subsequente.',
        status: 'completed',
        approval_status: 'approved',
        approval_notes: 'Documento verificado e aprovado pelo financeiro.',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:35:00Z',
    },
    {
        id: 'mock-doc-2',
        user_id: 'mock-user-id',
        title: 'Nota Fiscal - Material de Escritório',
        filename: 'nf_material_escritorio_0892.pdf',
        file_path: 'mock/nf_material_escritorio_0892.pdf',
        file_size: 89600,
        file_type: 'application/pdf',
        category: 'notas_fiscais',
        ocr_text: 'NOTA FISCAL ELETRÔNICA\n\nNúmero: 000892\nSérie: 001\nData de Emissão: 20/01/2024\n\nEMITENTE: Papelaria Central Ltda.\nCNPJ: 98.765.432/0001-11\nEndereço: Rua das Flores, 123, Centro, São Paulo/SP\n\nDESTINATÁRIO: Secretaria Municipal de Administração\nCNPJ: 46.396.098/0002-08\n\nITENS:\n- Resmas de Papel A4 (500 fls) - 10 unidades - R$ 35,00/un - Total: R$ 350,00\n- Canetas esferográficas azuis (cx 50 un) - 5 caixas - R$ 45,00/cx - Total: R$ 225,00\n- Grampeadores - 3 unidades - R$ 28,00/un - Total: R$ 84,00\n\nTOTAL DA NOTA: R$ 659,00\nIMPOSTOS: ICMS 12% - R$ 79,08\nVALOR LÍQUIDO: R$ 579,92',
        status: 'completed',
        approval_status: 'pending',
        approval_notes: null,
        created_at: '2024-01-20T14:15:00Z',
        updated_at: '2024-01-20T14:20:00Z',
    },
    {
        id: 'mock-doc-3',
        user_id: 'mock-user-id',
        title: 'Ofício nº 045/2024 - Solicitação de Equipamentos',
        filename: 'oficio_045_2024.png',
        file_path: 'mock/oficio_045_2024.png',
        file_size: 512000,
        file_type: 'image/png',
        category: 'oficios',
        ocr_text: 'OFÍCIO Nº 045/2024\n\nSão Paulo, 25 de janeiro de 2024.\n\nAo Senhor\nSecretário Municipal de Educação\nSr. Carlos Roberto Ferreira\n\nAssunto: Solicitação de equipamentos de informática para laboratório\n\nSenhor Secretário,\n\nEsta Diretoria Regional de Ensino vem, respeitosamente, solicitar a aquisição de 30 (trinta) computadores desktop para implantação do laboratório de informática da EMEF Presidente Kennedy, localizada à Rua João Paulo II, 456.\n\nOs equipamentos são necessários para atender ao projeto de inclusão digital aprovado pelo Conselho Municipal de Educação na Resolução CME nº 12/2023.\n\nEspecificações mínimas requeridas:\n- Processador Intel Core i5 ou equivalente\n- Memória RAM 8GB\n- SSD 256GB\n\nAtenciosamente,\n\nDra. Ana Paula Silva\nDiretora Regional de Ensino - DRE Centro',
        status: 'completed',
        created_at: '2024-01-25T09:00:00Z',
        updated_at: '2024-01-25T09:10:00Z',
    },
    {
        id: 'mock-doc-4',
        user_id: 'mock-user-id',
        title: 'Convênio Municipal - Saúde Pública 2024',
        filename: 'convenio_saude_2024.pdf',
        file_path: 'mock/convenio_saude_2024.pdf',
        file_size: 389120,
        file_type: 'application/pdf',
        category: 'convenios',
        ocr_text: 'TERMO DE CONVÊNIO Nº 003/2024\n\nProcesso nº 2024.0.000123-4\n\nConvênio que entre si celebram o Município de São Paulo, por meio da Secretaria Municipal de Saúde, e o Hospital das Clínicas da FMUSP, para execução do Programa de Atenção Básica à Saúde.\n\nCONCEDENTE: Prefeitura do Município de São Paulo - Secretaria Municipal de Saúde\nCNPJ: 46.396.098/0003-80\n\nCONVENIADO: Hospital das Clínicas da Faculdade de Medicina da USP\nCNPJ: 62.779.145/0001-90\n\nOBJETO: Repasse de recursos financeiros para execução de ações de atenção básica à saúde no âmbito do Programa Saúde da Família nas UBS do Distrito Sé.\n\nVIGÊNCIA: 01/02/2024 a 31/01/2025\n\nVALOR GLOBAL: R$ 2.400.000,00 (dois milhões e quatrocentos mil reais)',
        status: 'completed',
        created_at: '2024-02-01T11:00:00Z',
        updated_at: '2024-02-01T11:15:00Z',
    },
    {
        id: 'mock-doc-5',
        user_id: 'mock-user-id',
        title: 'Prontuário Médico - Paciente 12847',
        filename: 'prontuario_12847.pdf',
        file_path: 'mock/prontuario_12847.pdf',
        file_size: 156672,
        file_type: 'application/pdf',
        category: 'prontuarios',
        ocr_text: 'PRONTUÁRIO MÉDICO\n\nNúmero de Registro: 12847\nUnidade de Saúde: UBS Vila Mariana\n\nPACIENTE: João da Silva\nData de Nascimento: 15/03/1965\nCPF: ***.456.789-**\nCartão SUS: 123456789012345\n\nCONSULTA: 10/02/2024 - 09:30h\nMédico: Dr. Roberto Almeida - CRM 12345/SP\nEspecialidade: Clínica Geral\n\nQUEIXA PRINCIPAL: Paciente refere cefaleia persistente há 5 dias, associada a hipertensão.\n\nHIPÓTESE DIAGNÓSTICA: Cefaleia tensional. Hipertensão arterial sistêmica.\n\nPRESCRIÇÃO:\n- Enalapril 10mg - 1 comprimido ao dia\n- Dipirona 500mg - 1 comprimido a cada 6h se dor\n\nRetorno: 30 dias',
        status: 'completed',
        created_at: '2024-02-10T09:30:00Z',
        updated_at: '2024-02-10T09:45:00Z',
    },
    {
        id: 'mock-doc-6',
        user_id: 'mock-user-id',
        title: 'Projeto de Lei - Mobilidade Urbana',
        filename: 'pl_mobilidade_urbana.pdf',
        file_path: 'mock/pl_mobilidade_urbana.pdf',
        file_size: 278528,
        file_type: 'application/pdf',
        category: 'projetos',
        ocr_text: 'PROJETO DE LEI Nº 789/2024\n\nDispõe sobre a política municipal de mobilidade urbana sustentável.\n\nA CÂMARA MUNICIPAL DE SÃO PAULO DECRETA:\n\nArt. 1º Fica instituída a Política Municipal de Mobilidade Urbana Sustentável, com os seguintes objetivos:\n\nI - Redução das emissões de gases poluentes no transporte público;\nII - Ampliação da infraestrutura cicloviária;\nIII - Integração entre modais de transporte;\nIV - Priorização do transporte público coletivo.\n\nArt. 2º O Município investirá no mínimo 15% do orçamento de infraestrutura em projetos de mobilidade sustentável.\n\nArt. 3º Fica criado o Comitê Municipal de Mobilidade Urbana, composto por:\n- 3 representantes do Poder Executivo\n- 2 representantes da sociedade civil\n- 1 representante dos operadores de transporte público\n\nPLENÁRIO MUNICIPAL, 15 de fevereiro de 2024.',
        status: 'completed',
        created_at: '2024-02-15T16:00:00Z',
        updated_at: '2024-02-15T16:20:00Z',
    },
];

/**
 * Cria um novo documento no banco
 */
async function createDocument(data) {
    if (!supabase) {
        const doc = {
            ...data,
            id: uuidv4(),
            approval_status: 'pending',
            approval_notes: null,
            ai_category_suggestion: null,
            expires_at: null,
            embedding: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        mockDocuments.push(doc);
        return doc;
    }

    const { data: doc, error } = await supabase
        .from('documents')
        .insert([data])
        .select()
        .single();

    if (error) throw new Error(`Erro ao criar documento: ${error.message}`);
    return doc;
}

/**
 * Atualiza um documento (ex: após OCR)
 */
async function updateDocument(id, userId, updates) {
    if (!supabase) {
        const idx = mockDocuments.findIndex(d => d.id === id && d.user_id === userId);
        if (idx === -1) throw new Error('Documento não encontrado');
        mockDocuments[idx] = { ...mockDocuments[idx], ...updates, updated_at: new Date().toISOString() };
        return mockDocuments[idx];
    }

    // Garante que campos nulos de IA ou Vencimento sejam aceitos
    const cleanedUpdates = { ...updates };
    if (cleanedUpdates.updated_at === undefined) cleanedUpdates.updated_at = new Date().toISOString();

    const { data: doc, error } = await supabase
        .from('documents')
        .update(cleanedUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(`Erro ao atualizar documento: ${error.message}`);
    return doc;
}

/**
 * Remove um documento
 */
async function deleteDocument(id, userId) {
    if (!supabase) {
        mockDocuments = mockDocuments.filter(d => !(d.id === id && d.user_id === userId));
        return;
    }

    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw new Error(`Erro ao deletar documento: ${error.message}`);
}

/**
 * Busca um documento por ID
 */
async function getDocumentById(id, userId) {
    if (!supabase) {
        return mockDocuments.find(d => d.id === id && d.user_id === userId) || null;
    }

    const { data: doc, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error) return null;
    return doc;
}

/**
 * Lista documentos do usuário com filtros opcionais
 */
async function listDocuments(userId, { category, dateFrom, dateTo, limit = 50, offset = 0 } = {}) {
    if (!supabase) {
        let docs = mockDocuments.filter(d => d.user_id === userId);
        if (category) docs = docs.filter(d => d.category === category);
        if (dateFrom) docs = docs.filter(d => new Date(d.created_at) >= new Date(dateFrom));
        if (dateTo) docs = docs.filter(d => new Date(d.created_at) <= new Date(dateTo));
        docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return { documents: docs.slice(offset, offset + limit), total: docs.length };
    }

    let query = supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data, error, count } = await query;
    if (error) throw new Error(`Erro ao listar documentos: ${error.message}`);
    return { documents: data || [], total: count || 0 };
}

/**
 * Busca textual por palavra-chave nos documentos do usuário
 */
async function searchDocuments(userId, query, { category, dateFrom, dateTo } = {}) {
    if (!supabase) {
        // Busca simples em mock (case-insensitive)
        const q = query.toLowerCase();
        let docs = mockDocuments.filter(d => {
            if (d.user_id !== userId) return false;
            const inTitle = d.title?.toLowerCase().includes(q);
            const inText = d.ocr_text?.toLowerCase().includes(q);
            return inTitle || inText;
        });

        if (category) docs = docs.filter(d => d.category === category);
        if (dateFrom) docs = docs.filter(d => new Date(d.created_at) >= new Date(dateFrom));
        if (dateTo) docs = docs.filter(d => new Date(d.created_at) <= new Date(dateTo));

        return docs.map(doc => ({
            ...doc,
            snippet: extractSnippet(doc.ocr_text, query),
        }));
    }

    // Busca full-text no PostgreSQL
    let rpcQuery = supabase.rpc('search_documents', {
        p_user_id: userId,
        p_query: query,
        p_category: category || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
    });

    const { data, error } = await rpcQuery;
    if (error) {
        // Fallback: busca ILIKE simples
        let q2 = supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .or(`title.ilike.%${query}%,ocr_text.ilike.%${query}%`);

        if (category) q2 = q2.eq('category', category);
        const { data: d2, error: e2 } = await q2;
        if (e2) throw new Error(`Erro na busca: ${e2.message}`);

        return (d2 || []).map(doc => ({
            ...doc,
            snippet: extractSnippet(doc.ocr_text, query),
        }));
    }

    return (data || []).map(doc => ({
        ...doc,
        snippet: extractSnippet(doc.ocr_text, query),
    }));
}

/**
 * Extrai um trecho do texto ao redor do termo buscado
 */
function extractSnippet(text, query, contextLength = 150) {
    if (!text || !query) return '';

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);

    if (idx === -1) return text.substring(0, contextLength) + '...';

    const start = Math.max(0, idx - contextLength / 2);
    const end = Math.min(text.length, idx + query.length + contextLength / 2);

    let snippet = text.substring(start, end).trim();
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
}

/**
 * Estatísticas do dashboard
 */
async function getDashboardStats(userId) {
    if (!supabase) {
        const docs = mockDocuments.filter(d => d.user_id === userId);
        const byCategory = {};
        docs.forEach(d => {
            byCategory[d.category] = (byCategory[d.category] || 0) + 1;
        });

        const thisMonth = new Date();
        thisMonth.setDate(1);
        const uploadedThisMonth = docs.filter(d => new Date(d.created_at) >= thisMonth).length;

        const byStatus = { pending: 0, reviewing: 0, approved: 0, rejected: 0 };
        docs.forEach(d => {
            const s = d.approval_status || 'pending';
            if (byStatus[s] !== undefined) byStatus[s]++;
        });

        return {
            totalDocuments: docs.length,
            byCategory,
            byStatus,
            uploadedThisMonth,
            lastUpload: docs.length > 0 ? docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at : null,
        };
    }

    const { data, error } = await supabase
        .from('documents')
        .select('category, created_at, approval_status')
        .eq('user_id', userId);

    if (error) throw new Error(`Erro ao buscar stats: ${error.message}`);

    const docs = data || [];
    const byCategory = {};
    const byStatus = { pending: 0, reviewing: 0, approved: 0, rejected: 0 };

    docs.forEach(d => {
        byCategory[d.category] = (byCategory[d.category] || 0) + 1;
        const s = d.approval_status || 'pending';
        if (byStatus[s] !== undefined) byStatus[s]++;
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const uploadedThisMonth = docs.filter(d => new Date(d.created_at) >= thisMonth).length;

    return {
        totalDocuments: docs.length,
        byCategory,
        byStatus,
        uploadedThisMonth,
        lastUpload: docs.length > 0 ? docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at : null,
    };
}

async function getExpiringDocuments(userId, days = 30) {
    if (supabase.isMock) {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() + days);
        return mockDocuments.filter(d =>
            d.user_id === userId &&
            d.expires_at &&
            new Date(d.expires_at) <= threshold &&
            new Date(d.expires_at) >= new Date()
        );
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + parseInt(days));

    const { data, error } = await supabase.client
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .gte('expires_at', new Date().toISOString())
        .lte('expires_at', maxDate.toISOString())
        .order('expires_at', { ascending: true });

    if (error) throw new Error('Erro ao buscar documentos expirando: ' + error.message);
    return data;
}

module.exports = {
    createDocument,
    updateDocument,
    deleteDocument,
    getDocumentById,
    listDocuments,
    searchDocuments,
    getDashboardStats,
    extractSnippet,
    getExpiringDocuments,
};
