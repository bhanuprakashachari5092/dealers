import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { api, Notification } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { Bell, AlertTriangle, CheckCircle, BellRing, Trash2 } from 'lucide-react-native';
import Animated, { FadeInUp, Layout, SlideOutRight } from 'react-native-reanimated';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const unsubscribe = api.subscribeNotifications(user.id, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter(n => !clearedIds.has(n.id));
  }, [notifications, clearedIds]);

  const handleClearAll = () => {
    const allIds = new Set(clearedIds);
    notifications.forEach(n => allIds.add(n.id));
    setClearedIds(allIds);
  };

  const handleClearSingle = (id: string) => {
    setClearedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'lead':
        return <Bell size={22} color={Colors.primary} />;
      case 'reminder':
        return <AlertTriangle size={22} color={Colors.warning} />;
      case 'alert':
        return <CheckCircle size={22} color={Colors.success} />;
    }
  };

  const getIconBackground = (type: Notification['type']) => {
    switch (type) {
      case 'lead':
        return 'rgba(59, 130, 246, 0.1)';
      case 'reminder':
        return 'rgba(245, 158, 11, 0.1)';
      case 'alert':
        return 'rgba(16, 185, 129, 0.1)';
    }
  };

  const renderItem = ({ item, index }: { item: Notification; index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).duration(500)}
      layout={Layout.springify()}
      exiting={SlideOutRight}
    >
      <Card style={styles.card} variant="elevated">
        <View style={styles.contentRow}>
          <View style={[styles.iconContainer, { backgroundColor: getIconBackground(item.type) }]}>
            {getIcon(item.type)}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
          <TouchableOpacity onPress={() => handleClearSingle(item.id)} style={styles.clearIcon}>
            <Trash2 size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <AnimatedBackground>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <BellRing size={28} color={Colors.primary} style={{ marginLeft: 12 }} />
        </View>
        {visibleNotifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleNotifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <Bell size={40} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptyText}>When you receive alerts or new leads, they'll appear here.</Text>
            </View>
          }
        />
      )}
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  clearAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  clearAllText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  card: {
    marginBottom: 16,
    padding: 20,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  clearIcon: {
    padding: 8,
    marginLeft: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
    fontWeight: '500',
  },
  timestamp: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(226, 232, 240, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});
