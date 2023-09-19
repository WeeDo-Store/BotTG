const { Telegraf, session, Markup, Scenes, Telegram } = require("telegraf");
const bot = new Telegraf("6362027617:AAGjQ2YUpc0a3QjoTZ1qEp60agEMFv31tLo");
const bot2 = new Telegram("6362027617:AAGjQ2YUpc0a3QjoTZ1qEp60agEMFv31tLo");

const sqlite3 = require("sqlite3");
const express = require("express");
const app = express();
const request = require("request");

const bodyParser = require("body-parser");

const serverURL = "https://core-production-cd57.up.railway.app";
https://core-production-cd57.up.railway.app/docs

var jsonParser = bodyParser.json();

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.json());

const SQLite3 = sqlite3.verbose();
const db = new SQLite3.Database("users.db");

const query = (command, method = "all") => {
  return new Promise((resolve, reject) => {
    db[method](command, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

db.serialize(async () => {
  await query(
    "CREATE TABLE IF NOT EXISTS users (id bigint primary key not null, status text, store_id text, orders text)",
    "run"
  );
});

app.get("/order", (req, res) => {
  console.log(req.params);

  res.send({ message: "Test9" });
});

app.post("/tg/order", urlencodedParser, function (req, res) {
  console.log(req.body.products);
  if (!req.body) return res.sendStatus(400);
  // query(
  //   "SELECT *  FROM users WHERE id=" +
  //   req.body.store.externalStoreId +
  //   " LIMIT 1"
  // ).then(function (user) {
  //   console.log(user[0]);
  //   if (user[0].status == "WaitingOrder") {
  let text = "";
  let category = "";
  let subCategory = "";
  for (let i = 0; i < req.body.products.length; i++) {
    // if (
    //   typeof req.body.products[i].product.category != "undefined" &&
    //   req.body.products[i].product.category != category
    // ) {
    //   category = req.body.products[i].product.category;
    // }
    // if (
    //   typeof req.body.products[i].product.subCategory != "undefined" &&
    //   req.body.products[i].product.subCategory != subCategory
    // ) {
    //   subCategory = req.body.products[i].product.subCategory;
    // }
    // "<b>Category: " +
    // category +
    // "</b>\n" +
    // "<b>Subcategory: " +
    // subCategory +
    // "</b>\n" +
    let products =
      "Name: " +
      req.body.products[i].product.name +
      "\nAmount: " +
      req.body.products[i].amount +
      "\nPrice: " +
      (req.body.products[i].product.price / 100) + "฿";
    text = text + products + "\n";
  }
  text = "Number: " + req.body.number + "\nFirstName: " + req.body.user.firstName + "\nLastName: " + req.body.user.lastName + "\n\n" +
    text + "\n\n<b> Total Price: " + (req.body.totalPrice / 100) + "฿" + "</b>" +
    "\n\n Phone: " + req.body.user.phone +
    "\n Date: " + new Date(req.body.createdAt).toLocaleString()
  console.log(text);

  if ((req.body.status == "Placed")) {
    text = "<b>New order:</b>\n\n" + text;
    const keyOrder = Markup.inlineKeyboard([
      [Markup.button.callback("Confirm", "Confirm " + req.body._id)],
      [Markup.button.callback("Сanсel", "Сanсel " + req.body._id)],
    ]);

    bot2.sendMessage(req.body.store.externalStoreId, text, {
      parse_mode: "HTML",
      reply_markup: keyOrder["reply_markup"],
    });
  } else if ((req.body.status == "Completed")) {
    text = "<b>Order completed:</b>\n\n" + text;
    bot2.sendMessage(req.body.store.externalStoreId, text, {
      parse_mode: "HTML",
    });
  } else if ((req.body.status == "WaitingForPickUp") || (req.body.status == "Confirmed")) {
    text = "<b>Сourier is assigned:</b>\n\n" + text;
    bot2.sendMessage(req.body.store.externalStoreId, text, {
      parse_mode: "HTML",
    });
  }
  // }
  //});

  res.send({ message: "OK" });
});

bot.on("callback_query", (ctx) => {
  console.log(ctx.callbackQuery.data);

  let command = ctx.callbackQuery.data.split(" ");
  console.log(command[0]);

  if (command[0] == "Confirm") {
    console.log("---------------------------------status");
    console.log(serverURL + "/order/" + command[1] + "/status");
    var options = {
      method: 'PATCH',
      uri: serverURL + "/order/" + command[1] + "/status",
      json: {
        status: "Confirmed",
      },
      headers: {
        'X-API-Key': 'horsepower'
      }
    }

    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body)
      }
    })

    const keyOrder = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "Waiting for pickup",
          "WaitingForPickUp " + command[1]
        ),
      ],
    ]);
    bot2.sendMessage(ctx.callbackQuery.from.id, "Order is confirmed.", {
      parse_mode: "HTML",
      reply_markup: keyOrder["reply_markup"],
    });
  } else if (command[0] == "Canceled") {

    var options = {
      method: 'PATCH',
      uri: serverURL + "/order/" + command[1] + "/status",
      json: {
        status: "Canceled",
      },
      headers: {
        'X-API-Key': 'horsepower'
      }
    }

    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body)
      }
    })

  } else if (command[0] == "WaitingForPickUp") {

    var options = {
      method: 'PATCH',
      uri: serverURL + "/order/" + command[1] + "/status",
      json: {
        status: "WaitingForPickUp",
      },
      headers: {
        'X-API-Key': 'horsepower'
      }
    }

    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body)
      }
    })



  }

  ctx.telegram.answerCbQuery(ctx.callbackQuery.id);

  ctx.deleteMessage();
});

