export interface Segment {
  text: string;
  vector: number[];
}

export interface Document {
  id: string;
  source: string;
  vector: number[];
  text: string;
}

export interface ProcessedDocument {
  id: string;
  text: string;
  source: string;
  segments: Segment[];
}

export interface QueryResult {
  document: Document;
  similarity: number;
}

// vectordb.ts
export class VectorDB {
  private documents: Map<string, Map<string, Document>> = new Map();
  private tags: Map<string, Map<string, string[]>> = new Map();
  private tagIndex: Map<string, Map<string, string[]>> = new Map();

  constructor() {
  }

  addDocument(domain: string, document: Document, tags?: string[]): void {
    // Initialize domain maps if they don't exist
    if (!this.documents.has(domain)) {
      this.documents.set(domain, new Map());
      this.tags.set(domain, new Map());
      this.tagIndex.set(domain, new Map());
    }

    this.documents.get(domain)!.set(document.id, document);

    const docTags = tags || [];
    this.tags.get(domain)!.set(document.id, docTags);

    const domainTagIndex = this.tagIndex.get(domain)!;

    for (const tag of docTags) {
      if (!domainTagIndex.has(tag)) {
        domainTagIndex.set(tag, []);
      }

      const tagDocIds = domainTagIndex.get(tag)!;
      if (!tagDocIds.includes(document.id)) {
        tagDocIds.push(document.id);
      }
    }
  }
  
