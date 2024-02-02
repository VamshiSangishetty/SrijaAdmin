import React from 'react';
import { View,Image,Text,StyleSheet, TouchableOpacity } from 'react-native';
import {useNavigation} from '@react-navigation/native';

function StoreItem({store}) {
const navigation=useNavigation();

const onPress=()=>{
navigation.navigate("product",{id:store.id});
};

    return (
    <TouchableOpacity onPress={onPress} style={styles.productsContainer}>
    <Image style={styles.image} source={{uri:store.image}}/>
    <View style={styles.detailsContainer}>
    <Text style={styles.title}>{store.name}</Text>
    </View>
    </TouchableOpacity>
    );
}

export default StoreItem;

const styles = StyleSheet.create({
    productsContainer:{
        backgroundColor:"white",
   width:"100%",
   marginVertical:6,
   borderRadius:27,
   overflow:"hidden",
    }, 
    detailsContainer:{
     padding:12,
    } ,  
    image:{
     width:"100%",
     aspectRatio:6/3,
     marginBottom:4,
    },
    title:{
     fontSize:16,
     fontWeight:"600",
     marginVertical:6,
     alignSelf:"center"
    },
    subTitle:{
    color:"grey",
    marginBottom:5,
    },
})