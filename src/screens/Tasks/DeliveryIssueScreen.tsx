import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { deliveriesApi } from '../../services/api/deliveries.api';

export default function DeliveryIssueScreen({ route, navigation }: any) {
  const { deliveryId } = route.params;
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const issues = [
    'Client absent',
    'Adresse incorrecte',
    'Refus de paiement',
    'Colis endommagé',
    'Autre',
  ];

  const handleSubmit = async () => {
    if (!reason || !description) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await deliveriesApi.reportIssue(deliveryId, { reason, description });
      Alert.alert('Succès', 'Problème signalé', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de signaler le problème');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signaler un problème</Text>

      <Text style={styles.label}>Type de problème</Text>
      {issues.map((issue) => (
        <TouchableOpacity
          key={issue}
          style={[styles.option, reason === issue && styles.optionSelected]}
          onPress={() => setReason(issue)}
        >
          <Text style={[styles.optionText, reason === issue && styles.optionTextSelected]}>
            {issue}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Décrivez le problème en détail..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Envoi...' : 'Envoyer le signalement'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  option: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionSelected: {
    borderColor: '#e74c3c',
    backgroundColor: '#ffe5e5',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  button: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});