import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Per user request, manually pass the service key for local development if it exists.
const localKeyPath = path.join(__dirname, 'postai-media.json');
const storage = fs.existsSync(localKeyPath)
  ? new Storage({ keyFilename: localKeyPath })
  : new Storage();

// const storage = new Storage();

const BUCKET_NAME = 'postai_media';

export async function uploadToGCPStorage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  type: string = 'image'
): Promise<string> {
  // Save in subfolder by type
  const folder = type === 'video' ? 'videos' : type === 'story' ? 'stories' : 'images';
  const objectName = `${folder}/${fileName}`;
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(objectName);
  await file.save(fileBuffer, {
    contentType: mimeType,
    resumable: false,
  });
  // No makePublic() needed for uniform bucket-level access
  return `https://storage.googleapis.com/${BUCKET_NAME}/${objectName}`;
  // If you need to make the file public, you can set the ACL to public-read
  // await file.makePublic();
  // return `https://storage.googleapis.com/${BUCKET_NAME}/${objectName}`;
}
