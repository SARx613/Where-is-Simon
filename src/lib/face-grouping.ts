export type FaceForGrouping = {
  id: string;
  photoId: string;
  photoUrl: string;
  embedding: number[];
};

export type GuestCluster = {
  id: string;
  faceCount: number;
  photoCount: number;
  samplePhotoUrls: string[];
};

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function parseEmbedding(raw: string | number[]): number[] {
  if (Array.isArray(raw)) return raw.map(Number);
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n));
  }
  return [];
}

export function normalizeFaces(rows: Array<{ id: string; photo_id: string; embedding: string | number[]; photoUrl: string }>): FaceForGrouping[] {
  return rows
    .map((row) => ({
      id: row.id,
      photoId: row.photo_id,
      photoUrl: row.photoUrl,
      embedding: parseEmbedding(row.embedding),
    }))
    .filter((row) => row.embedding.length === 128);
}

type MutableCluster = {
  id: string;
  centroid: number[];
  faces: FaceForGrouping[];
  photoIds: Set<string>;
};

export function clusterFaces(faces: FaceForGrouping[], threshold = 0.58): GuestCluster[] {
  const clusters: MutableCluster[] = [];

  for (const face of faces) {
    let bestCluster: MutableCluster | null = null;
    let bestScore = -1;

    for (const cluster of clusters) {
      const similarity = cosineSimilarity(face.embedding, cluster.centroid);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestCluster = cluster;
      }
    }

    if (!bestCluster || bestScore < threshold) {
      clusters.push({
        id: `guest_${clusters.length + 1}`,
        centroid: [...face.embedding],
        faces: [face],
        photoIds: new Set([face.photoId]),
      });
      continue;
    }

    bestCluster.faces.push(face);
    bestCluster.photoIds.add(face.photoId);

    const n = bestCluster.faces.length;
    for (let i = 0; i < bestCluster.centroid.length; i += 1) {
      bestCluster.centroid[i] = bestCluster.centroid[i] + (face.embedding[i] - bestCluster.centroid[i]) / n;
    }
  }

  return clusters
    .map((cluster) => {
      const samplePhotoUrls = Array.from(new Set(cluster.faces.map((face) => face.photoUrl))).slice(0, 3);
      return {
        id: cluster.id,
        faceCount: cluster.faces.length,
        photoCount: cluster.photoIds.size,
        samplePhotoUrls,
      };
    })
    .sort((a, b) => b.faceCount - a.faceCount);
}
