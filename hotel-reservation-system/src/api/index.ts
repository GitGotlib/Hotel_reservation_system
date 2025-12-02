// Placeholder for REST helpers / API client wrappers
export async function fetcher(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  return res.json();
}
