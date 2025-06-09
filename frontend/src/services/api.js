const API_BASE = '/api';

export async function createMultipartUpload(fileName, fileType, fileSize) {
  const response = await fetch(`${API_BASE}/create-multipart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, fileType, fileSize })
  });
  return response.json();
}

export async function signPart(key, uploadId, partNumber) {
  const response = await fetch(`${API_BASE}/sign-part`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, uploadId, partNumber })
  });
  return response.json();
}

export async function completeMultipartUpload(key, uploadId, parts) {
  const response = await fetch(`${API_BASE}/complete-multipart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, uploadId, parts })
  });
  return response.json();
}

export async function createMetadata(metadata) {
  const response = await fetch(`${API_BASE}/create-metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata)
  });
  return response.json();
}

export async function getMetadata(fileId) {
  const response = await fetch(`${API_BASE}/get-metadata?fileId=${fileId}`);
  return response.json();
}

export async function getDownloadUrl(fileId, passcode) {
  const response = await fetch(`${API_BASE}/get-download-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, passcode })
  });
  return response.json();
}

export async function listFiles() {
  const response = await fetch(`${API_BASE}/list-files`);
  return response.json();
}

export async function deleteFile(fileId) {
  const response = await fetch(`${API_BASE}/delete-file`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId })
  });
  return response.json();
}

export async function cleanExpired() {
  const response = await fetch(`${API_BASE}/clean-expired`, {
    method: 'POST'
  });
  return response.json();
} 