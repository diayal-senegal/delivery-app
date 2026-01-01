import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cameraService } from '../../services/camera/camera.service';
import { theme } from '../../theme/theme';

export default function ProofOfDeliveryScreen({ route, navigation }: any) {
  const { deliveryId, onComplete } = route.params;
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const takePhoto = () => {
    cameraService.showPhotoOptions((uri) => {
      setPhoto(uri);
    });
  };

  const handleSubmit = async () => {
    if (!photo) {
      Alert.alert('Photo requise', 'Veuillez prendre une photo de la livraison');
      return;
    }

    setLoading(true);
    try {
      const pod = {
        photo,
        signature,
        notes: notes.trim() || undefined,
        timestamp: Date.now(),
      };

      onComplete?.(pod);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la preuve de livraison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📷 Photo de livraison *</Text>
        {photo ? (
          <View>
            <Image source={{ uri: photo }} style={styles.photo} />
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.retakeButton} onPress={takePhoto}>
                <Text style={styles.retakeButtonText}>Reprendre</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => setPhoto(null)}>
                <Text style={styles.deleteButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>📷 Prendre une photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✍️ Signature client (optionnel)</Text>
        <View style={styles.signatureContainer}>
          <Text style={styles.signaturePlaceholder}>
            {signature ? '✓ Signature capturée' : 'Fonctionnalité à venir'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Notes (optionnel)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Ajoutez des notes sur la livraison..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <LinearGradient colors={theme.gradients.success} style={styles.buttonGradient}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Enregistrement...' : '✓ Valider la livraison'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  photoActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  photoButton: {
    backgroundColor: theme.colors.info,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  signatureContainer: {
    height: 150,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signaturePlaceholder: {
    color: theme.colors.textLight,
    fontSize: theme.fontSize.sm,
  },
  notesInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
