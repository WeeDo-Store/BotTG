const { Telegraf, session, Markup, Scenes, Telegram } = require("telegraf");
const bot = new Telegraf("6362027617:AAGjQ2YUpc0a3QjoTZ1qEp60agEMFv31tLo");
const bot2 = new Telegram("6362027617:AAGjQ2YUpc0a3QjoTZ1qEp60agEMFv31tLo");
const linebot = require("linebot"); //Установить line бота

const sqlite3 = require("sqlite3");
const express = require("express");
const app = express();
const request = require("request");

const bodyParser = require("body-parser");

const serverURL = "https://core-production-cd57.up.railway.app";
https://core-production-cd57.up.railway.app/docs

var botLine = linebot({
  channelId: 2000936218,
  channelSecret: "a5d38eb1727055ccac8639cb0c491d37",
  channelAccessToken: "BM35JjhrbtwIKjlWAY2kzDdHTOicp0iGt8ZKx4MUllsv92BGw1hYsgaTVUmCqeyQGOHRjuA44gkvyMk0PCvZ9eJIHV0RzAvZV83S2OOe0j7rf11UZkGX/5OSRWnpxwMtJSY8ZgZyzp3k+QIKAJe7XwdB04t89/1O/w1cDnyilFU="
});


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
    "CREATE TABLE IF NOT EXISTS users (id integer primary key autoincrement, id_tg bigint, status text, store_id text, orders text)",
    "run"
  );

  request.get(serverURL + "/stores/bot-info?botType=Telegram", function (error, response, body) {
    if (!error && response.statusCode == 200) {
      body = JSON.parse(body);
      //console.log(body)
      for (i = 0; i < body.length; i++) {
        console.log(body[i].externalStoreId)
        query(
          `INSERT INTO users (id_tg, status, store_id, orders) VALUES ("${body[i].externalStoreId}","WaitingOrder","${body[i]._id}","")`,
          "run"
        );
      }
    }
  });

});


app.get("/order", (req, res) => {
  console.log(req.params);

  res.send({ message: "Test9" });
});

//Post orders
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
      (req.body.products[i].storeProfit / 100) + "฿";
    text = text + products + "\n";
  }
  text = "Number: " + req.body.number + "\nFirstName: " + req.body.user.firstName + "\nLastName: " + req.body.user.lastName + "\n\n" +
    text + "\n\n<b>Total Price: " + (req.body.price.storeProfit / 100) + "฿" + "</b>" +
    "\n\nPhone: " + req.body.user.phone +
    "\nDate: " + new Date(req.body.createdAt).toLocaleString()
  console.log(text);

  if ((req.body.status == "Placed")) {
    text = "<b>New order:</b>\n\n" + text;
    const keyOrder = Markup.inlineKeyboard([
      [Markup.button.callback("Confirm", "Confirm " + req.body._id)],
      [Markup.button.callback("Cancel", "Cancel " + req.body._id)],
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
    //
  }

  //forward
  text2 = text + "\n\nStore name: " + req.body.store.name + "\nStore phone: " + req.body.store.phone + "\nService commission: " + (req.body.price.serviceCommission / 100) + "฿" + "\nStore profit: " + (req.body.price.storeProfit / 100) + "฿" + "\nDelivery price: "
    + (req.body.price.deliveryPrice / 100) + "฿" + "\nTotal price: " + (req.body.totalPrice / 100) + "฿";
  bot2.sendMessage(2021095215, text2, {
    parse_mode: "HTML",
  });
  //
  // }
  //});

  res.send({ message: "OK" });
});


//comands
bot.on("callback_query", (ctx) => {

  query("SELECT *  FROM users WHERE id_tg=" + ctx.callbackQuery.from.id + " LIMIT 1").then(
    function (user) {
      if (user[0].status == "Canceled") {
        text = "Entering the reason for canceling the last order is necessary";
        bot2.sendMessage(ctx.callbackQuery.from.id, text, {
          parse_mode: "HTML",
        });
      } else {

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
        } else if (command[0] == "Cancel") {


          console.log("-----------------------------Canceled____________________");

          bot2.sendMessage(ctx.callbackQuery.from.id, "Please enter the reason", {
            parse_mode: "HTML",
          });

          query(
            `UPDATE users SET status = "Canceled", orders = "${command[1]}"  WHERE id_tg = '${ctx.from.id}'`,
            "run"
          );



        } else if (command[0] == "WaitingForPickUp") {

          console.log("----------------------------------------------WaitingForPickUp")

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

          // Обработка водителей

          text = "New order.";

          request.get("https://game.helpervk.ru/weeDo/api.php?type=get", function (error, response, body) {
            if (!error && response.statusCode == 200) {
              for (i = 0; i < body.length; i++) {
                botLine.push(body[i][1], text);
              }
            }
          })
          request.get("https://game.helpervk.ru/weeDo/apitg.php?type=get", function (error, response, body) {
            if (!error && response.statusCode == 200) {
              for (i = 0; i < body.length; i++) {
                bot2.sendMessage(body[i][1], text, {
                  parse_mode: "HTML",
                });
              }
            }
          })

        }
        ctx.deleteMessage();
      }
    });
  ctx.telegram.answerCbQuery(ctx.callbackQuery.id);

});


