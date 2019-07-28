
const ngeohash = require('ngeohash');
const geolib = require('geolib');
// ジオハッシュで使われる文字一覧
const geohashChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

export default function(app,inject){

  class Geo{
    constructor({unit=8}={}){
      this.unit = unit;
    }

    geohash(lat,lng){
      return ngeohash.encode(lat,lng,this.unit)
    }

      /**
    * 対象エリアを包括する四角形エリアのgeohashのリストを取得する
    * @param {Object} latLng
    * @param {Number} radius
    */
    getArea({center, radius}) {
        center = {
          latitude:center[0],
          longitude:center[1]
        };
        const makeGeoHashNum=(bearing)=>{
            const p = geolib.computeDestinationPoint(center, radius * Math.sqrt(2), bearing);
            const geohash = ngeohash.encode(p.latitude, p.longitude, this.unit);
            const n = this._geohashToNum(geohash);
            return n;
        }
        const shape = [
            makeGeoHashNum(-45),
            makeGeoHashNum(45),
            makeGeoHashNum(-135),
            makeGeoHashNum(135)
        ];
        const min = Math.min.apply(null, shape);
        const max = Math.max.apply(null, shape);

        const geohashList = [];
        for(let i = min; i <= max; i++) {
            const geohash = this._numToGeohash(i);
            const point = ngeohash.decode(geohash);
            geohashList.push({geohash: geohash, point: point});
        }

        return geohashList;
    }

    /**
    * ジオハッシュを計算用の数値（32進数）に変換
    * @param {String} geohash
    */
    _geohashToNum(geohash) {
        let result = 0;
        let base = 1;
        for (let i = geohash.length - 1;i >= 0; i--) {
            result = result + geohashChars.indexOf(geohash[i]) * base;
            base = base * 32;
        }
        return result;
    }

    /**
    * 計算用の数値（32進数）からgeohashに戻す
    * @param {Number} num
    */
    _numToGeohash(num) {
      let result = '';
      while(num > 0) {
          result = geohashChars[num % 32] + result;
          num = Math.floor(num / 32);
      }
      return result;
    }
  }

  inject('Geo',Geo)

}
