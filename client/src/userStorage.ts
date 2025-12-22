import api from "./api";

export const loadUserStorage = async <T>(key: string): Promise<T | null> => {
  try {
    const response = await api.get(`/api/storage/${encodeURIComponent(key)}`);
    const data = response?.data?.data as T | null | undefined;
    return data ?? null;
  } catch {
    return null;
  }
};

export const saveUserStorage = async (key: string, data: unknown) => {
  try {
    await api.put(`/api/storage/${encodeURIComponent(key)}`, { data });
    return true;
  } catch {
    return false;
  }
};