//text
bot.on("text", (ctx) => {
  query("SELECT *  FROM users WHERE id_tg=" + ctx.from.id + " LIMIT 1").then(
    function (user) {
      myMessage = ctx.message.text.split(' ');

      if (ctx.message.text == "/driver") {
        //Привязка водителя 
        request.get("https://game.helpervk.ru/weeDo/apitg.php?type=new&tg_id=" + ctx.from.id, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            bot2.sendMessage(ctx.from.id, "Success");
          }
        })
      }

      //console.log(user);
      console.log(user.length);
      if (ctx.message.text == "/start") {
        bot2.sendMessage(ctx.from.id, "Enter the store name");
        if (user.length == 0) {
          query(
            `INSERT INTO users (id_tg, status, store_id, orders) VALUES ("${ctx.from.id}","WaitingId","","")`,
            "run"
          );
        } else {
          query(
            `UPDATE users SET status = "WaitingId"  WHERE id_tg = '${ctx.from.id}'`,
            "run"
          );
        }
      } else {
        if (user.length > 0) {
          if (myMessage[0] == "/profit") {
            console.log("-------profit-------" + user[0].store_id);
            //if (user[0].status != "WaitingOrder") {
            console.log(serverURL + "/order/store/" + user[0].store_id + "/report?startDate=" + (new Date(myMessage[1]).toISOString()) + "&endDate=" + (new Date(myMessage[2]).toISOString()));

            request.get(serverURL + "/order/store/" + user[0].store_id + "/report?startDate=" + (new Date(myMessage[1]).toISOString()) + "&endDate=" + (new Date(myMessage[2]).toISOString()), function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(body)
                if (body == "{}") {
                  let text = "No data found";
                  bot2.sendMessage(ctx.from.id, text, {
                    parse_mode: "HTML",
                  });
                } else {
                  //console.log(response)
                  body = JSON.parse(body);
                  console.log(body.orders[0])
                  let text = "Total store profit: " + body.totalStoreProfit / 100 + "฿\n"
                  for (i = 0; i < body.orders.length; i++) {
                    text = text + "\n\nNumber order: " + body.orders[i].number + "\nStore profit: " + (body.orders[i].storeProfit / 100) + "฿";
                  }
                  bot2.sendMessage(ctx.from.id, text, {
                    parse_mode: "HTML",
                  });
                }
              }
            })
            //}
          }
          if (user[0].status == "WaitingId") {
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
                console.log(body);
                bot2.sendMessage(ctx.from.id, "The store is registered");
                query(
                  `UPDATE users SET store_id = "${body._id}", status = "WaitingOrder"  WHERE id_tg = '${ctx.from.id}'`,
                  "run"
                );
              } else {
                bot2.sendMessage(ctx.from.id, "Error");
              }
            })
          } else if (user[0].status == "Canceled") {
            query(
              `UPDATE users SET status = "WaitingOrder"  WHERE id_tg = '${ctx.from.id}'`,
              "run"
            );

            var options = {
              method: 'PATCH',
              uri: serverURL + "/order/" + user[0].orders + "/status",
              json: {
                status: "Canceled",
                rejectReason: ctx.message.text,
              },
              headers: {
                'X-API-Key': 'horsepower'
              }
            }

            request(options, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(body)
                bot2.sendMessage(ctx.from.id, "Order cancelled", {
                  parse_mode: "HTML",
                });
                text2 = "Order " + body.number + " cancelled \nReason: " + ctx.message.text;
                bot2.sendMessage(2021095215, text2, {
                  parse_mode: "HTML",
                });
              }
            })

            //
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
