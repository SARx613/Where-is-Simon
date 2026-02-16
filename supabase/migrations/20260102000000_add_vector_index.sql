-- Run after enough face embeddings exist in photo_faces.

create index if not exists idx_photo_faces_embedding
on public.photo_faces
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
