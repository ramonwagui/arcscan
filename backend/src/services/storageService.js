const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const BUCKET = 'documents';

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @param {Buffer} buffer - Conteúdo do arquivo
 * @param {string} mimetype - MIME type
 * @param {string} userId - ID do usuário
 * @param {string} originalName - Nome original do arquivo
 * @returns {Promise<{path: string, url: string}>}
 */
async function uploadFile(buffer, mimetype, userId, originalName) {
    if (!supabase) {
        // Mock mode: retornar um caminho fictício
        const mockPath = `${userId}/${uuidv4()}_${originalName}`;
        return { path: mockPath, url: `/mock-storage/${mockPath}` };
    }

    const ext = path.extname(originalName) || getExtFromMime(mimetype);
    const filename = `${uuidv4()}${ext}`;
    const filePath = `${userId}/${filename}`;

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
            contentType: mimetype,
            upsert: false,
        });

    if (error) {
        throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

    return { path: filePath, url: publicUrl };
}

/**
 * Remove um arquivo do Supabase Storage
 */
async function deleteFile(filePath) {
    if (!supabase) return;

    const { error } = await supabase.storage
        .from(BUCKET)
        .remove([filePath]);

    if (error) {
        console.error('Erro ao remover arquivo:', error.message);
    }
}

/**
 * Gera uma URL assinada temporária para visualização privada
 */
async function getSignedUrl(filePath, expiresIn = 3600) {
    if (!supabase) {
        return `/mock-storage/${filePath}`;
    }

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, expiresIn);

    if (error) throw new Error(`Erro ao gerar URL: ${error.message}`);
    return data.signedUrl;
}

function getExtFromMime(mime) {
    const map = {
        'application/pdf': '.pdf',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
    };
    return map[mime] || '';
}

const sharp = require('sharp');

async function generateThumbnail(buffer, mimetype) {
    if (!mimetype.startsWith('image/')) return null; // Por enquanto focado em imagens

    try {
        return await sharp(buffer)
            .resize(320, 240, { fit: 'inside', withoutEnlargement: true })
            .webp()
            .toBuffer();
    } catch (err) {
        console.error('[THUMBNAIL ERROR]', err.message);
        return null;
    }
}

module.exports = { uploadFile, deleteFile, getSignedUrl, generateThumbnail };
