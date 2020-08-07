const express = require('express');
const router = express.Router();
const { User } = require("../models/User");
const { Product } = require("../models/Product");
const { Payment } = require("../models/Payment");
const { auth } = require("../middleware/auth");
const async = require('async');

//=================================
//             User
//=================================

router.get("/auth", auth, (req, res) => {
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image,
        cart: req.user.cart,
        history: req.user.history
    });
});

router.post("/register", (req, res) => {

    const user = new User(req.body);

    user.save((err, doc) => {
        if (err) return res.json({ success: false, err });
        return res.status(200).json({
            success: true
        });
    });
});

router.post("/login", (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (!user)
            return res.json({
                loginSuccess: false,
                message: "Auth failed, email not found"
            });

        user.comparePassword(req.body.password, (err, isMatch) => {
            if (!isMatch)
                return res.json({ loginSuccess: false, message: "Wrong password" });

            user.generateToken((err, user) => {
                if (err) return res.status(400).send(err);
                res.cookie("w_authExp", user.tokenExp);
                res
                    .cookie("w_auth", user.token)
                    .status(200)
                    .json({
                        loginSuccess: true, userId: user._id
                    });
            });
        });
    });
});

router.get("/logout", auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id }, { token: "", tokenExp: "" }, (err, doc) => {
        if (err) return res.json({ success: false, err });
        return res.status(200).send({
            success: true
        });
    });
});

router.post("/addToCart", auth, (req, res) => {
   //first, bring a user information, then put into User Collection 

   User.findOne({_id: req.user._id},
        (err, userInfo)=>{
    //check product in a cart from the user information
            let duplicate = false;
            userInfo.cart.forEach((item) => {
                if(item.id === req.body.productId){
                    duplicate = true;
                }
            })

   //if product exist   
            if(duplicate){
                User.findOneAndUpdate(
                    {_id: req.user._id, "cart.id":req.body.productId},
                    {$inc:{"cart.$.quantity":1}},//increment an order quantity by 1
                    {new: true},// for update
                    (err, userInfo) => {
                        if(err) return res.status(200).json({success: false, err})
                        res.status(200).send(userInfo.cart)
                    }
                )
            }else{//if product not exist
                User.findOneAndUpdate(
                    {_id:req.user._id},
                    {
                        $push:{
                            cart: {
                                id: req.body.productId,
                                quantity: 1,
                                date: Date.now()
                            }
                        }
                    },
                    {new: true},
                    (err, userInfo) => {
                        if(err) return res.status(400).json({success: false, err})
                        res.status(200).send(userInfo.cart)
                    }
                )
            }      
        })
});


router.get('/removeFromCart', auth, (req, res) => {

    //first remove a target product
    User.findOneAndUpdate(
        { _id: req.user._id },
        {
            "$pull":
                { "cart": { "id": req.query.id } }
        },
        { new: true },
        (err, userInfo) => {
            let cart = userInfo.cart;
            let array = cart.map(item => {
                return item.id
            })

            //get remain products from product collection

            //conver to id this type : productIds = ['5e8961794be6d81ce2b94752', '5e8960d721e2ca1cb3e30de4'] 
            Product.find({ _id: { $in: array } })
                .populate('writer')
                .exec((err, productInfo) => {
                    return res.status(200).json({
                        productInfo,
                        cart
                    })
                })
        }
    )
})

router.post('/successBuy', auth, (req, res) => {
    // put basic payment data into History field in User Collection
    let history = [];
    let transactionData = {};

    req.body.cartDetail.forEach((item) => {
        history.push({
            dateOfPurchase: Date.now(),
            name: item.title,
            id: item._id,
            price: item.price,
            quantity: item.quantity,
            paymentId: req.body.paymentData.paymentID
        })
    })

    // put detail payment data into payment Collection

    transactionData.user = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
    }

    transactionData.data = req.body.paymentData

    transactionData.product = history

    // history data save into server
    User.findOneAndUpdate(
        {_id: req.user._id},
        {$push: {history: history}, $set: {cart: []}},
        {new: true},
        (err, user) => {
            if(err) return res.json({success: false, err})

            //save transactionData info into payment
            const payment = new Payment(transactionData)
            payment.save((err, doc) => {
                if(err) return res.json({success: false, err})

                // sold field updata: keep updating sales information which is number of sales since from the begining

                //info: quantity of bought per product
                let products = [];
                doc.product.forEach(item => {
                    products.push({id: item.id, quantity: item.quantity})
                })

                async.eachSeries(products, (item, callback) =>{
                    Product.update(
                        {_id: item.id},
                        {
                            $inc: {
                                "sold": item.quantity
                            }
                        },
                        {new: false},
                        callback
                    )
                }, (err) => {
                    if(err) return res.status(400).json({success: false, err})
                    res.status(200).json({
                        success: true,
                        cart: user.cart,
                        cartDetail: [] 
                    })
                }
                )                
            })
        }
    )
})



module.exports = router;
