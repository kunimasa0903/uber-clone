<template>
  <div>
      <!-- floating buttons -->
      <v-speed-dial
        absolute
        v-model="dial"
        top
        right
        direction="bottom"
        transition="slide-y-reverse-transition"
      >
        <template v-slot:activator>
          <v-btn
            v-model="dial"
            color="secondary"
            dark
            small
            fab
          >
            <v-icon v-if="dial">mdi-close</v-icon>
            <v-icon v-else>mdi-settings</v-icon>
          </v-btn>
        </template>
        <v-btn
          fab
          dark
          small
          @click="searchTaxi(1000)"
        >
          <v-icon>mdi-taxi</v-icon>
        </v-btn>
        <v-btn
          fab
          dark
          small
          @click="createTaxi"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-btn
          fab
          dark
          small
          to="/login"
        >
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </v-speed-dial>

      <!-- floatin taxi button -->
      <v-layout absolute justify-center align-end style="position:absolute; width:100%;height:95%">
        <v-btn absolute fab class="secondary"><v-icon>mdi-taxi</v-icon></v-btn>
      </v-layout>

      <!-- google map -->
      <GmapMap
        :center="{lat:location.lat, lng:location.lng}"
        :zoom="18"
        :options="{
          fullscreenControl:false,
          mapTypeControl:false,
          streetViewControl: false,
          scaleControl:false,
          panControl:false,
          zoomControl:false,
          backgroundColor:`white`,
          styles:mapStyle
        }"
        style="width:100vw;height:100vh"
      >
        <GmapMarker
          :key="index"
          v-for="(m, index) in markers"
          :position="m.position"
          :clickable="true"
          :draggable="false"
          :icon="m.icon || icon"
          @click="m.onClick"
        />
      </GmapMap>

      <!-- taxi dialog -->
      <v-dialog v-model="dialogs.infoOpened" max-width="500px" persistent>
        <v-card light>
          <v-container>
            <v-layout justify-end >
              <v-btn text small color="white" fab @click="dialogs.infoOpened=false"><v-icon color="grey">mdi-close</v-icon></v-btn>
            </v-layout>
            <v-layout column wrap justify-center align-center>
              <h2 class="pa-3">Hey, TAXI!</h2>
              <v-icon size="56" v-if="!target.carPhotoUrl">mdi-taxi</v-icon>
              <v-container v-if="target.driver">
                  <v-layout justify-center xs12>
                    <v-avatar size="60">
                      <v-img :src="target.carPhotoUrl"/>
                    </v-avatar>
                    <v-avatar size="60">
                      <v-img :src="target.driver.faceUrl"/>
                    </v-avatar>
                  </v-layout>
                  <v-layout justify-center xs12>
                    <h2>{{target.driver.name}}</h2>
                  </v-layout >
                  <v-layout justify-center xs12>
                    <v-subheader>{{target.driver.description}}</v-subheader>
                  </v-layout >
                  <v-layout justify-center xs12>
                    <v-rating v-model="target.driver.rate"
                      color="yellow darken-3"
                      background-color="grey darken-1"
                      empty-icon="$vuetify.icons.ratingFull"
                      half-increments
                      hover readonly/>
                  </v-layout>
              </v-container>

              <v-btn color="primary" rounded @click="dialogs.infoOpened=false"><v-icon left>mdi-human-handsup</v-icon>Request</v-btn>
              <v-btn class="mt-4" color="success" text><v-icon left>mdi-phone</v-icon>Call</v-btn>
            </v-layout>

          </v-container>
        </v-card>
      </v-dialog>

      <!-- geolocation dialog -->
      <v-dialog v-model="dialogs.alertionGetLocation" max-width="500px" persistent>
        <v-card light>
          <v-container>
            <v-layout column wrap justify-center align-center>
              <h2 class="pa-3">We will get your location</h2>
              <v-icon size="56" class="mb-5">mdi-crosshairs-gps</v-icon>
              <h5 style="color:grey">If our service shall be started, you should allow it to get your GPS location. Please attach the permittion (push "OK" button) if alert dialog pops on the your display.</h5>
              <v-layout justify-end align-center class="mt-5" style="width:100%">
                <v-btn color="primary" outlined @click="allowGetLocation" ><v-icon left>mdi-thumb-up</v-icon>Confirmed</v-btn>
                <v-btn  color="error" text to="/login">Deny</v-btn>
              </v-layout>
            </v-layout>
          </v-container>
        </v-card>
      </v-dialog>

      <!-- geolocation error dialog -->
      <v-dialog v-model="dialogs.alertionCannotGetLocation" max-width="500px" persistent>
        <v-card light>
          <v-container>
            <v-layout column wrap justify-center align-center>
              <h2 class="pa-3" color="error">GPS is not suppored in your device or browser</h2>
              <v-layout justify-end align-center class="mt-5" style="width:100%">
                <v-btn color="primary" outlined @click="allowGetLocation" ><v-icon left>mdi-thumb-up</v-icon>Confirmed</v-btn>
              </v-layout>
            </v-layout>
          </v-container>
        </v-card>
      </v-dialog>

      <!-- loading dialog -->
      <v-dialog v-model="loading" persistent max-width="300">
        <v-card color="primary" dark>
          <v-card-text>
            {{loadingText||'Loading...'}}
          </v-card-text>
          <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
        </v-card>
      </v-dialog>

  </div>
