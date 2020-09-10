const {
  Assertion
} = require("../../assertion");
const {
  BasePlugin
} = require("..");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const {
  JwtPlugin
} = require("../jwt/");
const CLIENT_CACHE_DURATION = 43200 * 1000;
//const utils = require("../../utils");


const tileObject = require("./TileObjects");

/**
 * https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
 */
class JwtBBoxPlugin extends BasePlugin {
  static initialize(server) {}

  /**
   * Create new instance
   *
   * @name constructor
   * @param {*} config
   */
  constructor(server, config) {
    super(...arguments);
  }

  /**
   * Verify the request
   *
   * @name verify
   * @param {*} configToken
   * @param {*} req
   * @param {*} res
   */
  async verify(configToken, req, res) {

    //Checking trough JWT Plugin if the Signature is Valid
    //and if the token is not expired
    const plugin = this;
    res.statusCode = 200;
    JwtPlugin.initialize(plugin.server);
    let jwtplugiInstance = new JwtPlugin(plugin.server, plugin.config);
    let returnval = await jwtplugiInstance.verify(configToken, req, res);
    if (res.statusCode != 200) {
      res.statusCode = 401;
      return res;
    }

    let token = plugin.server.utils.parse_bearer_authorization_header(req.headers["authorization"]).token;
    let tokenBody = token.split(".")[1];
    let tokenJsonObject = JSON.parse(plugin.server.utils.base64_decode(tokenBody));

    //Deny acces when no sub is in the JWT
    if(!tokenJsonObject.sub){
      plugin.server.logger.debug("token need sub(Kundenreferenz)");
      res.statusCode = 403;
      return res;
    }

    let urlPaths = req.headers["x-forwarded-uri"].split("/");
    let url_zoom = parseInt(urlPaths[urlPaths.length - 3], 10);
    let url_x = parseInt(urlPaths[urlPaths.length - 2], 10);
    let url_y = parseInt(urlPaths[urlPaths.length - 1].replace(".png", ""), 10);



    //Checking if the request is valid
    if (!Number.isInteger(url_zoom) || !Number.isInteger(url_x) || !Number.isInteger(url_y)) {
      res.statusCode = 400;
      return res;
    }

    //Allow every request for zoom level <19
    if(url_zoom < 19){
      res.statusCode = 200;
      return res;
    }
    //console.log("zoom=", url_zoom);
    //console.log("x=", url_x);
    //console.log("y=", url_y);


    let urlBBox = tileObject.getBoundingBoxFromTile(new tileObject.Tile(url_zoom, url_x, url_y));


    let bboxes = tokenJsonObject.bboxes;
    if (bboxes) {
      for (let i = 0; i < bboxes.length; i++) {
        //console.log(bboxes[i]);
        let jsonZoomBBox = new tileObject.ZoomBoundingBox(bboxes[i].minZoom, bboxes[i].maxZoom, new tileObject.BoundingBox(bboxes[i].west, bboxes[i].east, bboxes[i].north, bboxes[i].south));
        if (tileObject.isInRange(jsonZoomBBox.minZoom, jsonZoomBBox.maxZoom, url_zoom)) {
          //let jsonBBox = new tileObject.BoundingBox(bboxes[i].west, bboxes[i].east, bboxes[i].north, bboxes[i].south);
          if (tileObject.overlap(jsonZoomBBox.bbox, urlBBox)) {
            res.statusCode = 200;
            return res;
          }
        }
      }
    }
    //User is not allowed to request tile
    plugin.server.logger.debug("token not have zoomBoundingBox declared for this tile");
    res.statusCode = 403;
    return res;
  }

}

module.exports = {
  JwtBBoxPlugin
};
