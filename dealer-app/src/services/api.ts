import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, getDocs, runTransaction, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export type WorkStep = {
  id: string;
  label: string;
  completed: boolean;
  updatedAt: string | null;
};

export type Lead = {
  id: string;
  customerName: string;
  area: string;
  serviceRequired: string;
  timestamp: string;
  status: 'new' | 'accepted';
  phone?: string;
  amount?: string;
  numericAmount?: number;
  workSteps?: WorkStep[];
  notes?: string;
  bookingId?: string;
  dealerDistances?: { [key: string]: string };
  customerLat?: number | null;
  customerLng?: number | null;
  selectedItems?: string[];
  createdAt?: Date;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'lead' | 'reminder' | 'alert';
};

export type DealerStats = {
  totalLeads: number;
  newLeads: number;
  acceptedLeads: number;
  subscriptionExpiry: string;
};

// Fallback Mock Notifications in case Firestore notifications is empty
const mockNotifications: Notification[] = [
  { id: '1', title: 'New Lead Nearby', message: 'Customer needs CCTV & Security Solutions in Hyderabad.', timestamp: '10 mins ago', type: 'lead' },
  { id: '2', title: 'Subscription Expiring', message: 'Your dealer subscription expires in 5 days. Renew now.', timestamp: '1 day ago', type: 'reminder' },
  { id: '3', title: 'Account Update', message: 'Your profile has been successfully verified.', timestamp: '3 days ago', type: 'alert' },
];

