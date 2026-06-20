import { createSupabaseServerClient } from "./supabase";

const BUCKET = "mimosaflor";

export async function uploadImage(
  blob: Blob,
  folder: string,
  filename: string
): Promise<{ url: string; path: string }> {
  const supabase = createSupabaseServerClient();
  const path = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: false, contentType: blob.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteImage(path: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function listImages(
  folder?: string
): Promise<{ url: string; path: string; name: string; size: number }[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(folder ?? "", { sortBy: { column: "created_at", order: "desc" } });

  if (error) throw new Error(error.message);
  if (!data) return [];

  return data
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => {
      const filePath = folder ? `${folder}/${f.name}` : f.name;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return {
        url: pub.publicUrl,
        path: filePath,
        name: f.name,
        size: f.metadata?.size ?? 0,
      };
    });
}
