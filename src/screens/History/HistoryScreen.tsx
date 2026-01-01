import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { deliveriesApi } from '../../services/api/deliveries.api';
import { Delivery } from '../../types';
import { theme } from '../../theme/theme';

export default function HistoryScreen({ navigation }: any) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await deliveriesApi.getMyDeliveries('done');
      setDeliveries(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDelivery = ({ item }: { item: Delivery }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DeliveryDetail', { deliveryId: item.id })}
    >
      <View style={styles.header}>
        <Text style={styles.id}>#{item.id.slice(0, 8)}</Text>
        <Text style={styles.date}>{formatDate(item.deliveredAt || item.createdAt)}</Text>
      </View>
      
      <Text style={styles.address}>📍 {item.pickupAddressText}</Text>
      <Text style={styles.address}>📦 {item.dropoffAddressText}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.fee}>{item.feeAmount} {item.feeCurrency}</Text>
        <Text style={[styles.status, item.status === 'DELIVERED' ? styles.delivered : styles.failed]}>
          {item.status === 'DELIVERED' ? '✓ Livrée' : '✗ ' + item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHistory} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune livraison terminée</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  id: {
    fontSize: theme.fontSize.md,
    fontWeight: '800',
    color: theme.colors.text,
  },
  date: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  address: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  fee: {
    fontSize: theme.fontSize.md,
    fontWeight: '800',
    color: theme.colors.success,
  },
  status: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  delivered: {
    color: theme.colors.success,
  },
  failed: {
    color: theme.colors.danger,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
});