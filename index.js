var geohash = require('ngeohash');
var geolib = require('geolib');
var btree = require("btreejs");
var GeohashDistance = require('geohash-distance');
var Tree = btree.create(2, btree.strcmp);
var fulfillersIndex = new Tree();

// assuming distance is from the centre of the uk
var ukcentre = {lat: 54.00366, lon: -2.547855};

// sample test data
var fulfillers = [
    [2.5, 2.1],
    [0.9, 1.8],
    [-2.5, 2.1]
];

var customers = [
    [0.0, 0.0],
    [0.2, -0.1],
    [2.4, 2.2],
    [1.0, 2.0]
];

function calculateGeoHash(x, y) {
    // it should be possible to convert geohash encoding to use cartesian coordinates, which would eliminate
    // the need to calculate the destination point in lat/long
    // however, in the interests of time, calculate the distance from centre based on all that
    var distance = Math.sqrt(Math.pow(x * 1000, 2) + Math.pow(y * 1000, 2));
    var bearing = 90 - (180 / Math.PI) * Math.atan2(y, x);
    var destination = geolib.computeDestinationPoint(ukcentre, distance, bearing);

    return geohash.encode(destination.latitude, destination.longitude);
}

for (var i = 0; i < fulfillers.length; i++) {
    var fulfiller = fulfillers[i];
    var hash = calculateGeoHash(fulfiller[0], fulfiller[1]);
    fulfillersIndex.put(hash, fulfiller);
}

for (var i = 0; i < customers.length; i++) {
    var customer = customers[i];
    var hash = calculateGeoHash(customer[0], customer[1]);
    console.log('Checking ' + customer + ' with hash: ' + hash);

    var minDistance = null;
    var minHash = null;
    // TODO: properly search btree
    fulfillersIndex.walk(null, null, function(indexHash) {
        // TODO: should be possible to check difference between 2 geohashes using just bits and not need to convert
        if (indexHash) {
            var dist = GeohashDistance.inKm(hash, indexHash);
            if (!minDistance || dist < minDistance) {
                minDistance = dist;
                minHash = indexHash;
            }
        }
    }.bind(minDistance).bind(minHash).bind(hash));

    console.log('Best option ' + fulfillersIndex.get(minHash) + ' hash: ' + minHash + ' dist: ' + minDistance);
}
