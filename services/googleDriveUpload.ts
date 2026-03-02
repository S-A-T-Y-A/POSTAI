// googleDriveUpload.ts
// Uploads a file to the user's Google Drive using their access token

export async function uploadFileToGoogleDrive({
  accessToken,
  file,
  fileName,
  mimeType = 'application/octet-stream',
  folderId = null,
}: {
  accessToken: string;
  file: Blob | File;
  fileName: string;
  mimeType?: string;
  folderId?: string | null;
}) {
  const metadata = {
    name: fileName,
    mimeType,
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Drive upload failed: ${error}`);
  }

  return await response.json(); // Returns file metadata (id, name, etc.)
}
