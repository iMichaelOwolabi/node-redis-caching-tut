const express = require('express');
const axios = require('axios');
const redis = require('redis');

const app = express();

const port = 3000;

// make a connection to the local instance of redis
const client = redis.createClient(6379);

client.on("error", (error) => {
  console.error(error);
});

app.get('/recipe/:fooditem', (req, res) => {
  try {
    const foodItem = req.params.fooditem;

    // Check the redis store for the data first
    client.get(foodItem, async (err, recipe) => {
      if (recipe) {
        return res.status(200).send({
          error: false,
          message: `Recipe for ${foodItem} from the cache`,
          data: JSON.parse(recipe)
        })
      } else { // When the data is not found in the cache then we can make request to the server

          const recipe = await axios.get(`http://www.recipepuppy.com/api/?q=${foodItem}`);

          // save the record in the cache for subsequent request
          client.setex(foodItem, 1440, JSON.stringify(recipe.data.results));

          // return the result to the client
          return res.status(200).send({
            error: false,
            message: `Recipe for ${foodItem} from the server`,
            data: recipe.data.results
          });
      }
    })  
  } catch (error) {
      console.log(error)
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
