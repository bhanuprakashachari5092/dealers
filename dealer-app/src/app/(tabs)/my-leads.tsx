import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Linking, 
  Alert, 
  Pressable, 
  TouchableOpacity 
} from 'react-native';
import { api, Lead, WorkStep } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { 
  MapPin, 
  Wrench, 
  Clock, 
  Phone, 
  MessageSquare, 
  BriefcaseBusiness, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Circle, 
  ShieldAlert
} from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Location from 'expo-location';

const DEFAULT_STEPS = [
  { id: 'step_1', label: 'Arrived at Location', completed: false, updatedAt: null },
  { id: 'step_2', label: 'Inspection & Diagnostics Complete', completed: false, updatedAt: null },
  { id: 'step_3', label: 'Service / Installation in Progress', completed: false, updatedAt: null },
  { id: 'step_4', label: 'Final Testing & Verification', completed: false, updatedAt: null },
  { id: 'step_5', label: 'Job Completed & Handed Over', completed: false, updatedAt: null }
];

export default function MyLeadsScreen() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStep, setUpdatingStep] = useState<{ leadId: string; stepId: string } | null>(null);
  const [expandedLeads, setExpandedLeads] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const unsubscribe = api.subscribeToLeads('accepted', user.id, (data) => {
      const sortedLeads = data.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      setLeads(sortedLeads);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission was not granted on mount');
        }
      } catch (err) {
        console.error('Error requesting location permission on mount:', err);
      }
    })();
  }, []);

  const toggleExpand = (leadId: string) => {
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatStepTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return '';
    }
  };

  const handleOpenMap = (address: string, lat?: number | null, lng?: number | null) => {
    const destination = lat && lng ? `${lat},${lng}` : encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open maps link:", err);
      Alert.alert("Error", "Could not open map application.");
    });
  };



  const handleToggleStep = async (lead: Lead, stepId: string) => {
    if (updatingStep) return;
    setUpdatingStep({ leadId: lead.id, stepId });

    try {
      // 1. Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to verify you are at the customer\'s location before updating work progress.'
        );
        setUpdatingStep(null);
        return;
      }

      // 2. Fetch current GPS position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      // 2.1 Check for spoofed / mock location (GPS spoofing)
      if ((location as any).mocked) {
        Alert.alert(
          'Security Violation',
          'Mock location / GPS spoofing detected. Work updates are disabled, and this incident has been reported to the admin.'
        );
        if (user?.id) {
          await api.logSecurityAlert(
            user.id,
            user.name || 'Unknown Dealer',
            'GPS Spoofing / Mock Location Detected',
            { mocked: true, coords: location.coords },
            lead.id
          );
        }
        setUpdatingStep(null);
        return;
      }



      const dealerLat = location.coords.latitude;
      const dealerLng = location.coords.longitude;

      // 3. Resolve customer coordinates
      let customerLat = lead.customerLat;
      let customerLng = lead.customerLng;

      if (customerLat === undefined || customerLat === null || customerLng === undefined || customerLng === null) {
        // Attempt to geocode address on-the-fly
        try {
          const geocodeRes = await Location.geocodeAsync(lead.area);
          if (geocodeRes && geocodeRes.length > 0) {
            customerLat = geocodeRes[0].latitude;
            customerLng = geocodeRes[0].longitude;
          }
        } catch (err) {
          console.error("Geocoding failed for customer address:", err);
        }
      }

      if (customerLat === undefined || customerLat === null || customerLng === undefined || customerLng === null) {
        Alert.alert(
          'Verification Failed',
          'Unable to resolve the customer\'s address coordinates. Please verify your internet connection or contact customer care.'
        );
        setUpdatingStep(null);
        return;
      }

      // 4. Calculate distance
      const distance = getHaversineDistance(dealerLat, dealerLng, customerLat, customerLng);
      const distanceMeters = distance * 1000;

      // Geofence check: 100 meters (0.1 km)
      if (distanceMeters > 100) {
        const distanceStr = distance < 1 
          ? `${Math.round(distanceMeters)}m` 
          : `${distance.toFixed(2)} km`;
          
        Alert.alert(
          'Access Blocked',
          `Work updates are restricted to the customer's location. You are currently ${distanceStr} away.\n\nPlease proceed to the customer site (within 100 meters) to update work progress.`
        );
        setUpdatingStep(null);
        return;
      }

      // 5. Update steps in Firestore
      const currentSteps: WorkStep[] = lead.workSteps && lead.workSteps.length > 0
        ? JSON.parse(JSON.stringify(lead.workSteps))
        : DEFAULT_STEPS.map(s => ({ ...s }));

      const targetStepIndex = currentSteps.findIndex((s: WorkStep) => s.id === stepId);
      if (targetStepIndex !== -1) {
        const wasCompleted = currentSteps[targetStepIndex].completed;
        currentSteps[targetStepIndex].completed = !wasCompleted;
        currentSteps[targetStepIndex].updatedAt = !wasCompleted ? new Date().toISOString() : null;
      }

      // Check if all steps are completed
      const allCompleted = currentSteps.every((s: WorkStep) => s.completed);
      const newStatus = allCompleted ? 'Completed' : 'Pending';

      const success = await api.updateLeadProgress(lead.id, currentSteps, newStatus);
      if (!success) {
        Alert.alert('Update Failed', 'Could not save work progress to database. Please try again.');
      }
    } catch (e: any) {
      console.error("Failed to process progress update:", e);
      Alert.alert('Error', e.message || 'An unexpected error occurred while fetching your GPS location.');
    } finally {
      setUpdatingStep(null);
    }
  };

  const renderLead = ({ item, index }: { item: Lead; index: number }) => {
    const isExpanded = !!expandedLeads[item.id];
    const steps = item.workSteps && item.workSteps.length > 0
      ? item.workSteps
      : DEFAULT_STEPS;
      
    const allCompleted = steps.every((s: any) => s.completed);
    const statusLabel = allCompleted ? 'Completed' : 'Active';
    const statusColor = allCompleted ? Colors.success : Colors.primary;
    const statusBg = allCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)';

    return (
      <Animated.View entering={FadeInUp.delay(index * 150).duration(500)}>
        <Card style={styles.card} variant="elevated">
          <View style={styles.cardHeader}>
            <View style={styles.customerInfo}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.customerName.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.customerName}>{item.customerName}</Text>
                <View style={[styles.statusBadgeContainer, { backgroundColor: statusBg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <TouchableOpacity 
              style={styles.detailBox} 
              activeOpacity={0.6}
              onPress={() => handleOpenMap(item.area, item.customerLat, item.customerLng)}
            >
              <MapPin size={18} color={Colors.primary} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Location (Tap for Map)</Text>
              <Text style={[styles.detailValue, { color: Colors.primary, textDecorationLine: 'underline' }]} numberOfLines={2}>
                {item.area}
              </Text>
            </TouchableOpacity>
            <View style={styles.detailBox}>
              <Clock size={18} color={Colors.warning} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Accepted At</Text>
              <Text style={styles.detailValue}>{item.timestamp}</Text>
            </View>
            
            <View style={styles.detailBox}>
              <Phone size={18} color={Colors.cyan} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Contact Phone</Text>
              <Text style={styles.detailValue}>{item.phone || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailBox}>
              <Wrench size={18} color={Colors.success} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Service Required</Text>
              <Text style={styles.detailValue}>{item.serviceRequired}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button 
              title="Message" 
              variant="outline" 
              style={styles.actionBtn}
              onPress={() => {
                if (item.phone) {
                  Linking.openURL(`sms:${item.phone}`);
                } else {
                  Alert.alert("Error", "No contact phone available for this customer.");
                }
              }}
            />
            <View style={{ width: 12 }} />
            <Button 
              title="Call Client" 
              style={styles.actionBtn}
              onPress={() => {
                if (item.phone) {
                  Linking.openURL(`tel:${item.phone}`);
                } else {
                  Alert.alert("Error", "No contact phone available for this customer.");
                }
              }}
            />
          </View>

          <Pressable 
            onPress={() => toggleExpand(item.id)} 
            style={styles.expandHeader}
          >
            <View style={styles.expandTitleContainer}>
              <BriefcaseBusiness size={18} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.expandTitle}>Work Progress & Timeline</Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={20} color={Colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.textSecondary} />
            )}
          </Pressable>

          {isExpanded && (
            <View style={{ marginTop: 10 }}>
              {item.selectedItems && item.selectedItems.length > 0 && (
                <View style={styles.orderedItemsContainer}>
                  <Text style={styles.orderedItemsTitle}>Ordered Items & Services</Text>
                  <View style={styles.orderedItemsList}>
                    {item.selectedItems.map((itemStr: string, idx: number) => (
                      <View key={idx} style={styles.orderedItemRow}>
                        <View style={styles.orderedItemBullet} />
                        <Text style={styles.orderedItemText}>{itemStr}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressHeaderText}>Milestones</Text>
                  <View style={styles.geofenceStatus}>
                    <ShieldAlert size={12} color={Colors.success} />
                    <Text style={styles.geofenceStatusText}>Geofence Active</Text>
                  </View>
                </View>

                {steps.map((step: WorkStep, stepIdx: number) => {
                  const isStepUpdating = updatingStep?.leadId === item.id && updatingStep?.stepId === step.id;
                  
                  return (
                    <View key={step.id}>
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        style={styles.progressStepItem}
                        onPress={() => handleToggleStep(item, step.id)}
                        disabled={isStepUpdating}
                      >
                        {isStepUpdating ? (
                          <ActivityIndicator size="small" color={Colors.primary} style={{ width: 20, height: 20 }} />
                        ) : step.completed ? (
                          <CheckCircle size={20} color={Colors.success} />
                        ) : (
                          <Circle size={20} color={Colors.textSecondary} />
                        )}
                        
                        <View style={styles.progressStepTextContainer}>
                          <Text style={[
                            styles.progressStepLabel,
                            step.completed && styles.progressStepLabelCompleted
                          ]}>
                            {step.label}
                          </Text>
                          {step.completed && step.updatedAt && (
                            <Text style={styles.progressStepTime}>
                              Completed {formatStepTime(step.updatedAt)}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {stepIdx < steps.length - 1 && (
                        <View style={[
                          styles.connectorLine,
                          step.completed && steps[stepIdx + 1].completed && styles.connectorLineCompleted
                        ]} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Card>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Leads</Text>
        <BriefcaseBusiness size={28} color={Colors.primary} />
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={item => item.id}
          renderItem={renderLead}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <BriefcaseBusiness size={40} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No Active Leads</Text>
              <Text style={styles.emptyText}>You haven't accepted any leads yet. Check the 'New Leads' tab to find clients.</Text>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
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
    marginBottom: 20,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  detailBox: {
    width: '48%',
    marginBottom: 16,
  },
  detailIcon: {
    marginBottom: 6,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: 10,
  },
  expandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  geofenceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  geofenceStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
    marginLeft: 4,
  },
  progressStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  progressStepTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  progressStepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  progressStepLabelCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  progressStepTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  connectorLine: {
    width: 2,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginLeft: 9,
  },
  connectorLineCompleted: {
    backgroundColor: Colors.success,
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
  orderedItemsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  orderedItemsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderedItemsList: {
    paddingLeft: 4,
  },
  orderedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderedItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  orderedItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
});
