import bridge from '@forge/bridge';

export async function invoke<T>(functionName: string, payload?: Record<string, unknown>): Promise<T> {
  return bridge.invoke(functionName, payload) as Promise<T>;
}
