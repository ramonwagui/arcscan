const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');

/**
 * Extrai texto de um buffer de arquivo usando OCR (imagens) ou pdf-parse (PDFs)
 */
async function extractText(buffer, mimetype, filename = '') {
    console.log(`[OCR] Processando: ${filename} (${mimetype})`);

    try {
        if (mimetype === 'application/pdf') {
            return await extractFromPDF(buffer);
        } else if (['image/jpeg', 'image/jpg', 'image/png'].includes(mimetype)) {
            // Pre-processar imagem com Sharp antes do OCR para evitar crashes e melhorar precisão
            const processedBuffer = await sharp(buffer)
                .grayscale() // OCR funciona melhor em cinza
                .toBuffer()
                .catch(err => {
                    console.error('[OCR] Erro ao processar imagem com Sharp:', err.message);
                    return buffer; // Fallback para buffer original
                });

            return await extractFromImage(processedBuffer);
        } else {
            throw new Error('Tipo de arquivo não suportado para OCR');
        }
    } catch (err) {
        console.error('[OCR] Erro ao extrair texto:', err.message);
        return '';
    }
}

/**
 * Extrai texto de PDF usando pdf-parse
 */
async function extractFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        const text = data.text?.trim() || '';

        if (text.length > 50) {
            console.log(`[OCR] PDF com texto nativo extraído: ${text.length} chars`);
            return text;
        }

        // PDF sem texto nativo (imagem escaneada) - converter para imagem via Sharp ou fallback tesseract
        console.log('[OCR] PDF sem texto nativo, usando fallback...');
        return await extractFromImage(buffer);
    } catch (err) {
        console.error('[OCR] Erro ao parsear PDF:', err.message);
        return '';
    }
}

/**
 * Extrai texto de imagem usando Tesseract.js
 */
async function extractFromImage(buffer) {
    try {
        const { data: { text } } = await Tesseract.recognize(buffer, 'por+eng', {
            logger: (m) => {
                if (m && m.status === 'recognizing text') {
                    // Não usa stdout direto para evitar issues em certos ambientes
                    // console.log(`[OCR] Progresso: ${Math.round(m.progress * 100)}%`);
                }
            }
        });

        console.log(`[OCR] Texto extraído: ${text?.length || 0} chars`);
        return text?.trim() || '';
    } catch (err) {
        console.error('[OCR] Tesseract crashou ou falhou:', err.message);
        return ''; // Retorna vazio em vez de crashar o processo
    }
}

module.exports = { extractText };
