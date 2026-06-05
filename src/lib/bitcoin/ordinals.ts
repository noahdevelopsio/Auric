const XVERSE_API_URL = process.env.NEXT_PUBLIC_XVERSE_API_URL ?? 'https://api.xverse.app';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${XVERSE_API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Xverse API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getInscriptionsByAddress(address: string) {
  return fetchJson<unknown>(`/v1/address/${address}/ordinals/inscriptions`);
}

export async function getInscriptionById(id: string) {
  return fetchJson<unknown>(`/v1/ordinals/inscriptions/${id}`);
}
