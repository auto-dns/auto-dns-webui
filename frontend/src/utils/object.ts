export function getValueByPath<T = any>(obj: T, path: string): any {
  return path.split('.').reduce((acc: any, key) => acc?.[key], obj);
}
