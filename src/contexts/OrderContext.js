import React, { createContext, useContext, useState, useEffect } from 'react';
import { DataStore } from 'aws-amplify';
import { Order } from '../models'; // Assuming you have imported the necessary models
import '@azure/core-asynciterator-polyfill';

const OrderContext = createContext({});

// Inside the OrderContextProvider component
function OrderContextProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [completedOrders,setCompletedOrders]=useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Fetch orders
        const ordersResult = await DataStore.query(Order, (o) => o.status.ne("DELIVERED"));
        setOrders(ordersResult);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchOrders();

    const subscription = DataStore.observe(Order).subscribe(() => {
      fetchOrders();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        // Fetch orders
        const ordersResult = await DataStore.query(Order, (o) => o.status.eq("DELIVERED"));
        setCompletedOrders(ordersResult);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchCompletedOrders();

    const subscription = DataStore.observe(Order).subscribe(() => {
      fetchCompletedOrders();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <OrderContext.Provider value={{ orders,completedOrders }}>
      {children}
    </OrderContext.Provider>
  );
}

export default OrderContextProvider;
export const useOrderContext = () => useContext(OrderContext);