const bonus = Markup.inlineKeyboard([
  [Markup.button.callback("Информация о бонусе", "Информация о бонусе")],
  [Markup.button.callback("Подать заявку на бонус", "Подать заявку на бонус")],
  [Markup.button.callback("Назад", "back_to_main_menu")],
]);

bot.on("text", (ctx) => {
  query("SELECT *  FROM users WHERE id=" + ctx.from.id + " LIMIT 1").then(
    function (user) {
      myMessage = ctx.message.text.split(' ');

      console.log(user);
      console.log(user.length);
      if (ctx.message.text == "/start") {
        bot2.sendMessage(ctx.from.id, "Enter the store ID");
        if (user.length == 0) {
          query(
            `INSERT INTO users VALUES ("${ctx.from.id}","WaitingId","","")`,
            "run"
          );
        } else {
          query(
            `UPDATE users SET status = "WaitingId"  WHERE id = '${ctx.from.id}'`,
            "run"
          );
        }
      } else if (myMessage[0] == "/profit") {
        console.log("-------profit-------"+user[0].store_id);
        //if (user[0].status != "WaitingOrder") {
          console.log(serverURL + "/order/store/" + user[0].store_id + "/report?startDate="+(new Date(myMessage[1]).toISOString())+"&endDate="+(new Date(myMessage[2]).toISOString()));

          request.get(serverURL + "/order/store/" + user[0].store_id + "/report?startDate="+(new Date(myMessage[1]).toISOString())+"&endDate="+(new Date(myMessage[2]).toISOString()), function (error, response, body) {
            if (!error && response.statusCode == 200) {
              console.log(body)
              let text = (new Date(myMessage[1]).toISOString())+"Total store profit: " + body.totalStoreProfit+"\n" + (new Date(myMessage[2]).toISOString())
              for (i=0; i<body.orders.length; i++) {
                text = text + "\n\nNumber order: " + body.orders[i].number + "\nStore profit: " + body.orders[i].storeProfit
              }
              bot2.sendMessage(ctx.from.id, text, {
                parse_mode: "HTML",
              });
            }
          })
        //}
      } else {
        if (user.length == 1) {
          if (user[0].status == "WaitingId") {
            bot2.sendMessage(ctx.from.id, "The store is registered");
            query(
              `UPDATE users SET store_id = "${ctx.message.text}", status = "WaitingOrder"  WHERE id = '${ctx.from.id}'`,
              "run"
            );

            var options = {
              method: 'PATCH',
              uri: serverURL + "/stores/" + ctx.message.text + "/assignBot",
              json: {
                botType: "Telegram",
                externalStoreId: ctx.from.id,
              },
              headers: {
                'X-API-Key': 'horsepower'
              }
            }

            request(options, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(body)
              }
            })
          }
        }
      }
    }
  );
});

bot.launch();

const server = app.listen(process.env.PORT || 3003, (error) => {
  if (error) return console.log(`Error: ${error}`);
  console.log(`Server listening on port ${process.env.PORT || 3003}`);
});