export const api = {
  // Fetch stats once (Promise-based fallback)
  getStats: async (dealerId: string): Promise<DealerStats> => {
    try {
      const newLeadsQuery = query(collection(db, "bookings"), where("eligibleDealers", "array-contains", dealerId));
      const newLeadsSnap = await getDocs(newLeadsQuery);
      let newCount = 0;
      newLeadsSnap.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.dealerId === null || data.dealerId === undefined) {
          newCount++;
        }
      });
      
      const acceptedLeadsQuery = query(collection(db, "bookings"), where("dealerId", "==", dealerId));
      const acceptedLeadsSnap = await getDocs(acceptedLeadsQuery);
      
      let subExpiry = 'N/A';
      const dealerDoc = await getDoc(doc(db, "dealers", dealerId));
      if (dealerDoc.exists()) {
        const dealerData = dealerDoc.data();
        if (dealerData.paymentDate) {
          subExpiry = new Date(new Date(dealerData.paymentDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
      }
      
      return {
        totalLeads: newCount + acceptedLeadsSnap.size,
        newLeads: newCount,
        acceptedLeads: acceptedLeadsSnap.size,
        subscriptionExpiry: subExpiry,
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      return { totalLeads: 0, newLeads: 0, acceptedLeads: 0, subscriptionExpiry: 'N/A' };
    }
  },

  // Fetch leads once (Promise-based fallback)
  getLeads: async (status: 'new' | 'accepted', dealerId?: string): Promise<Lead[]> => {
    try {
      if (!dealerId) return [];
      let q;
      if (status === 'new') {
        q = query(collection(db, "bookings"), where("eligibleDealers", "array-contains", dealerId));
      } else {
        q = query(collection(db, "bookings"), where("dealerId", "==", dealerId));
      }
      
      const snap = await getDocs(q);
      const leadsList: Lead[] = [];
      snap.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (status === 'new' && data.dealerId !== null && data.dealerId !== undefined) {
          return;
        }
        leadsList.push({
          id: docSnapshot.id,
          customerName: data.customerName || 'Anonymous',
          area: data.customerAddress || 'N/A',
          serviceRequired: data.serviceName || 'CCTV Service',
          timestamp: data.bookingDate ? `${data.bookingDate} ${data.bookingTime || ''}` : 'N/A',
          status: status,
          phone: data.customerPhone || '',
          amount: data.amount || '₹0',
          numericAmount: data.numericAmount || 0,
          workSteps: data.workSteps || [],
          notes: data.notes || '',
          bookingId: data.bookingId || docSnapshot.id,
          dealerDistances: data.dealerDistances || {},
          customerLat: data.customerLat || null,
          customerLng: data.customerLng || null,
          selectedItems: data.selectedItems || []
        });
      });
      return leadsList;
    } catch (error) {
      console.error("Failed to get leads:", error);
      return [];
    }
  },

  // Real-time listener for leads
  subscribeToLeads: (status: 'new' | 'accepted', dealerId: string, callback: (leads: Lead[]) => void) => {
    if (!dealerId) {
      callback([]);
      return () => {};
    }

    let q;
    if (status === 'new') {
      q = query(collection(db, "bookings"), where("eligibleDealers", "array-contains", dealerId));
    } else {
      q = query(collection(db, "bookings"), where("dealerId", "==", dealerId));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const leadsList: Lead[] = [];
      snap.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (status === 'new' && data.dealerId !== null && data.dealerId !== undefined) {
          return;
        }
        leadsList.push({
          id: docSnapshot.id,
          customerName: data.customerName || 'Anonymous',
          area: data.customerAddress || 'N/A',
          serviceRequired: data.serviceName || 'CCTV Service',
          timestamp: data.bookingDate ? `${data.bookingDate} ${data.bookingTime || ''}` : 'N/A',
          status: status,
          phone: data.customerPhone || '',
          amount: data.amount || '₹0',
          numericAmount: data.numericAmount || 0,
          workSteps: data.workSteps || [],
          notes: data.notes || '',
          bookingId: data.bookingId || docSnapshot.id,
          dealerDistances: data.dealerDistances || {},
          customerLat: data.customerLat || null,
          customerLng: data.customerLng || null,
          selectedItems: data.selectedItems || [],
          createdAt: data.createdAt 
            ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) 
            : (data.bookingDate ? new Date(`${data.bookingDate} ${data.bookingTime || ''}`) : new Date(0)),
        } as any);
      });
      callback(leadsList);
    }, (error) => {
      console.error("Failed to subscribe to leads:", error);
      callback([]);
    });

    return unsubscribe;
  },

  // Accept a lead
  acceptLead: async (leadId: string, dealerId: string): Promise<boolean> => {
    const bookingRef = doc(db, "bookings", leadId);
    try {
      const result = await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists()) {
          throw new Error("Lead does not exist.");
        }
        
        const data = bookingDoc.data();
        if (data.dealerId !== null && data.dealerId !== undefined) {
          throw new Error("Lead already accepted by another dealer.");
        }
        
        transaction.update(bookingRef, {
          dealerId: dealerId,
          status: "Pending"
        });
        
        return { success: true, bookingId: data.bookingId || leadId };
      });

      if (result && result.success) {
        // Sync acceptance to Google Sheets Leads tab
        (async () => {
          try {
            const dealerDocSnapshot = await getDoc(doc(db, "dealers", dealerId));
            const dealerName = dealerDocSnapshot.exists() 
              ? (dealerDocSnapshot.data().businessName || dealerDocSnapshot.data().ownerName || "Dealer") 
              : "Dealer";

            await fetch("https://script.google.com/macros/s/AKfycbylfcX1xeYmnGfMR9j6d-VL-9iUCiTolApZ_YURJfpHb3KquLNULAP-mk8K-r6gfVbO/exec", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "acceptLead",
                leadId: result.bookingId,
                dealerId: dealerId,
                dealerName: dealerName
              }),
            });
            console.log("Successfully synced lead acceptance to Google Sheets");
          } catch (err) {
            console.warn("Failed to sync lead acceptance to Google Sheets:", err);
          }
        })();

        // Run notification deletions asynchronously in background so we don't block the UI success feedback
        (async () => {
          try {
            const q = query(
              collection(db, "notifications"), 
              where("bookingId", "==", leadId)
            );
            const querySnap = await getDocs(q);
            const deletePromises: Promise<void>[] = [];
            querySnap.forEach((docSnap) => {
              const notifData = docSnap.data();
              if (notifData.dealerId !== dealerId) {
                deletePromises.push(deleteDoc(docSnap.ref));
              } else {
                deletePromises.push(updateDoc(docSnap.ref, {
                  title: "Lead Accepted",
                  message: "You successfully accepted this lead."
                }));
              }
            });
            await Promise.all(deletePromises);
          } catch (err) {
            console.warn("Failed to update/delete lead notifications after acceptance:", err);
          }
        })();
      }
      return result ? result.success : false;
    } catch (e) {
      console.error("Failed to accept lead in Firestore transaction:", e);
      throw e;
    }
  },

  // Get notifications once (Promise-based fallback)
  getNotifications: async (): Promise<Notification[]> => {
    return mockNotifications;
  },

  // -------------------------------------------------------------
  // Real-Time Listeners (Subscriptions)
  // -------------------------------------------------------------

  // Subscribe to leads in real-time
  subscribeLeads: (status: 'new' | 'accepted', dealerId: string | null, callback: (leads: Lead[]) => void) => {
    if (status === 'new') {
      if (!dealerId) {
        callback([]);
        return () => {};
      }
      const q = query(collection(db, "bookings"), where("eligibleDealers", "array-contains", dealerId));
      return onSnapshot(q, (snapshot) => {
        const leadsList: Lead[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          if (data.dealerId === null || data.dealerId === undefined) {
            leadsList.push({
              id: docSnapshot.id,
              customerName: data.customerName || 'Anonymous',
              area: data.customerAddress || 'N/A',
              serviceRequired: data.serviceName || 'CCTV Service',
              timestamp: data.bookingDate ? `${data.bookingDate} ${data.bookingTime || ''}` : 'N/A',
              status: 'new',
              phone: data.customerPhone || '',
              amount: data.amount || '₹0',
              numericAmount: data.numericAmount || 0,
              workSteps: data.workSteps || [],
              notes: data.notes || '',
              bookingId: data.bookingId || docSnapshot.id,
              dealerDistances: data.dealerDistances || {},
              customerLat: data.customerLat || null,
              customerLng: data.customerLng || null,
              selectedItems: data.selectedItems || []
            });
          }
        });
        callback(leadsList);
      }, (error) => {
        console.error("Error subscribing to new leads:", error);
      });
    } else {
      const q = query(collection(db, "bookings"), where("dealerId", "==", dealerId));
      return onSnapshot(q, (snapshot) => {
        const leadsList: Lead[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          leadsList.push({
            id: docSnapshot.id,
            customerName: data.customerName || 'Anonymous',
            area: data.customerAddress || 'N/A',
            serviceRequired: data.serviceName || 'CCTV Service',
            timestamp: data.bookingDate ? `${data.bookingDate} ${data.bookingTime || ''}` : 'N/A',
            status: 'accepted',
            phone: data.customerPhone || '',
            amount: data.amount || '₹0',
            numericAmount: data.numericAmount || 0,
            workSteps: data.workSteps || [],
            notes: data.notes || '',
            bookingId: data.bookingId || docSnapshot.id,
            dealerDistances: data.dealerDistances || {},
            customerLat: data.customerLat || null,
            customerLng: data.customerLng || null,
            selectedItems: data.selectedItems || []
          });
        });
        callback(leadsList);
      }, (error) => {
        console.error("Error subscribing to accepted leads:", error);
      });
    }
  },

  // Subscribe to dashboard statistics in real-time
  subscribeStats: (dealerId: string, callback: (stats: DealerStats) => void) => {
    const newLeadsQuery = query(collection(db, "bookings"), where("eligibleDealers", "array-contains", dealerId));
    const acceptedLeadsQuery = query(collection(db, "bookings"), where("dealerId", "==", dealerId));
    
    let newCount = 0;
    let acceptedCount = 0;
    let subExpiry = 'N/A';
    
    // Fetch dealer sub info once
    getDoc(doc(db, "dealers", dealerId)).then((dealerDoc) => {
      if (dealerDoc.exists()) {
        const dealerData = dealerDoc.data();
        if (dealerData.paymentDate) {
          subExpiry = new Date(new Date(dealerData.paymentDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
      }
    }).catch(err => console.warn("Failed to get dealer subscription date", err));

    const triggerCallback = () => {
      callback({
        totalLeads: newCount + acceptedCount,
        newLeads: newCount,
        acceptedLeads: acceptedCount,
        subscriptionExpiry: subExpiry,
      });
    };

    const unsubscribeNew = onSnapshot(newLeadsQuery, (snap) => {
      let count = 0;
      snap.forEach(docSnapshot => {
        const data = docSnapshot.data();
        if (data.dealerId === null || data.dealerId === undefined) {
          count++;
        }
      });
      newCount = count;
      triggerCallback();
    });

    const unsubscribeAccepted = onSnapshot(acceptedLeadsQuery, (snap) => {
      acceptedCount = snap.size;
      triggerCallback();
    });

    return () => {
      unsubscribeNew();
      unsubscribeAccepted();
    };
  },

  // Subscribe to notifications in real-time
  subscribeNotifications: (dealerId: string, callback: (notifications: Notification[]) => void) => {
    // Attempt to query real notifications for this dealer or public notices
    const q = query(collection(db, "notifications"), where("dealerId", "in", [dealerId, "all", null]));
    
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(mockNotifications);
        return;
      }
      const notificationsList: Notification[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        notificationsList.push({
          id: docSnapshot.id,
          title: data.title || 'Notification',
          message: data.message || '',
          timestamp: data.timestamp || 'Just now',
          type: data.type || 'alert'
        });
      });
      callback(notificationsList);
    }, (error) => {
      // Graceful fallback to mock notifications if the notifications collection isn't setup
      console.warn("Notifications collection fallback triggered:", error.message);
      callback(mockNotifications);
    });
  },

  // Update lead progress steps in real-time
  updateLeadProgress: async (leadId: string, workSteps: WorkStep[], status?: string): Promise<boolean> => {
    const bookingRef = doc(db, "bookings", leadId);
    try {
      const updateData: { workSteps: WorkStep[]; status?: string } = { workSteps };
      if (status) {
        updateData.status = status;
      }
      await updateDoc(bookingRef, updateData);

      // Sync status to Google Sheets if status is updated
      if (status) {
        try {
          const bookingSnap = await getDoc(bookingRef);
          if (bookingSnap.exists()) {
            const bookingData = bookingSnap.data();
            const generatedBookingId = bookingData.bookingId || leadId;
            
            await fetch("https://script.google.com/macros/s/AKfycbylfcX1xeYmnGfMR9j6d-VL-9iUCiTolApZ_YURJfpHb3KquLNULAP-mk8K-r6gfVbO/exec", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "updateBooking",
                bookingId: generatedBookingId,
                status: status
              }),
            });
            console.log("Successfully synced progress status update to Google Sheets");
          }
        } catch (err) {
          console.warn("Failed to sync progress status update to Google Sheets:", err);
        }
      }

      return true;
    } catch (error) {
      console.error("Failed to update lead progress:", error);
      return false;
    }
  },

  // Log security alert for mock location or VPN usage
  logSecurityAlert: async (dealerId: string, dealerName: string, type: string, details: any, bookingId?: string) => {
    try {
      await addDoc(collection(db, "security_alerts"), {
        dealerId,
        dealerName,
        type,
        details,
        bookingId: bookingId || null,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Failed to log security alert:", error);
      return false;
    }
  }
};
