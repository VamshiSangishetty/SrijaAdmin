import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Linking, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ButtonText from '../../Components/ButtonText/ButtonText';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Order, Customer,DeliveryPartner } from '../../models';
import { DataStore } from 'aws-amplify';
import * as Location from 'expo-location'; 

const StatusEnum = {
  CUTTING:"CUTTING",
  ON_THE_WAY:"ON_THE_WAY",
  DELIVERED: 'DELIVERED',
};

function OrderDetailsScreen(props) {
  const navigation = useNavigation();
  const route = useRoute();
  const id = route.params?.id;
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [deliveryPartners,setDeliveryPartners]=useState([]);
  const [selectedDeliveryBoyName, setSelectedDeliveryBoyName] = useState(null);

  useEffect(()=>{
  const fetchDP=async()=>{
    try{
   const dp=await DataStore.query(DeliveryPartner);
   setDeliveryPartners(dp);
    }catch{
     Alert.alert("something went wrong");
    }
  };
  fetchDP();

    const subscription = DataStore.observe(DeliveryPartner).subscribe(() => {
      fetchDP();
    });

    return () => subscription.unsubscribe();
  },[id])

  useEffect(() => {
    const fetchOrderWithCustomer = async () => {
      try {
        const orderResult = await DataStore.query(Order, id);
        setOrder(orderResult);

        const customerId = orderResult.customerID;
        const customerResult = await DataStore.query(Customer, customerId);
        setCustomer(customerResult);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchOrderWithCustomer();

    const subscription = DataStore.observe(Order, id).subscribe(() => {
      fetchOrderWithCustomer();
    });

    return () => subscription.unsubscribe();
  }, [id]);

  useEffect(() => {
    const subscribeToLocationUpdates = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission not granted');
        }

        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          location => {
            setCurrentLocation(location.coords);
          }
        );

        return () => {
          if (locationSubscription) {
            locationSubscription.remove();
          }
        };
      } catch (error) {
        console.error('Error subscribing to location updates:', error);
      }
    };

    subscribeToLocationUpdates();
  }, []);

  const handleCall = () => {
    Linking.openURL(`tel:${customer.phoneNumber}`);
  };

  const handleShowDirections = () => {
    const destinationLatitude = order.latitude;
    const destinationLongitude = order.longitude;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLatitude},${destinationLongitude}`;

    Linking.openURL(url);
  };

  const onAcceptPress=async()=>{
    try {
      await DataStore.save(Order.copyOf(order, updated => {
        updated.status = StatusEnum.CUTTING;
      }));
    } catch (error) {
      Alert.alert('Failed to complete order. Please try again later.');
    }
  };

  const onAssignPress = async () => {
    try {
      const dp = async () => {
        try {
          const deliveryPartner = await DataStore.query(DeliveryPartner, (dp) =>
            dp.name.eq(selectedDeliveryBoyName)
          )
          return deliveryPartner[0]; // Assuming the query returns only one result
        } catch (error) {
          return null;
        }
      };
  
      const selectedDeliveryPartner = await dp();
  
      if (!selectedDeliveryPartner) {
        Alert.alert('Delivery partner not found. Please select a valid delivery partner.');
        return;
      }
  
      await DataStore.save(Order.copyOf(order, (updated) => {
        updated.dpName = selectedDeliveryPartner.name;
        updated.dpPhone = selectedDeliveryPartner.phoneNumber;
      }));
    } catch (error) {
      Alert.alert('Something went wrong. Please try again later.');
    }
  };
  

  const onCompleteOrderPress = async () => {
    // Show a confirmation prompt before completing the order
    Alert.alert(
      'Complete Order',
      'Are you sure you want to complete this order?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await DataStore.save(Order.copyOf(order, (updated) => {
                updated.status = StatusEnum.DELIVERED;
              }));
              navigation.goBack();
            } catch (error) {
              Alert.alert('Failed to complete order. Please try again later.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  

  if (!order || !customer || !currentLocation||!deliveryPartners) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.head}>Order Details:</Text>
      <Text style={styles.head}>Total: ₹ {order.total}</Text>
      <Text style={styles.head}>Order Items:</Text>
      {order.orderItems.map((item) => (
        <Text key={item.id} style={styles.item}>{item.productName} - {item.weight} KG = <Text style={{ fontWeight: "bold" }}>₹ {item.amount}</Text></Text>
      ))}
      <Text style={styles.head}>Delivery Details:</Text>
      <Text style={styles.detail}>Name: {customer.name}</Text>
      <TouchableOpacity onPress={handleCall}>
        <Text style={styles.detail}>
          Phone Number:
          <Text style={styles.phone}> {customer.phoneNumber}</Text> (Click to Call)
        </Text>
      </TouchableOpacity>
      <Text style={styles.detail}>Flat no: {customer.flatNo}</Text>
      <Text style={styles.detail}>Street: {customer.street}</Text>
      <Text style={styles.detail}>Area/Landmark: {customer.landmark}</Text>
      <Text style={styles.detail}>Pincode: {customer.pincode}</Text>
      <Text style={styles.head}>Delivery Partner : </Text>
      <Text style={styles.detail}>Name : {order.dpName}</Text>
      <Text style={styles.detail}>Phone Number : {order.dpPhone} </Text>
      {order.status!="DELIVERED"&&
      <View style={{ marginTop: 20 }}>
        {
          order.status==="NEW"?(
            <ButtonText text="Accept" onPress={onAcceptPress}/>
          ):(
            <View style={{flexDirection:"row",alignItems:"center",justifyContent:"center"}}>
          <Picker
          style={styles.picker}
          selectedValue={selectedDeliveryBoyName}
          onValueChange={(itemValue) => setSelectedDeliveryBoyName(itemValue)}
        >
          <Picker.Item label="Select Delivery Boy" value={null} />
          {deliveryPartners.map((deliveryBoy) => (
            <Picker.Item label={deliveryBoy.name} value={deliveryBoy.name} key={deliveryBoy.id} />
          ))}
        </Picker>             
        <ButtonText text="Assign" onPress={onAssignPress}/>
            </View>
          )
        }
          <ButtonText text="Show Directions" onPress={handleShowDirections} />
          <ButtonText text="Complete Order" onPress={onCompleteOrderPress} />
      </View>
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    padding: 18,
    marginBottom:20
  },
  head: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  item: {
    marginBottom: 8,
    fontSize: 16,
  },
  detail: {
    marginBottom: 8,
    fontSize: 16,
  },
  phone: {
    marginBottom: 8,
    color: 'blue',
    textDecorationLine: 'underline',
  },
  picker: {
    width: 200,
  },
});

export default OrderDetailsScreen;
