import React,{useState,useEffect} from 'react';
import { ActivityIndicator,View,StyleSheet,Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../Screens/HomeScreen/HomeScreen";
import OrderListScreen from "../Screens/OrderListScreen/OrderListScreen";
import OrderDetailsScreen from "../Screens/OrderDetailsScreen/OrderDetailsSreen";
import HeaderComponent from '../Components/HeaderComponent/HeaderComponent';
import { Auth,Hub } from 'aws-amplify';
import SignInScreen from '../Screens/AuthenticationScreens/SignInScreen';
import SignUpScreen from '../Screens/AuthenticationScreens/SignUpScreen';
import ConfirmEmailScreen from '../Screens/AuthenticationScreens/ConfirmEmailScreen';
import ForgetPasswordScreen from '../Screens/AuthenticationScreens/ForgetPasswordScreen';
import NewPasswordScreen from '../Screens/AuthenticationScreens/NewPasswordScreen';
import { useOrderContext } from '../contexts/OrderContext';
import CompletedOrdersScreen from '../Screens/CompletedOrdersScreen/CompletedOrdersScreen';
import ProductDetailsScreen from '../Screens/ProductDetailsScreen/ProductDetailsScreen';

const AuthStack=createNativeStackNavigator();

const AuthStackNavigator=()=>{
    const [user,setUser]=useState(undefined);
    const checkUser=async()=>{
        try{
            const authUser = await Auth.currentAuthenticatedUser({bypassCache:true});
            setUser(authUser);
        }catch(e){
            setUser(null);
        }
    };
    useEffect(()=>{
        checkUser();
    },[]);
    
    useEffect(()=>{
        const listener = data=>{
            if(data.payload.event==='signIn' || data.payload.event==='signOut'){
                checkUser();
            }
        }
        Hub.listen('auth',listener);
        return () => Hub.remove('auth', listener);
    },[]);
    
    if (user===undefined) {
        return(
            <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <ActivityIndicator size={"large"}/>
        </View>
    )
}

return(
    <AuthStack.Navigator screenOptions={{headerShown:false}}>
            {user?(<AuthStack.Screen name ='HomeScreen' component={RootNavigator}/>
            ):(
                <>
                <AuthStack.Screen name ='SignIn' component={SignInScreen} />
                <AuthStack.Screen name ='SignUp' component={SignUpScreen}/>
                <AuthStack.Screen name ='confirmEmail' component={ConfirmEmailScreen}/>
                <AuthStack.Screen name ='ForgetPassword' component={ForgetPasswordScreen}/>
                <AuthStack.Screen name ='NewPassword' component={NewPasswordScreen}/>
                </>
            )
            }

        </AuthStack.Navigator>
    );
};

const Stack = createNativeStackNavigator();
const RootNavigator = () => {
    return(
    <Stack.Navigator screenOptions={{header:()=><HeaderComponent/>}}>
            <Stack.Screen name="SrijaChicken"  
              component={HomeTabs}/>
              <Stack.Screen name ="OrderDetail" component={OrderDetailsScreen}/>
              <Stack.Screen name="product" component={ProductDetailsScreen}/>
    </Stack.Navigator>
    );
};

const Tab = createBottomTabNavigator();
const HomeTabs = () => {
    const {orders}=useOrderContext();
  return (
    <Tab.Navigator
  screenOptions={({ route }) => ({
    headerShown:false,
    tabBarActiveTintColor: 'black',
    tabBarInactiveTintColor: 'grey',
    tabBarStyle: { display: 'flex' },
    tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        let cartCount = orders.length;
        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home';
        } else if (route.name === 'Orders') {
          iconName = focused ? 'clipboard-list' : 'clipboard-list';
        } else if (route.name === 'Completed Orders') {
          iconName = focused ? 'clipboard-check' : 'clipboard-check';
        }       
        return (
            <View style={styles.iconContainer}>
            <FontAwesome5 name={iconName} size={24} color={color} />
            {route.name === 'Orders' && cartCount > 0 && (
              <View style={styles.cartCountContainer}>
                <Text style={styles.cartCount}>{cartCount}</Text>
              </View>
            )}
          </View>
        );
      },      
  })}
>
      <Tab.Screen name="Home"  component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrderListScreen} />
      <Tab.Screen name="Completed Orders" component={CompletedOrdersScreen} />
    </Tab.Navigator>
  );
};
const styles = StyleSheet.create({
    iconContainer: {
      justifyContent: 'center',
      alignItems: 'center',}
      ,
      cartCountContainer: {
        position: 'absolute',
        top: -8,
        right: -8,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
      },
      cartCount: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
      }
    ,});


// const Order = createNativeStackNavigator();

// const Navigation = ()=>{
//     return(
//     <Order.Navigator>
//         <OrderStack.Screen name='OrderList' component={OrderListScreen}/>
//         <OrderStack.Screen name="OrderDetail" component={OrderDetailsScreen}/>
//     </Order.Navigator>
//     );
// };

export default AuthStackNavigator;