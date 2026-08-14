/**
 * Smart RAG Semantic Text Chunking & Retrieval Service for SmartyHire Knowledge Vault
 */

/**
 * Split raw document text into semantic overlapping chunks.
 * @param {string} text - Extracted document text
 * @param {number} chunkSize - Target character length per chunk (default: 500)
 * @param {number} chunkOverlap - Overlap characters between consecutive chunks (default: 80)
 * @returns {Array<{ chunkIndex: number, text: string }>}
 */
const chunkText = (text, chunkSize = 500, chunkOverlap = 80) => {
  if (!text || typeof text !== 'string') return [];

  const cleanText = text.replace(/\r\n/g, '\n').trim();
  if (cleanText.length <= chunkSize) {
    return [{ chunkIndex: 0, text: cleanText }];
  }

  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize;

    // Adjust end boundary to preserve paragraph or sentence integrity
    if (endIndex < cleanText.length) {
      const nextNewline = cleanText.indexOf('\n\n', endIndex - 60);
      const nextPeriod = cleanText.indexOf('. ', endIndex - 40);

      if (nextNewline !== -1 && nextNewline < endIndex + 120) {
        endIndex = nextNewline + 2;
      } else if (nextPeriod !== -1 && nextPeriod < endIndex + 60) {
        endIndex = nextPeriod + 2;
      }
    }

    const chunkContent = cleanText.substring(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        chunkIndex,
        text: chunkContent,
      });
      chunkIndex++;
    }

    startIndex = endIndex - chunkOverlap;
    if (startIndex >= cleanText.length - chunkOverlap) break;
  }

  return chunks;
};

/**
 * Retrieve top K most relevant text chunks across Knowledge Vault documents matching candidate question.
 * @param {Array<Object>} documents - Collection of KnowledgeDocument records
 * @param {string} query - Candidate question
 * @param {number} topK - Number of top chunks to retrieve (default: 3)
 * @returns {Array<{ docTitle: string, category: string, score: number, text: string }>}
 */
const findRelevantChunks = (documents = [], query = '', topK = 3) => {
  if (!documents || documents.length === 0 || !query || query.trim().length === 0) return [];

  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
  const queryTerms = cleanQuery
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['what', 'when', 'where', 'how', 'who', 'why', 'is', 'are', 'the', 'our', 'for', 'about'].includes(w));

  if (queryTerms.length === 0) return [];

  const candidateChunks = [];

  documents.forEach((doc) => {
    const rawText = doc.extractedText || doc.content || '';
    const docTitle = doc.title || 'Document';
    const category = doc.category || 'Policy';

    const chunks = doc.chunks && doc.chunks.length > 0 ? doc.chunks : chunkText(rawText);

    chunks.forEach((c) => {
      const cText = c.text || '';
      const cLower = cText.toLowerCase();
      let score = 0;

      queryTerms.forEach((term) => {
        if (cLower.includes(term)) {
          score += 2;
          const count = cLower.split(term).length - 1;
          score += Math.min(count, 4) * 0.5;
        }
      });

      // Bonus if chunk contains structured lists or headings
      if (cLower.includes(':') || cLower.includes('•') || cLower.includes('- ') || cLower.includes('1.') || cLower.includes('2.')) {
        score += 0.5;
      }

      if (score > 0) {
        candidateChunks.push({
          docTitle,
          category,
          score,
          text: cText,
        });
      }
    });
  });

  // Sort candidate chunks by relevance score descending
  candidateChunks.sort((a, b) => b.score - a.score);

  // Return top K non-duplicate chunks
  const uniqueChunks = [];
  const seenTexts = new Set();

  for (const item of candidateChunks) {
    const snippet = item.text.substring(0, 50);
    if (!seenTexts.has(snippet)) {
      seenTexts.add(snippet);
      uniqueChunks.push(item);
    }
    if (uniqueChunks.length >= topK) break;
  }

  return uniqueChunks;
};

module.exports = {
  chunkText,
  findRelevantChunks,
};
