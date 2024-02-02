import React from 'react';
import { ScrollView,View,StyleSheet } from 'react-native';
import OrderItem from '../../Components/OrderItem/OrderItem';
import { useOrderContext } from '../../contexts/OrderContext';

function CompletedOrdersScreen(props) {

const {completedOrders}=useOrderContext();
const sortedOrders = [...completedOrders].reverse();

    return (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.page}>
        {sortedOrders.map((order) => (
          <OrderItem key={order.id} order={order} />
        ))}
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

export default CompletedOrdersScreen;