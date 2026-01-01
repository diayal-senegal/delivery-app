import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

class CameraService {
  async takeDeliveryPhoto(): Promise<string | null> {
    try {
      // Demander permission caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Erreur caméra:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
      return null;
    }
  }

  async selectFromGallery(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Erreur galerie:', error);
      return null;
    }
  }

  showPhotoOptions(onPhotoTaken: (uri: string) => void): void {
    Alert.alert(
      'Photo de livraison',
      'Comment souhaitez-vous ajouter une photo ?',
      [
        {
          text: 'Prendre une photo',
          onPress: async () => {
            const uri = await this.takeDeliveryPhoto();
            if (uri) onPhotoTaken(uri);
          }
        },
        {
          text: 'Choisir dans la galerie',
          onPress: async () => {
            const uri = await this.selectFromGallery();
            if (uri) onPhotoTaken(uri);
          }
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  }
}

export const cameraService = new CameraService();