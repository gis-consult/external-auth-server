module.exports = {
  BoundingBox: function (west, east, north, south) {
    this.west = west;
    this.east = east;
    this.north = north;
    this.south = south;
  },

  ZoomBoundingBox: function (minZoom, maxZoom, bbox) {
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.bbox = bbox;
  },

  //Creates a Tile
  Tile: function (zoom, x, y) {
    this.zoom = zoom;
    this.x = x;
    this.y = y;
  },

  //Creates a Bounding Box from a Tile
  getBoundingBoxFromTile: function (tile) {
    let bbox = new this.BoundingBox(this.getLongDeg(tile.x, tile.zoom), this.getLongDeg(tile.x + 1, tile.zoom), this.getLatDeg(tile.y, tile.zoom), this.getLatDeg(tile.y + 1, tile.zoom));
    return bbox;
  },
  //Gets Latitude where the Tile starts
  //Use y-1 for end of the tile
  getLatDeg: function (y, zoom) {
    let n = Math.PI - (2.0 * Math.PI * y) / Math.pow(2.0, zoom);
    let lat_rad = Math.atan(Math.sinh(n));
    let lat_deg = lat_rad * 180 / Math.PI;
    return lat_deg;
  },

  //Gets Longitude where the Tile starts
  //Use x-1 for end of the tile
  getLongDeg: function (x, zoom) {
    let n = (Math.pow(2, zoom));
    let lon_deg = x / n * 360.0 - 180.0;
    return lon_deg;
  },

  overlap: function (boxA, boxB) {
    if (boxA.west >= boxB.east) {
      return false;
    }
    if (boxA.north <= boxB.south) {
      return false;
    }

    if (boxA.east <= boxB.west) {
      return false;
    }

    if (boxA.south >= boxB.north) {
      return false;
    }
    return true;
  },
  isInRange: function (min, max, number){
  	if(number <= max && number >= min){
  		return true;
  	}
  	return false;
  }
}
