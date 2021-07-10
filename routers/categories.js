const { Category } = require('../models/category');
const express = require('express')
const router = express.Router();

router.get(`/`, async (req, res) => {
    const categoriesList = await Category.find();

    if (!categoriesList) {
        res.status(500).json({ success: false })
    }
    res.send(categoriesList);
})

//post category async method
router.post(`/`, async (req, res) => {
    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color
    })
    category = await category.save();

    if (!category)
        return res.status(404).send('The category cannot be created!')
    res.send(category);

})

//get category by id
router.get(`/:id`, async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(500).json({ message: 'The category with the given i d was not found ' })
    }
    res.status(200).send(category);
})

//delete by id *then* method
router.delete(`/:id`, (req, res) => {
    Category.findByIdAndRemove(req.params.id).then(category => {
        if (category) {
            return res.status(200).json({ success: true, message: 'category successfully deleted!!!' })
        } else {
            return res.status(404).json({ success: false, message: 'category not found!!!' })
        }
    }).catch(err => {
        return res.status(400).json({ success: false, error: err })
    })
})

//update by category by id
router.put(`/:id`, async (req, res) => {
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color
        },
        {new: true}
    )

    if(!category)
    res.status(400).send('the {{id}} category cannot be updated')

    res.send(category);
})


module.exports = router;