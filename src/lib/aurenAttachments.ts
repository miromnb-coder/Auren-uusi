import * as ImagePicker from 'expo-image-picker';

export type AurenImageAttachment = {
  id: string;
  uri: string;
  mimeType: string;
  base64: string;
  width?: number;
  height?: number;
};

function createAttachmentId() {
  return `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function inferMimeType(uri: string, fallback?: string | null) {
  if (fallback?.startsWith('image/')) return fallback;

  const lowerUri = uri.toLowerCase();
  if (lowerUri.endsWith('.png')) return 'image/png';
  if (lowerUri.endsWith('.webp')) return 'image/webp';

  return 'image/jpeg';
}

export async function pickAurenImageAttachment() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: false,
    allowsEditing: false,
    base64: true,
    quality: 0.72,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];

  if (!asset?.uri || !asset.base64) {
    return null;
  }

  return {
    id: createAttachmentId(),
    uri: asset.uri,
    base64: asset.base64,
    mimeType: inferMimeType(asset.uri, asset.mimeType),
    width: asset.width,
    height: asset.height,
  } satisfies AurenImageAttachment;
}
