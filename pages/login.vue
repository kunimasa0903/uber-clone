<template>
  <v-container fill-height>
    <v-layout align-center justify-center>
      <v-card class="pa-4" width="300px">
          <h1>login</h1>
          <v-text-field
            label="email"
            placeholder="your email"
            v-model="email"
          ></v-text-field>
          <v-text-field
            label="password"
            placeholder="pass"
            v-model="password"
          ></v-text-field>
          <v-layout justify-center>
            <v-btn width="100%" color="primary" @click="login" :loading="loading">login</v-btn>
          </v-layout>
          <p style="color:red">{{errText}}</p>
      </v-card>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  data(){
    return{
      email:null,
      password:null,
      loading:false,
      errText:null
    }
  },
  methods:{
    login(){
      if(!this.email || !this.password) return;

      this.loading = true;
      this.$auth
        .signInWithEmailAndPassword(this.email,this.password)
        .then(()=>{
          this.$router.push("/")
        })
        .catch(err=>{
          this.errText = err.message
        })
        .finally(()=>{
          this.loading=false;
        })
    }
  }
}
</script>