  private cosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    // Handle zero vectors
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }
  
  queryDocuments(
    domain: string,
    vector: number[],
    tags?: string[],
    topK?: number
  ): QueryResult[] {
    const k = topK || 10;
    
    if (!this.documents.has(domain)) {
      return [];
    }

    const domainDocs = this.documents.get(domain)!;
    const domainTagIndex = this.tagIndex.get(domain)!;

    let candidateIds: Set<string>;

    if (tags && tags.length > 0) {
      candidateIds = new Set();

      for (const tag of tags) {
        if (domainTagIndex.has(tag)) {
          const tagDocIds = domainTagIndex.get(tag)!;
          tagDocIds.forEach(id => candidateIds.add(id));
        }
      }
      
      if (candidateIds.size === 0) {
        return [];
      }
    } else {
      candidateIds = new Set(domainDocs.keys());
    }

    const similarities: QueryResult[] = [];

    for (const docId of candidateIds) {
      const document = domainDocs.get(docId)!;
     
      try {
        const similarity = this.cosineSimilarity(vector, document.vector);
        similarities.push({ document, similarity });
      } catch (error) {
        console.warn(`Error calculating similarity for document ${docId}:`, error);
        continue;
      }
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, k);
  }
  
  getDocument(domain: string, docId: string): Document | undefined {
    return this.documents.get(domain)?.get(docId);
  }
  
  listDomains(): string[] {
    return Array.from(this.documents.keys());
  }
  
  listDocumentsInDomain(domain: string): Document[] {
    const domainDocs = this.documents.get(domain);
    if (!domainDocs) {
      return [];
    }
    return Array.from(domainDocs.values());
  }
  
  deleteDocument(domain: string, docId: string): boolean {
    const domainDocs = this.documents.get(domain);
    const domainTags = this.tags.get(domain);
    const domainTagIndex = this.tagIndex.get(domain);

    if (!domainDocs || !domainDocs.has(docId)) {
      return false;
    }

    // Remove from documents
    domainDocs.delete(docId);

    // Remove from tags and tag index
    if (domainTags && domainTags.has(docId)) {
      const docTags = domainTags.get(docId)!;
      domainTags.delete(docId);

      // Clean up tag index
      if (domainTagIndex) {
        for (const tag of docTags) {
          if (domainTagIndex.has(tag)) {
            const tagDocIds = domainTagIndex.get(tag)!;
            const index = tagDocIds.indexOf(docId);
            if (index > -1) {
              tagDocIds.splice(index, 1);
            }
            // Remove empty tag entries
            if (tagDocIds.length === 0) {
              domainTagIndex.delete(tag);
            }
          }
        }
      }
    }

    return true;
  }

  /**
   * Get database statistics
   */
  getStats(): {
    domains: number;
    totalDocuments: number;
    documentsByDomain: Record<string, number>;
  } {
    const stats = {
      domains: this.documents.size,
      totalDocuments: 0,
      documentsByDomain: {} as Record<string, number>
    };

    for (const [domain, docs] of this.documents.entries()) {
      const count = docs.size;
      stats.documentsByDomain[domain] = count;
      stats.totalDocuments += count;
    }

    return stats;
  }
  
  clear(): void {
    this.documents.clear();
    this.tags.clear();
    this.tagIndex.clear();
  }
  
  export(): string {
    const data = {
      documents: Object.fromEntries(
        Array.from(this.documents.entries()).map(([domain, docs]) => [
          domain,
          Object.fromEntries(docs.entries())
        ])
      ),

      tags: Object.fromEntries(
        Array.from(this.tags.entries()).map(([domain, tags]) => [
          domain,
          Object.fromEntries(tags.entries())
        ])
      )
    };
    return JSON.stringify(data);
  }
  
  import(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      this.clear();

      for (const [domain, docs] of Object.entries(data.documents as Record<string, Record<string, Document>>)) {
        for (const [docId, doc] of Object.entries(docs)) {
          const tags = (data.tags as Record<string, Record<string, string[]>>)?.[domain]?.[docId] || [];
          this.addDocument(domain, doc, tags);
        }
      }
    } catch (error) {
      throw new Error(`Failed to import database: ${error}`);
    }
  }
  
  /**
   * Add a processed document with its segments to the vector database
   */
  addProcessedDocument(domain: string, processedDoc: ProcessedDocument, tags?: string[]): void {
    // Store each segment as a separate document in the vector database
    processedDoc.segments.forEach((segment, index) => {
      const segmentDoc: Document = {
        id: `${processedDoc.id}_segment_${index}`,
        source: processedDoc.source,
        vector: segment.vector,
        text: segment.text
      };
      
      // Add segment-specific tags
      const segmentTags = [
        ...(tags || []),
        'segment',
        `document:${processedDoc.id}`,
        `source:${processedDoc.source}`
      ];
      
      this.addDocument(domain, segmentDoc, segmentTags);
    });
    
    // Also store the full document if it has an overall vector
    // For now, we'll create an average vector from all segments
    if (processedDoc.segments.length > 0) {
      const avgVector = this.calculateAverageVector(processedDoc.segments.map(s => s.vector));
      
      const fullDoc: Document = {
        id: processedDoc.id,
        source: processedDoc.source,
        vector: avgVector,
        text: processedDoc.text
      };
      
      const fullDocTags = [
        ...(tags || []),
        'full-document',
        `source:${processedDoc.source}`
      ];
      
      this.addDocument(domain, fullDoc, fullDocTags);
    }
  }
  
  /**
   * Calculate average vector from multiple vectors
   */
  private calculateAverageVector(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];
    
    const dimension = vectors[0].length;
    const avgVector = new Array(dimension).fill(0);
    
    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        avgVector[i] += vector[i];
      }
    }
    
    for (let i = 0; i < dimension; i++) {
      avgVector[i] /= vectors.length;
    }
    
    return avgVector;
  }
  
  /**
   * Query for segments from a specific document
   */
  queryDocumentSegments(domain: string, documentId: string): Document[] {
    if (!this.documents.has(domain)) {
      return [];
    }
    
    const domainDocs = this.documents.get(domain)!;
    const segments: Document[] = [];
    
    for (const [id, doc] of domainDocs.entries()) {
      if (id.startsWith(`${documentId}_segment_`)) {
        segments.push(doc);
      }
    }
    
    return segments.sort((a, b) => {
      const aIndex = parseInt(a.id.split('_segment_')[1]);
      const bIndex = parseInt(b.id.split('_segment_')[1]);
      return aIndex - bIndex;
    });
  }
}