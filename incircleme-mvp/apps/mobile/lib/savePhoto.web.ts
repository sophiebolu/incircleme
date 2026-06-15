// Web variant: open the photo in a new tab (browser handles saving). Dev render only.
export async function savePhotoToDevice(url: string): Promise<boolean> {
  globalThis.open?.(url, '_blank');
  return true;
}
