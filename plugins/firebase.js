import * as firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"
import {GeoFire} from 'geofire'

const config = {
    apiKey: "AIzaSyC00kGtwK10-kd_npqq06kgoXQUKx7IdkY",
    authDomain: "uber-clone-kunimasa.firebaseapp.com",
    databaseURL: "https://uber-clone-kunimasa.firebaseio.com",
    projectId: "uber-clone-kunimasa",
    storageBucket: "",
    messagingSenderId: "425167262729",
    appId: "1:425167262729:web:724deda8ab3725cc"
}

firebase.initializeApp(config)

const firestore = firebase.firestore()
const GeoPoint = firebase.firestore.GeoPoint
const auth = firebase.auth()

export default function(app,inject){
  inject('firestore',firestore) // this.$firestore
  inject('GeoPoint',GeoPoint) // this.$GeoPoint
  inject('auth',auth) // this.$auth

  const {redirect} = app;

  auth.onAuthStateChanged(user=>{
    if(!user){
      console.warn('not logined')
      redirect("/login")
    }
    console.log({user})
  })

}
