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
      <v-btn fab color="secondary" @click="searchTaxi">
        <v-icon>mdi-taxi</v-icon>
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
          :icon="icon"
          @click="toggleInfo(m,index)"
        />
      </GmapMap>
      <v-dialog v-model="infoOpened">
        <v-card light>
          <v-container>
            <v-layout column wrap justify-center align-center>
              <h2 class="pa-3">Hey, TAXI!</h2>
              <v-icon size="56">mdi-taxi</v-icon>
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
function boundingBoxCoordinates(center, radius) {
  const KM_PER_DEGREE_LATITUDE = 110.574;
  const latDegrees = radius / KM_PER_DEGREE_LATITUDE;
  const latitudeNorth = Math.min(90, center.lat + latDegrees);
  const latitudeSouth = Math.max(-90, center.lat - latDegrees);
  // calculate longitude based on current latitude
  const longDegsNorth = metersToLongitudeDegrees(radius, latitudeNorth);
  const longDegsSouth = metersToLongitudeDegrees(radius, latitudeSouth);
  const longDegs = Math.max(longDegsNorth, longDegsSouth);
  return {
    swCorner: { // bottom-left (SW corner)
      latitude: latitudeSouth,
      longitude: wrapLongitude(center.lng - longDegs),
    },
    neCorner: { // top-right (NE corner)
      latitude: latitudeNorth,
      longitude: wrapLongitude(center.lng + longDegs),
    },
  };

  function metersToLongitudeDegrees(distance, latitude) {
    const EARTH_EQ_RADIUS = 6378137.0;
    // this is a super, fancy magic number that the GeoFire lib can explain (maybe)
    const E2 = 0.00669447819799;
    const EPSILON = 1e-12;
    const radians = degreesToRadians(latitude);
    const num = Math.cos(radians) * EARTH_EQ_RADIUS * Math.PI / 180;
    const denom = 1 / Math.sqrt(1 - E2 * Math.sin(radians) * Math.sin(radians));
    const deltaDeg = num * denom;
    if (deltaDeg < EPSILON) {
      return distance > 0 ? 360 : 0;
    }
    // else
    return Math.min(360, distance / deltaDeg);

    function degreesToRadians(degrees) {
      return (degrees * Math.PI) / 180;
    }
  }

  function wrapLongitude(longitude) {
    if (longitude <= 180 && longitude >= -180) {
      return longitude;
    }
    const adjusted = longitude + 180;
    if (adjusted > 0) {
      return (adjusted % 360) - 180;
    }
    // else
    return 180 - (-adjusted % 360);
  }
}


export default {
  data(){
    return {
      hoge:null,
      location:{},
      loading:false,
      mapWidth:window.innerWidth*0.8,
      mapHeight:window.innerHeight*0.5,
      icon: {
        url: require('@/static/taxi.png'),
        size: {width: 30, height: 30, f: 'px', b: 'px'},
        scaledSize: {width: 30, height: 30, f: 'px', b: 'px'}
      },
      infoOpened: false,
      additionalMarkers:[]
    }
  },
  computed:{
    markers(){
      return [{
        position:{
          lat:this.location.lat,
          lng:this.location.lng
        },
        title:"you are here."
      },...this.additionalMarkers]
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
    },
    searchTaxi(){
      const radius = 0.0001;
      const ne = new this.$GeoPoint(this.location.lat+radius,this.location.lng+radius)
      const sw = new this.$GeoPoint(this.location.lat-radius,this.location.lng-radius)
      this.$firestore.collection('taxies')
        .where('geoPoint','>=',sw)
        .where('geoPoint','<=',ne)
        .limit(10)
        .get()
        .then(query=>{　// [<firestore query>,<firebase query>]
          const taxies = query.docs.map(doc=>doc.data()) // {name:"...",...}
          console.table(taxies)
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
    }
  }
}
</script>