</template>

<script>
import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'
import mapStyle from '@/static/mapStyle.json'

Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyDpe7EEYDCVnfH9IXJJmA2x_zjJryJF11s',
  },
  installComponents: true
})

import geohash from 'ngeohash'

export default {
  data(){
    return {
      dial:false,
      hoge:null,
      location:{},
      loading:false,
      loadingText:"",
      mapWidth:window.innerWidth*0.8,
      mapHeight:window.innerHeight*0.5,
      mapStyle:mapStyle,
      icon: {
        url: require('@/static/v.png'),
        size: {width: 30, height: 30, f: 'px', b: 'px'},
        scaledSize: {width: 30, height: 30, f: 'px', b: 'px'}
      },
      infoIndex:0,
      target:{},
      additionalMarkers:[],
      taxies:[],
      dialogs:{
        alertionGetLocation:false,
        alertionCannotGetLocation:false,
        infoOpened:false
      }
    }
  },
  computed:{
    markers(){
      const icon =(url)=>({
          url:url,
          size: {width: 30, height: 30, f: 'px', b: 'px'},
          scaledSize: {width: 30, height: 30, f: 'px', b: 'px'}
      })

      const vm = this;
      return [
        {
          position:{
            lat:this.location.lat,
            lng:this.location.lng
          },
          icon:icon("./v.png")
        },
        ...this.additionalMarkers,
        ...this.taxies.map(taxi=>({
          position:{
            lat:taxi.location.lat,
            lng:taxi.location.lng
          },
          icon:icon("./taxi.png"),
          onClick(){
            vm.target=taxi;
            vm.dialogs.infoOpened=true;
          }
        }))
      ].map(e=>{
        e.onClick = e.onClick || function(){}
        return e
      })
    }
  },
  mounted(){
    if(navigator.geolocation){
      this.dialogs.alertionGetLocation = true;
    }else{
      this.dialogs.alertionCannotGetLocation = true;
    }
  },
  methods:{
    uid(){
      return this.$auth.currentUser.uid;
    },
    get(){
      const uid = this.uid()
      console.log({uid})
      this.hoge=null;
      this.$firestore.doc(`users/${uid}`)
        .get()
        .then(doc=>{
          this.hoge = doc.data()
      })
    },
    getLocation(){
      this.loading = true;
      this.loadingText ="Getting your location..."
      navigator.geolocation.getCurrentPosition(location=>{
        this.location = {
          lat:location.coords.latitude,
          lng:location.coords.longitude,
          timestamp:location.timestamp
        }
        this.loading=false
        this.searchTaxi(1000)
      },err=>{
        console.error(err)
        this.loading=false
      });
    },
    allowGetLocation(){
      this.dialogs.alertionGetLocation=false
      this.getLocation();
    },
    move(){
      if(!this.location.lat || !this.location.lng) return;
      this.location.lat += (Math.random() - Math.random())/10000
      this.location.lng += (Math.random() - Math.random())/10000
    },
    toggleInfo(m,i){
      this.dialogs.infoOpened=!this.dialogs.infoOpened
      this.infoIndex = i;
    },
    searchTaxi(distance){
      const {GeoFirestore} = require('geofirestore')
      const geofirestore = new GeoFirestore(this.$firestore)

      console.log({distance})

      this.loading=true;
      this.loadingText = `Taxi searching... : within ${distance} m`
      geofirestore
        .collection('taxies')
        .near({
          center: new this.$GeoPoint(this.location.lat, this.location.lng),
          radius: distance/1000 })
        .get()
        .then(query=>{　// [<firestore query>,<firebase query>]
          console.log({query})
          this.taxies = query.docs.map(doc=>doc.data()) // {name:"...",...}
          console.table(this.taxies)
        })
        .finally(()=>{
          this.loading=false;
        })
    },
    createTaxi(){

      const lat = this.location.lat +  (Math.random() - Math.random())/1000
      const lng = this.location.lng + (Math.random() - Math.random())/1000
      this.$firestore.collection('taxies').add({
        d:{
          carPhotoUrl:"https://picture1.goo-net.com/7001101360/30190527/J/70011013603019052700100.jpg",
          carType:"figaro",
          driver:{
            name:"吉岡里帆",
            faceUrl:"https://www.ateam-japan.com/wp-content/uploads/0807.jpg",
            phone:"090-0000-0000",
            rate:4.8,
            description:"" + Math.random()
          },
          number:"AAA",
          location:{lat:lat,lng:lng}
        },
        g:geohash.encode(lat,lng,8),
        l:new this.$GeoPoint(lat,lng),
        createdAt:Date.now()
      })
    }
  },
  watch:{
    location(location){
      const geoPoint = new this.$GeoPoint(location.lat,location.lng)
      this.$firestore.doc(`users/${this.uid()}`)
        .update({geoPoint})
        .then(()=>{
          console.info("updated",geoPoint)
        })
    },
    "dialogs.infoOpened":(val)=>{
      console.log({val})
    }
  }
}
</script>
