const express = require("express");
const router = express.Router();

router.get('/', function (req, res) {
    res.json({message: 'welcome to data api!'});
});

const {MongoClient} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/test', function (err, db) {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log("Connected successfully to server");
    process.on('exit', (code) => {
        console.log("about to exit with code:", code);
        db.close();
    });

    router.route('/restaurants').get(function (req, res) {

        res.setHeader('Content-Type', 'application/json');

        res.write("[");

        const restaurants = db.collection('restaurants');

        let index = 0;

        restaurants.find({}, {
            "name": 1,
            "cuisine": 2,
            "borough": 3
        }).project({"name": 1}).batchSize(500).each(function (err, item) {
            if (item) {
                if (index++ > 0) {
                    res.write(',');
                }
                res.write(JSON.stringify(item, (name, val) => name === '_id' ? undefined : val));
            } else {
                res.write("]");
                res.end();
            }
        });

        console.log("send:", index, "items");
    });

    router.route('/cuisines').get(function (req, res) {

        const restaurants = db.collection('restaurants');

        restaurants.aggregate([{$group: {_id: "$cuisine", count: {$sum: 1}}}], function (err, cuisines) {
            if (!err) {
                let count = 0;
                cuisines.forEach(c => {
                    c.name = c._id;
                    count++;
                });
                console.log("found:", count, "cuisines");
                res.send(JSON.stringify(cuisines, (name, val) => name === '_id' ? undefined : val));
            }
        });

    });
});

exports.router = router;