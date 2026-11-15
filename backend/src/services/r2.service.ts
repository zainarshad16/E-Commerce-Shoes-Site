import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_ASSET_POLICIES: Record<
  string,
  { folder: string; maxBytes: number; extensions: string[] }
> = {
  'model/gltf-binary': {
    folder: 'models',
    maxBytes: 8 * 1024 * 1024, // Strict 8 MB ceiling for Draco .glb models
    extensions: ['.glb'],
  },
  'image/webp': {
    folder: 'images',
    maxBytes: 5 * 1024 * 1024,
    extensions: ['.webp'],
  },
  'image/png': {
    folder: 'images',
    maxBytes: 5 * 1024 * 1024,
    extensions: ['.png'],
  },
  'image/jpeg': {
    folder: 'images',
    maxBytes: 5 * 1024 * 1024,
    extensions: ['.jpg', '.jpeg'],
  },
};

export interface PresignedUploadRequest {
  filename: string;
  contentType: string;
  fileSizeBytes: number;
  productSlug?: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  publicCdnUrl: string;
  objectKey: string;
  maxBytes: number;
  expiresInSeconds: number;
  cacheControl: string;
  mode: 'cloudflare-r2' | 'local-simulation';
}

function createR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    accountId.includes('your-cloudflare-account-id')
  ) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function sanitizeSlugSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createR2PresignedUpload(
  input: PresignedUploadRequest
): Promise<PresignedUploadResponse> {
  const policy = ALLOWED_ASSET_POLICIES[input.contentType];
  if (!policy) {
    throw new Error(
      `Unsupported MIME type "${input.contentType}". Allowed: ${Object.keys(ALLOWED_ASSET_POLICIES).join(', ')}`
    );
  }

  const lowerFilename = input.filename.toLowerCase();
  const hasValidExt = policy.extensions.some((ext) => lowerFilename.endsWith(ext));
  if (!hasValidExt) {
    throw new Error(
      `Invalid file extension for ${input.contentType}. Expected: ${policy.extensions.join(', ')}`
    );
  }

  if (input.fileSizeBytes <= 0 || input.fileSizeBytes > policy.maxBytes) {
    throw new Error(
      `File size ${input.fileSizeBytes} bytes exceeds maximum limit of ${policy.maxBytes} bytes (${(
        policy.maxBytes /
        (1024 * 1024)
      ).toFixed(0)} MB).`
    );
  }

  const safeSlug = sanitizeSlugSegment(input.productSlug || 'catalog');
  const safeName = sanitizeSlugSegment(input.filename);
  const nonce = crypto.randomBytes(6).toString('hex');
  const objectKey = `${policy.folder}/${safeSlug}/${Date.now()}-${nonce}-${safeName}`;
  const publicBase = (process.env.R2_PUBLIC_CDN_URL || 'https://cdn.aetherfootwear.com').replace(
    /\/$/,
    ''
  );
  const publicCdnUrl = `${publicBase}/${objectKey}`;
  const cacheControl = 'public, max-age=31536000, immutable';
  const expiresInSeconds = 300;

  const r2 = createR2Client();
  const bucketName = process.env.R2_BUCKET_NAME || 'aether-3d-assets';

  if (!r2) {
    // Allows Admin Studio testing without live R2 credentials while honoring exact schema contract
    return {
      uploadUrl: `${publicBase}/__r2_presigned_sim/${objectKey}`,
      publicCdnUrl,
      objectKey,
      maxBytes: policy.maxBytes,
      expiresInSeconds,
      cacheControl,
      mode: 'local-simulation',
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: input.contentType,
    ContentLength: input.fileSizeBytes,
    CacheControl: cacheControl,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    publicCdnUrl,
    objectKey,
    maxBytes: policy.maxBytes,
    expiresInSeconds,
    cacheControl,
    mode: 'cloudflare-r2',
  };
}

