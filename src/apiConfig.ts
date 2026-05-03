export const getApiUrl = (path: string) => {
  const baseUrl = (import.meta as any).env?.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};
