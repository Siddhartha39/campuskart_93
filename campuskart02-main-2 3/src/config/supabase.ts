import { createClient } from '@supabase/supabase-js';

// Supabase credentials come from environment for flexibility across deployments.
// Prefer Vite env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
const envUrl = typeof process !== 'undefined' && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
const envKey = typeof process !== 'undefined' && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
const supabaseUrl = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_URL as string | undefined)) || (envUrl as string) || 'https://gpaybdsegkoeojmudfip.supabase.co';
const supabaseKey = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined)) || (envKey as string) || 'sb_publishable_6zZHcqfsatk0f7_qWG6mmQ_ilsFgXSA';

declare global {
  // Cache the client on the global object to avoid creating multiple
  // GoTrueClient instances during HMR / fast refresh which can lead
  // to the warning "Multiple GoTrueClient instances detected".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __supabase_client__: any;
}

export const supabase = (globalThis as any).__supabase_client__ ?? ((globalThis as any).__supabase_client__ = createClient(supabaseUrl, supabaseKey));

export const SUPABASE_BUCKETS = {
  images: 'products',
  profiles: 'products',
  whispers: 'products',
  avatars: 'products'
} as const;

export const sanitizeFileName = (name: string) => {
  return name
    .normalize('NFKD')
    .replace(/[-]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const supabasePublicBase = supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public` : '/storage/v1/object/public';

export const normalizeSupabasePublicUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith('/storage/v1/object/public/')) {
      return url;
    }
    const normalizedPath = parsed.pathname.replace('/storage/v1/object/public', '');
    return `${supabasePublicBase}${normalizedPath}${parsed.search}`;
  } catch (error) {
    return url;
  }
};

export const uploadSupabaseFile = async (bucket: string, filePath: string, file: File | Blob): Promise<string> => {
  const safePath = filePath
    .split('/')
    .map((segment) => sanitizeFileName(segment))
    .join('/');

  try {
    // Upload file directly from the browser using the public/publishable key
    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(safePath, file as File | Blob, {
      upsert: true,
      contentType: (file as File).type || undefined,
    });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      if (uploadError.message?.includes('row-level security policy')) {
        throw new Error(
          'Supabase storage upload blocked by row-level security. Make sure the bucket policies allow uploads from the client, or configure the bucket as public for direct browser uploads.'
        );
      }
      throw new Error(uploadError.message || 'Supabase upload failed');
    }

    const { data: urlData, error: urlError } = await supabase.storage.from(bucket).getPublicUrl(safePath);
    if (urlError) {
      console.error('Supabase getPublicUrl error:', urlError);
      throw new Error(urlError.message || 'Failed to get public url');
    }

    if (!urlData?.publicUrl) throw new Error('Supabase did not return a publicUrl');
    return normalizeSupabasePublicUrl(urlData.publicUrl) as string;
  } catch (e: any) {
    console.error('uploadSupabaseFile exception:', e);
    throw new Error(e?.message || 'Upload failed');
  }
};