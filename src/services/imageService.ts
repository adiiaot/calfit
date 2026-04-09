import * as ImagePicker from 'expo-image-picker';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const pickImageFromGallery = async (): Promise<string | null> => {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};

export const uploadImageToCloudinary = async (
  imageUri: string,
  userId: string
): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `avatar_${userId}.jpg`,
    } as any);
    formData.append('upload_preset', UPLOAD_PRESET ?? 'calfit_avatars');
    formData.append('public_id', `calfit_avatars/${userId}`);
    formData.append('overwrite', 'true');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    }
    return null;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    return null;
  }
};