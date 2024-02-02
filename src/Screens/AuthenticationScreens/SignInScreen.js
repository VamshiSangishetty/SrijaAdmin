import React ,{useState,useRef} from 'react';
import { View,Text, Image,StyleSheet,useWindowDimensions, Alert} from 'react-native';
import Logo from '../../../assets/images/srijalogobg.png';
import CustomButton from '../../Components/AuthenticationComponents/CustomButton';
import CustomInput from '../../Components/AuthenticationComponents/CustomInput';
import { useNavigation } from '@react-navigation/native';
import {useForm,Controller} from 'react-hook-form';
import {Auth} from 'aws-amplify';

const EMAIL_REGEX=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

function SignInScreen(props) {
const {height}=useWindowDimensions();

const navigation = useNavigation();
const [loading,setLoading]=useState(false);
const {control,handleSubmit,formState:{errors}}=useForm();

const onSigInPressed = async (data) => {
  if (loading) {
    return;
  }
  setLoading(true);
  try {
     await Auth.signIn(data.email, data.password);

    // Get the current authenticated user
    const user = await Auth.currentAuthenticatedUser();
    
    // Check if the user is in the "Admins" group
    const groups = user.signInUserSession.accessToken.payload['cognito:groups'];
    const isAdmin = groups && groups.includes('Admins');

    if (isAdmin) {
      // User is an admin, proceed to the app
      console.log('Admin signed in:', user);
    } else {
      await Auth.signOut();
      // User is not an admin, show an error message or handle the restriction
      Alert.alert('Error', 'Only admins can sign in to this app.');
      // Optionally, you can sign the user out to prevent unauthorized access
    }
  } catch (e) {
    Alert.alert('Oops', e.message);
  }
  setLoading(false);
};

const onForgetPassPressed=()=>{
navigation.navigate('ForgetPassword')
}
const onSignUpPressed=()=>{
    navigation.navigate('SignUp');
}

    return (
       <View style={styles.root}>
        <Image source={Logo} style={[styles.logo,{height:height*0.3}]} />
        <CustomInput 
                     name="email"
                     placeholder="Enter Email" 
                     control={control}
                     rules={{required:'Email is required',
               pattern:{value:EMAIL_REGEX,message:"Email is invalid"}}}
                     />
        <CustomInput 
        name='password'
        placeholder="Enter Password" 
         secureTextEntry
         rules={{required:"Password is required", minLength:{
            value:8,
            message:'Password should be minimum of 8 characters long'
        }}}
         control={control}/>
        <CustomButton onPress={handleSubmit(onSigInPressed)} 
        text={loading?'loading...':'Sign In'}/>
        <CustomButton onPress={onForgetPassPressed} text=' Forgot Password?' type="TERTIARY"/>
        <CustomButton onPress={onSignUpPressed} text=" Don't have an accout? Create One" type="TERTIARY"/>
       </View>
       
    );
}

export default SignInScreen;

const styles = StyleSheet.create({
    root:{
        flex:1,
        padding:20,
alignItems:"center",
backgroundColor:"#F9FBFC"
    },
    logo:{
        width:"100%",
        maxHeight:400,
        maxWidth:400,
    }
})