/**
 * @author Mudit
 * In this assignment an Express.js server is used to manage products and
 * orders through CRUD operations (Create, Read, Update, Delete) as (POST, GET, PUT, DELETE).
 *  It offers routes for searching, updating, and deleting products by ID, retrieving the status
 * of an order by its ID, creating new orders, and canceling existing ones. All interactions
 * are handled via JSON files for storing and retrieving product and order data.
 */



// initializes an Express.js application sets up the server.
const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()

// const mongoose = require("mongoose");

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://root:root@cluster0.0s958jd.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);



// Middleware to parse JSON bodies
app.use(express.json())

// Route for searching products in products.json file by name and if there is no 
//product found then with the help of try and catch block handeling the error
app.get('/search', (req, res) => {
    // Extract the product name from the query parameter
    const productName = req.query.name 

    if (!productName)
    {
        return res.status(400).json({ error: 'Product name is required' })
    }

    // Read the products JSON file
    fs.readFile(path.join(__dirname, 'product.json'), 'utf8', (err, data) => {
        if (err) 
        {
            console.error('Error reading products file:', err)
            return res.status(500).json({ error: 'Internal server error' })
        }

        try 
        {
            const products = JSON.parse(data)
            // Filter products based on the product name
            const filteredProducts = products.filter(product => product.name.toLowerCase().includes(productName.toLowerCase()))
            res.json(filteredProducts)
        } 
        catch (error) 
        {
            console.error('Error parsing JSON data:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    });
});

/**
 * Here in the product.json we are trying to read the details of the product
 * and using conditions trying to handel the error if we are unsucessfull while
 * reading
 * @param {function} callback
 * @returns NULL 
 */
function readProductData(callback) 
{
    const filePath = path.join(__dirname, 'product.json')

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) 
        {
            console.error("Error reading product data:", err)
            callback([])
            return
        }

        try 
        {
            const productData = JSON.parse(data)
            callback(productData)
        } 
        catch (parseError) 
        {
            console.error("Error parsing product data:", parseError)
            callback([])
        }
    });
}

// Function to update the product data in the JSON file
/**
 * Here in this function the product data in produt.json file
 * is been updated with the help of primary key and then showcasing the status 
 * of this operation
 * @param {string} productData details about it
 * @param {String|number} productId to uniquely identify product 
 * @param {object} newData to store it
 */
function updateProductData(productData, productId, newData) 
{
    const updatedProductData = productData.map(product => {
        if (product.id === productId) 
        {
            return { ...product, ...newData }
        }
        return product
    });
    const filePath = path.join(__dirname, 'product.json')

    fs.writeFile(filePath, JSON.stringify(updatedProductData, null, 2), (err) => {
        if (err) 
        {
            console.error("Error updating product data:", err)
            return
        }
        console.log("Product data updated successfully.")
    });
}

// Endpoint to update a product record
app.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id)
    const newData = req.body

    readProductData((productData) => {
        updateProductData(productData, productId, newData)
        res.json({ message: `Product with ID ${productId} updated successfully. `})
    });
});

/**
 * Function to read data from a JSON file and handels the error.
 * @param {string} pathOfFile - The path of the JSON file to read.
 * @param {Function} callback - The callback function for parsed JSON data.
 */
function readJSONFile(filePath, callback) 
{
    //read the content of the file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) 
        {
            console.error("Error reading JSON file:", err)
            callback([])
            return
        }
        try 
        {
            //tries to read the content in JSON format
            const jsonData = JSON.parse(data)
            //asynchronously keep reading the content in file and keep running
            //in background while other getting execute
            callback(jsonData)
        } 
        catch (parseError) 
        {
            console.error("Error parsing JSON data:", parseError)
            callback([])
        }
    });
}


/**
 * Function to delete a record from a JSON file
 * @param {string} pathOfFile - The path of the JSON file to update.
 * @param {string or number} uniqueKey - The unique key (ID) to identify the object to delete.
 */
function deleteJSONRecord(pathOfFile, uniqueKey) 
{
    readJSONFile(pathOfFile, (jsonData) => {
        // Find the index of the record with the given unique key
        const index = jsonData.findIndex(item => item.id === uniqueKey)
        if (index !== -1) 
        {
            // Remove the record from the array
            jsonData.splice(index, 1)
            // Write the updated JSON data back to the file
            fs.writeFile(pathOfFile, JSON.stringify(jsonData, null, 2), (error) => {
                if (error) 
                {
                    console.error("Error updating JSON file:", error)
                    return
                }
                console.log("Record deleted successfully.")
            });
        } 
        else 
        {
            console.error("Record with provided unique key not found.")
        }
    });
}



// DELETE request handler to delete a product record
app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id)
    const filePath = path.join(__dirname, 'product.json')

    // Call deleteJSONRecord function to delete the record
    deleteJSONRecord(filePath, productId)

    // Respond with a success message
    res.json({ message: `Product with ID ${productId} deleted successfully`})
});

