import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, TextInput,Switch,Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { DataStore } from 'aws-amplify';
import { Product } from '../../models';
import CustomButton from '../../Components/AuthenticationComponents/CustomButton';

function ProductDetailsScreen(props) {
  const route = useRoute();
  const id = route.params?.id;

  const [product, setProduct] = useState(null);
  const [productPrice, setProductPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const getProduct = async () => {
      const result = await DataStore.query(Product, id);
      setProduct(result);
      setProductPrice(result?.price.toString() || '');
      setIsAvailable(result.isAvailable);
    };

    getProduct();

    const subscription = DataStore.observe(Product, id).subscribe(() => {
      getProduct();
    });

    return () => subscription.unsubscribe();
  }, [id]);

  const onSaveChanges = async () => {
    try {
      await DataStore.save(
        Product.copyOf(product, (updated) => {
          updated.price = parseInt(productPrice);
          updated.isAvailable = isAvailable;
        })
      );
      Alert.alert('Product details saved successfully!');
    } catch (error) {
      Alert.alert('Failed to save product details. Please try again later.');
    }
  };

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page}>
    <KeyboardAvoidingView >
      <Text style={styles.title}>{product.name}</Text>
      <Image style={styles.image} source={{ uri: product.image }} />
      <Text style={styles.description}>{product.description}</Text>
      <View style={{ marginBottom: 10 }}>
        <Text style={{fontSize:18,fontWeight:"bold"}}>Price:</Text>
        {productPrice !== null ? (
          <TextInput
            value={productPrice}
            onChangeText={setProductPrice}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 8 }}
          />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10,justifyContent:"center" }}>
        <Text style={{fontSize:18,fontWeight:"bold"}}>Available:</Text>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
        />
      </View>
      <CustomButton text="SAVE" onPress={onSaveChanges}/>
    </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    margin: 16,
    marginVertical: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  description: {
    marginVertical: 15,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26,
  },
  image: {
    marginTop: 10,
    width: '100%',
    height: 189,
    borderRadius: 18,
  },
});

export default ProductDetailsScreen;
