const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

// Data adding to DB

mongoose.connect('mongodb+srv://jawedmubeen905:test123@cluster0.cpwomdl.mongodb.net/todolistDB',
  {
    useNewUrlParser: true
  }
);
const dbt = mongoose.connection.db;
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String
  }
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: 'Write your Today To-Do-List'
})

const item2 = new Item({
  name: 'Click + Button to add'
})

const item3 = new Item({
  name: '<-- will delete'
})

const defaultItems = [item1, item2, item3];


const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);


// Routes

app.set('view engine', 'ejs');

app.get(`/`, function (req, res) {


  Item.find().exec()
    .then((result) => {

      if (result.length === 0) {
        Item.insertMany(defaultItems)
      }

      else {
        res.render("main/list", { listTitle: 'Today', newListItems: result })
      }

      res.redirect('/');


    })
    .catch((err) => {
      console.error(err);
    });
})


app.post(`/`, function (req, res) {
  let item = req.body.item;
  let list = req.body.list;

  const userList = new Item({
    name: item
  })

  if (list === 'Today') {
    userList.save();
    res.redirect(`/`);

  } else {
    List.findOne({ name: list })
      .then(function (foundList) {
        foundList.items.push(userList);
        foundList.save().then(() => console.log('Item added to the custom list'));

        res.redirect(`/` + list)
      })
      .catch((err) => {
        console.log(err);
      })
  }
})

app.post('/delete', function (req, res) {

  let deleteItemId = req.body.checkbox;
  let listName = req.body.listName;

  if (listName === 'Today') {
    Item.deleteOne({ _id: (deleteItemId) })
      .then(function () {
        console.log("Data deleted"); // Success
        res.redirect(`/`);
      })
      .catch((err) => {
        console.log(err);
      })

  }

  else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        if (foundList) {
          foundList.items.pull({ _id: deleteItemId })
          return foundList.save();
        }
      })

      .then(function () {
        console.log('Item has deleted from custom list');
        res.redirect(`/` + listName)
      })

      .catch(function (err) {
        console.log(err);
      })
  }

})

app.get('/:list', function (req, res) {
  const customListItem = _.capitalize(req.params.list);

  List.findOne({ name: customListItem })
    .then(function (foundList) {  // Success

      // console.log(foundList.name);

      if (!foundList) {

        // Create a new list
        const list = new List({
          name: customListItem,
          items: defaultItems
        })

        list.save();

        res.redirect('/' + customListItem)
      }

      else if (foundList) {

        // Show a existing list
        res.render('main/list', { listTitle: foundList.name, newListItems: foundList.items })
      }

    }).catch(function (error) {
      console.log(error); // Failure
    });

})



app.get("/about", function (req, res) {
  res.render("main/about")
})



app.listen('3000', function () {
  console.log("Server has started on port 3000");
})