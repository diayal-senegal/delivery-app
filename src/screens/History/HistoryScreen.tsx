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
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return theme.colors.success;
      case 'FAILED': return theme.colors.danger;
      case 'REJECTED': return theme.colors.textLight;
      case 'CANCELED': return theme.colors.textLight;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DELIVERED: '✓ Livrée',
      FAILED: '✗ Échouée',
      REJECTED: '✗ Refusée',
      CANCELED: '✗ Annulée',
    };
    return labels[status] || status;
  };

  const renderDelivery = ({ item }: { item: Delivery }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DeliveryDetail', { deliveryId: item.id })}
    >
      <View style={styles.header}>
        <Text style={styles.id}>#{item.id.slice(0, 8)}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {getStatusLabel(item.status)}
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>📍 Itinéraire</Text>
        <Text style={styles.address}>📦 {item.pickupAddressText}</Text>
        <Text style={styles.address}>🏠 {item.dropoffAddressText}</Text>
      </View>

      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>⏱️ Chronologie</Text>
        {item.assignedAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Assignée:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.assignedAt)}</Text>
          </View>
        )}
        {item.acceptedAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Acceptée:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.acceptedAt)}</Text>
          </View>
        )}
        {item.rejectedAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Refusée:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.rejectedAt)}</Text>
          </View>
        )}
        {item.pickedUpAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Récupérée:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.pickedUpAt)}</Text>
          </View>
        )}
        {item.enRouteAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>En route:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.enRouteAt)}</Text>
          </View>
        )}
        {item.arrivedAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Arrivée:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.arrivedAt)}</Text>
          </View>
        )}
        {item.deliveredAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Livrée:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.deliveredAt)}</Text>
          </View>
        )}
        {item.failedAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Échouée:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.failedAt)}</Text>
          </View>
        )}
        {item.canceledAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Annulée:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.canceledAt)}</Text>
          </View>
        )}
      </View>
      
      {item.cashOnDeliveryAmount > 0 && (
        <View style={styles.footer}>
          <Text style={styles.fee}>💰 {item.cashOnDeliveryAmount} {item.feeCurrency}</Text>
        </View>
      )}
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
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  id: {
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    color: theme.colors.text,
  },
  status: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  address: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  timeline: {
    backgroundColor: theme.colors.backgroundLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  timelineTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  timelineLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  timelineValue: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontWeight: '500',
  },
  footer: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  fee: {
    fontSize: theme.fontSize.md,
    fontWeight: '800',
    color: theme.colors.success,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
});