/**
 * This function handles GET requests to retrieve the status of
 * a specific order by its ID.
 */
app.get('/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id)
    const filePath = path.join(__dirname, 'order.json')

    // Read the order data from the JSON file
    readJSONFile(filePath, (orders) => {
        // Find the order with the specified order ID
        const order = orders.find(order => order.order_id === orderId)
        if (order) 
        {
            // If the order is found, return its status
            res.json({ status: order.status })
        } 
        else 
        {
            // If the order is not found, return a 404 status
            res.status(404).json({ error: 'Order not found' })
        }
    });
});


/**
 * /**
 * This function writes JSON data to a file.
 * 
 * @param {string} filePath - The path to the JSON file.
 * @param {Object} data - The JSON data to be written.
 * @param {Function} callback - A callback function to be called after writing the file.
 */
function writeJSONFile(filePath, data, callback) 
{
    // Write JSON data to the file
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) 
        {
            // Log error if writing fails
            console.error("Error writing JSON file:", err)
            if (callback) 
            {
                callback(err)
            }
        } 
        else 
        {
            if (callback) 
            {
                // Call the callback function with the error object
                callback(null)
            }
        }
    });
}

/**
 * This function handles a POST request to create a new order. It generates
 * a unique order ID using the current timestamp, adds this ID to the order 
 * data received in the request body.
 */
app.post('/orders', (req, res) => {
    const orderData = req.body

    // Generate a unique order ID
    const orderId = Date.now()

    // Add the order ID to the order data
    orderData.order_id = orderId

    // Read existing orders from the order JSON file
    const ordersFilePath = path.join(__dirname, 'order.json')
    readJSONFile(ordersFilePath, (orders) => {
        // Add the new order to the existing orders
        orders.push(orderData)

        // Write the updated orders back to the order JSON file
        writeJSONFile(ordersFilePath, orders, (err) => {
            if (err) 
            {
                res.status(500).json({ error: "Error creating order" })
            } 
            else 
            {
                res.status(200).json({ order_id: orderId })
            }
        });
    });
});

/**
 * Function to update data in a JSON file based on a unique key.
 * @param {string} pathOfFile - The path of the JSON file to update.
 * @param {string|number} uniqueKey - The unique key to identify the object to update.
 * @param {object} newData - The new data to update.
 */
function updateJSONData(filePath, uniqueKey, newData)
 {
    readJSONFile(filePath, (jsonData) => {
        //it checks the id property of each object matches the unique key given
        const index = jsonData.findIndex(item => item.order_id === uniqueKey)
        //checks if given unique key is present in JSONdata or not 
        if (index !== -1) 
        {
            //updates the object with new data
            jsonData[index] = { ...jsonData[index], ...newData }
            fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
                if (err) 
                {
                    console.error("Error updating JSON file:", err)
                    return
                }
                console.log("JSON file updated successfully.")
            });
        } 
        else 
        {
            console.error("Order with provided ID not found.")
        }
    });
}


/**
 * This function handles a PUT request to cancel an order by its ID.
 * It first checks if the provided order ID is valid. If not, it responds
 * with a 400 error. Then, it updates the status of the order to "Cancelled" 
 * in the order JSON file. 
 */
app.put('/orders/:id/cancel', (req, res) => {
    const orderId = parseInt(req.params.id)
    if (isNaN(orderId)) 
    {
        res.status(400).json({ error: "Invalid order ID" })
        return
    }

    const ordersFilePath = path.join(__dirname, 'order.json')
    updateJSONData(ordersFilePath, orderId, { status: "Cancelled" })
    res.json({message: "Order cancelled successfully", orderId})
});


/**
 * POST requests to add a product. It reads the existing products from
 *  a JSON file, generates a unique ID for the new product, adds the new
 *  product to the list of existing products, and writes the updated product
 *  list back to the JSON file and if not sucessfull handeling the error
 */
app.post('/products', (req, res) => {
    // Get the new product data from the request body
    const newProduct = req.body; 

    // Read the existing products from the product JSON file
    const productsFilePath = path.join(__dirname, 'product.json')
    readJSONFile(productsFilePath, (products) => {
        // Generate a unique ID for the new product (example: using the current timestamp)
        const productId = Date.now()
        
        // Add the generated ID to the new product
        newProduct.id = productId
        
        // Add the new product to the existing products
        products.push(newProduct)

        // Write the updated products back to the product JSON file
        writeJSONFile(productsFilePath, products, (err) => {
            if (err) 
            {
                res.status(500).json({ error: "Error adding product" })
            } 
            else 
            {
                res.status(201).json({ id: productId, message: "Product added successfully" })
            }
        });
    });
});

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log('Server is running on port ${PORT}')
});
