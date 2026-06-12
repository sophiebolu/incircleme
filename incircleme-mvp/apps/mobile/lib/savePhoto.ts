// Native implementation — Metro picks savePhoto.web.ts on web.
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

export async function savePhotoToDevice(url: string): Promise<boolean> {
  const { granted } = await MediaLibrary.requestPermissionsAsync();
  if (!granted) return false;
  const target = `${FileSystem.cacheDirectory}capsule-${Date.now()}.jpg`;
  const dl = await FileSystem.downloadAsync(url, target);
  await MediaLibrary.saveToLibraryAsync(dl.uri);
  return true;
}
