<template>
  <div>
    <v-container>
      <v-btn text @click="get" color="primary">get</v-btn>
      {{hoge}}
        <v-btn @click="getLocation" color="info" fab :loading="loading">
          <v-icon>mdi-crosshairs-gps</v-icon>
        </v-btn>
      lat:{{location.lat}}
      lng:{{location.lng}}
      <v-btn fab color="secondary" @click="searchTaxi(1)">
        <v-icon>mdi-taxi</v-icon>
      </v-btn>
      <v-btn fab color="secondary" @click="createTaxi">
        <v-icon>mdi-plus</v-icon>
      </v-btn>

    </v-container>

      <GmapMap
        :center="{lat:location.lat, lng:location.lng}"
        :zoom="18"
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
      <v-dialog v-model="infoOpened" max-width="500px">
        <v-card light>
          <v-container>
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
                  
              <v-btn color="primary" rounded ><v-icon left>mdi-human-handsup</v-icon>Request</v-btn>
              <v-btn class="mt-4" color="success" text><v-icon left>mdi-phone</v-icon>Call</v-btn>
            </v-layout>

          </v-container>
        </v-card>
      </v-dialog>
      <v-btn color="info" @click="move" v-show="location.lat" fab><v-icon>mdi-walk</v-icon></v-btn>
  </div>
</template>

<script>
import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'

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
      hoge:null,
      location:{},
      loading:false,
      mapWidth:window.innerWidth*0.8,
      mapHeight:window.innerHeight*0.5,
      icon: {
        url: require('@/static/v.png'),
        size: {width: 30, height: 30, f: 'px', b: 'px'},
        scaledSize: {width: 30, height: 30, f: 'px', b: 'px'}
      },
      infoOpened: false,
      infoIndex:0,
      target:{},
      additionalMarkers:[],
      taxies:[]
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
            vm.infoOpened=true;
          }
        }))
      ].map(e=>{
        e.onClick = e.onClick || function(){}
        return e
      })
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
      navigator.geolocation.getCurrentPosition(location=>{
        this.location = {
          lat:location.coords.latitude,
          lng:location.coords.longitude,
          timestamp:location.timestamp
        }
        this.loading=false
      },err=>{
        console.error(err)
        this.loading=false
      });
    },
    move(){
      if(!this.location.lat || !this.location.lng) return;
      this.location.lat += (Math.random() - Math.random())/10000
      this.location.lng += (Math.random() - Math.random())/10000
    },
    toggleInfo(m,i){
      this.infoOpened=!this.infoOpened
      this.infoIndex = i;
    },
    searchTaxi(distance){
      const {GeoFirestore} = require('geofirestore')
      const geofirestore = new GeoFirestore(this.$firestore)

      console.log({distance})
      geofirestore
        .collection('taxies')
        .near({
          center: new this.$GeoPoint(this.location.lat, this.location.lng),
          radius: distance })
        .get()
        .then(query=>{　// [<firestore query>,<firebase query>]
          console.log({query})
          this.taxies = query.docs.map(doc=>doc.data()) // {name:"...",...}
          console.table(this.taxies)
        })

      return
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

      return
      /*
      import * as geofirex from 'geofirex'
      const geo = geofirex.init(this.$firestore);
      const ta
      */
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
    }
  }
}
</script>
