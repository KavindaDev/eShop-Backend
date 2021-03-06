const {Order} = require('../models/order');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const { OrderItem } = require('../models/order-items');


//get all orders 
router.get(`/` ,async (req, res)=> {
    const orderList = await Order.find().populate('user').sort('dateOrderd');

    if(!orderList) {
        res.status(500).json({success: false})
    }
    res.send(orderList);
})


//get order by id
router.get(`/:id` ,async (req, res)=> {
    const order = await Order.findById(req.params.id)
    .populate('user')
    .populate({
        path: 'orderItems', populate: { 
            path: 'product', populate: 'category'}})
   

    if(!order) {
        res.status(500).json({success: false})
    }
    res.send(order);
})

//post order
router.post(`/`, async (req, res) => {
    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })
        newOrderItem = await newOrderItem.save();

       return newOrderItem._id;
    }))

    const orderItemsIdsResolved = await orderItemsIds;

    //total price calc
    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))

 
    const totalPrice = totalPrices.reduce((a,b) => a +b , 0);

    console.log(totalPrices)


    let order = new Order({

         orderItems: orderItemsIdsResolved, 
        shippingAddress1: req.body.shippingAddress1,
        city: req.body.city,
        country: req.body.country,
        zip: req.body.zip,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    
    })

   order = await order.save()

    if(!order) 
    return res.status(400).send('The order cannot be placed!!')

    res.send(order);
})


//delete by id *then* method
router.delete('/:id', (req, res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "order not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})



//update order by id
router.put(`/:id`, async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
           status: req.body.status 
        },
        {new: true}
    )

    if(!order)
    res.status(400).send('the {{id}} order cannot be updated')

    res.send(order);
})


//total sales
router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalSales : { $sum : '$totalPrice'}}}
    ])

    if(!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }
        res.send({totalSales: totalSales.pop().totalSales})
    
})

//get amount of orders
router.get(`/get/count`, async (req, res) => {

    const orderCount = await Order.countDocuments((count) => count)
    if (!orderCount) {
        res.status(400).json({ success: false , message: "No orders found!!" })
    }
    res.send({
        orderCount: orderCount
    })

})

// get user orders per user
router.get(`/get/userorders/:userid`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.userid}).populate({ 
        path: 'orderItems', populate: {
            path : 'product', populate: 'category'} 
        }).sort({'dateOrdered': -1});

    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    res.send(userOrderList);
})


module.exports =router;
