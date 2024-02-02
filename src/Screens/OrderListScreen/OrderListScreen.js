import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView,Text ,Alert} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import OrderItem from '../../Components/OrderItem/OrderItem';
import { useOrderContext } from '../../contexts/OrderContext';
import { Auth,Hub,DataStore } from 'aws-amplify';
import { DeliveryPartner } from '../../models';

// Function to calculate the distance between two lat/lng points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (angle) => (Math.PI / 180) * angle;
  const R = 6371; // Radius of the Earth in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function OrderListScreen(props) {
  const { orders } = useOrderContext();
  const [deliveryPartnerLocation, setDeliveryPartnerLocation] = useState(null);
  const isFocused = useIsFocused();

  const [dbUser, setDbUser] = useState(null);
  const [sub, setSub] = useState(null);

  const fetchUserData = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser({ bypassCache: true });
      const sub =
        user?.attributes?.sub ||
        user?.accessToken?.payload?.sub ||
        user?.username;
      setSub(sub);

      fetchDeliveryPartnerData(sub);
      observeDeliveryPartnerChanges(sub);
    } catch (error) {
      // Handle error fetching user data
    }
  };

  const fetchDeliveryPartnerData = async (sub) => {
    try {
      const deliverypartners = await DataStore.query(DeliveryPartner, (user) =>
        user.sub.eq(sub)
      );
      if (deliverypartners.length > 0) {
        setDbUser(deliverypartners[0]);
      } else {
        setDbUser(null);
      }
    } catch (error) {
      // Handle error fetching customer data
    }
  };

  const observeDeliveryPartnerChanges = async (sub) => {
    let subscription;
    try {
      subscription = DataStore.observe(DeliveryPartner, (model) =>
        model.sub.eq(sub)
      ).subscribe({
        next: (data) => {
          if (data.opType === 'INSERT' || data.opType === 'UPDATE') {
            const updatedCustomer = data.element;
            setDbUser(updatedCustomer);
          }
        },
        error: (error) => {
          // Handle error observing customer changes
        },
      });
    } catch (error) {
      // Handle error subscribing to customer changes
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  };

  useEffect(() => {
    const authListener = (data) => {
      switch (data.payload.event) {
        case 'signIn':
          // Handle sign-in event
          fetchUserData();
          break;
        case 'signOut':
          // Handle sign-out event
          setDbUser(null);
          break;
        default:
          break;
      }
    };

    Hub.listen('auth', authListener);

    return () => {
      Hub.remove('auth', authListener);
    };
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    let locationSubscription;

    const fetchDeliveryPartnerLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
Alert.alert("allow location");
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        (position) => {
          const { latitude, longitude } = position.coords;
          setDeliveryPartnerLocation({ lat: latitude, lng: longitude });
        }
      );
    };

    if (isFocused) {
      fetchDeliveryPartnerLocation();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isFocused]);

  // Calculate the distance between the delivery partner and each customer, and sort the orders based on distance
  const sortedOrders = [...orders].sort((orderA, orderB) => {
    if (!deliveryPartnerLocation) return 0;

    const distanceA = calculateDistance(
      orderA.latitude,
      orderA.longitude,
      deliveryPartnerLocation.lat,
      deliveryPartnerLocation.lng
    );

    const distanceB = calculateDistance(
      orderB.latitude,
      orderB.longitude,
      deliveryPartnerLocation.lat,
      deliveryPartnerLocation.lng
    );

    return distanceA - distanceB;
  });

  function groupOrdersByProximity(sortedOrders, maxDistanceInKm) {
    const groupedOrders = [];
  
    for (let i = 0; i < sortedOrders.length; i++) {
      const orderA = sortedOrders[i];
      const group = [orderA];
  
      for (let j = i + 1; j < sortedOrders.length; j++) {
        const orderB = sortedOrders[j];
        const distance = calculateDistance(
          orderA.latitude,
          orderA.longitude,
          orderB.latitude,
          orderB.longitude
        );
  
        if (distance <= maxDistanceInKm) {
          group.push(orderB);
          // Remove orderB from sortedOrders to avoid duplicate grouping
          sortedOrders.splice(j, 1);
          j--;
        }
      }
  
      groupedOrders.push(group);
    }
  
    return groupedOrders;
  }
 const groupedOrders = groupOrdersByProximity(sortedOrders, 1);
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.page}>
      {orders.length>0 ? (
        groupedOrders.map((group, index) => (
          <View key={index}>
            <Text style={styles.message}>Group {index + 1}</Text>
            {group.map((order) => (
              <OrderItem key={order.id} order={order} />
            ))}
          </View>
        ))
      ):(
     <Text style={styles.message}>No Orders Available</Text>
      )}
    </ScrollView>
  );
  
      };

const styles = StyleSheet.create({
  page: {
    marginTop: 0,
  },
  message:{
    textAlign:"center",
    fontSize:24,
    color:"red"
  }
});

export default OrderListScreen;
