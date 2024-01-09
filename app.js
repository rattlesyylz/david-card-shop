/*
 * Name: Jun Wang & Cynthia Hong
 * Date: May 7, 2023
 * Section: CSE 154 AA & AC
 * This app.js use to provide the David's Card Shop with API. It allows the users
 * to buy the cards, give feedbacks of cards, and see payment history, as well sign up
 * and login to their account.
 */

'use strict';

const express = require('express');
const app = express();
const multer = require('multer');

const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const GET_BALANCE = 'SELECT balance FROM Accounts WHERE user_name = ?;';
const SERVER_ERROR_MSG = 'An error occurred on the server. Try again later.';
const GET_ACCOUNTS = 'SELECT * FROM Accounts WHERE user_name = ?;';
const GET_ITEM = 'SELECT * FROM Items WHERE item_id = ?;';
const GET_ITEMS = 'SELECT item_id, quantity, price, category, item_name FROM Items;';

// For application/x-www-form-urlencoded.
app.use(express.urlencoded({extended: true})); // Built-in middleware.

// For application/json.
app.use(express.json()); // Built-in middleware.

// For multipart/form-data (required with FormData).
app.use(multer().none()); // Requires the "multer" module.

app.use(cookieParser());

/**
 * Gets every item.
 */
app.get('/cards', async (req, res) => {
  try {
    let setCard = await getItemsFromTable();
    res.json(setCard);
  } catch (error) {
    res.type('text').status(500)
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Gets all of the item ids that match the search query.
 */
app.get('/search/:query', async (req, res) => {
  try {
    let searchResult = await getItemsBySearchQuery(req.params.query);
    res.json(searchResult);
  } catch (error) {
    res.type('text').status(500)
      .send(500);
  }
});

/**
 * Verifies the user's username and password.
 */
app.post('/login', async (req, res) => {
  try {
    if (req.body.user && req.body.password) {
      let db = await getDBConnection();
      let userInfo = 'SELECT user_name, user_password, balance' +
        ' FROM Accounts WHERE user_name = ?;';
      let result = await db.get(userInfo, [req.body.user]);
      await db.close();
      if (result && await bcrypt.compare(req.body.password, result['user_password'])) {
        res.json(result.balance);
      } else {
        res.json(-1);
      }
    } else {
      res.type('text').status(400)
        .send('There is a POST parameter disappearing.');
    }
  } catch (error) {
    res.type('text').status(500)
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Get detailed information about an item specified by its id "itemID".
 */
app.get('/card/:itemID', async (req, res) => {
  try {
    let cardNum = req.params.itemID;
    let result = await getItemFromTable(cardNum);
    if (!result) {
      res.type('text').status(400)
        .send('Card #' + cardNum + ' does not exist.');
    } else {
      res.json(result);
    }
  } catch (error) {
    res.type('text').status(500)
      .send(500);
  }
});

/**
 * Creates an account with an email, username, andpassword.
 */
app.post('/createaccount', async (req, res) => {
  if (!req.body.email || !req.body.username || !req.body.password) {
    res.type('text').status(400)
      .send('There is a POST parameter disappearing.');
  } else {
    try {
      let db = await getDBConnection();
      let result = await db.get(GET_ACCOUNTS, [req.body.username]);
      if (result) {
        await db.close();
        res.type('text').status(400)
          .send("The Username ( " + req.body.username + " ) is already existed.");
      } else {
        const salt = await bcrypt.genSalt();
        let newAccount = 'INSERT INTO Accounts (\'user_name\', \'user_password\', \'email\')' +
          ' VALUES (?, ?, ?);';
        await db.run(newAccount, [req.body.username, await bcrypt.hash(req.body.password, salt),
        req.body.email]);
        let balance = await db.get(GET_BALANCE, [req.body.username]);
        await db.close();
        res.json(balance.balance);
      }
    } catch (error) {
      res.type('text').status(500)
        .send(500);
    }
  }
});

/**
 * Allows a user to buy an item.
 */
app.post('/buy', async (req, res) => {
  if (!req.body.quantity || !req.body.user || !req.body.id) {
    res.type('text').status(400)
      .send('There is a POST parameter disappearing.');
  }
  try {
    let cardNum = 'UPDATE Items SET quantity = ? WHERE item_id = ?;';
    let db = await getDBConnection();
    let cardID = req.body.id;
    let number = req.body.quantity;
    let userName = req.body.user;
    let currNumber = await db.get('SELECT quantity FROM Items WHERE item_id = ?;', [cardID]);
    let balance = await db.get(GET_BALANCE, [userName]);
    let getPrice = 'SELECT price FROM Items WHERE item_id = ?';
    let price = await db.get(getPrice, [cardID]);
    let num = [currNumber, number];
    let errResult = handleTransactErrors(num, balance, price, cardID, userName, req.cookies.user);
    if (errResult !== '') {
      await db.close();
      res.type('text').status(400)
        .send(errResult);
    } else {
      await db.run(cardNum, [currNumber.quantity - number, cardID]);
      res.json(await transact(db, userName, cardID, price.price, balance.balance, number));
    }
  } catch (error) {
    res.type('text').status(500)
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Get a user's transactions.
 */
app.get('/transactions/:username', async (req, res) => {
  if (!req.cookies.user) {
    res.type('text').status(400)
      .send('Plz login first!');
  } else {
    try {
      let getPayment = 'SELECT item_name, transaction_id, Items.item_id, ' +
        ' total_price, transaction_date FROM Transactions, Items WHERE user_name = ?' +
        ' AND Items.item_id = Transactions.item_id ORDER BY ' +
        'DATETIME(transaction_date) DESC;';
      let db = await getDBConnection();
      let history = await db.all(getPayment, [req.params.username]);
      await db.close();
      res.json(history);
    } catch (error) {
      res.type('text').status(500)
        .send(SERVER_ERROR_MSG);
    }
  }
});

/**
 * Submit feedback containing the username, score, and feedback text.
 */
app.post('/feedback', async (req, res) => {
  res.type('text');
  if (!req.body.username || !req.body.score || !req.body.id) {
    res.status(400).send('There is a POST parameter disappearing.');
  } else {
    try {
      let db = await getDBConnection();
      let userName = req.body.username;
      let oldUser = await db.get(GET_ACCOUNTS, [userName]);
      let ourCards = await db.get(GET_ITEM, [req.body.id]);
      let user = req.cookies.user;
      let result = handleFeedbackErrors(oldUser, userName, ourCards, req.body.id, user);
      if (result !== '') {
        await db.close();
        res.status(400).send(result);
      } else {
        const buildFeedback = 'INSERT INTO Feedbacks (\'item_id\', \'user_name\', \'score\',' +
          ' \'feedback_text\') VALUES (?, ?, ?, ?);';
        await db.run(buildFeedback, [req.body.id, userName,
        req.body.score, (req.body.description ? req.body.description : '')]);
        await db.close();
        res.send('Success!');
      }
    } catch (error) {
      res.status(500).send(500);
    }
  }
});

/**
 * Handles errors related to submitting feedback.
 * @param {object} oldUsers not null/undefined iff the user
 * submitting the feedback exists.
 * @param {string} userName the username of the user submitting feedback.
 * @param {object} ourCards not null/undefined iff the item for which
 * the user is submitting a feedback exists.
 * @param {number} cardID the ID of the item to leave feedback on.
 * @param {object} alreadyLogin not null/undefined iff the user seeking
 * to submit feedback is logged in.
 * @returns {string} representing the error, if one exists; otherwise, returns an empty string.
 */
function handleFeedbackErrors(oldUsers, userName, ourCards, cardID, alreadyLogin) {
  if (!alreadyLogin) {
    return 'Plz login first!';
  } else if (!oldUsers) {
    return userName + ' is not a valid username.';
  } else if (!ourCards) {
    return 'There is no valid item with ID ' + cardID + '.';
  }
  return '';
}

/**
 * Handles errors related to completing a transaction.
 * @param {object} number the quantity of the item to purchase and the
 * quantity of items requested to purchase.
 * @param {object} balance the user's balance.
 * @param {price} price the item's price.
 * @param {number} cardID the item's ID.
 * @param {string} userName the user's username.
 * @param {object} alreadyLogin not null/undefined iff the user is logged in.
 * @returns {string} representing the error, if it exists; otherwise, returns an
 * empty string.
 */
function handleTransactErrors(number, balance, price, cardID, userName, alreadyLogin) {
  if (!alreadyLogin) {
    return 'Plz login First!';
  } else if (!number[0]) {
    return 'We do not have card #' + cardID;
  } else if (number[0].quantity < number[1]) {
    return 'We only have ' + number[0].quantity + ' in the shop.';
  } else if (!balance) {
    return userName + ' is not a valid user.';
  } else if (balance.balance < price.price * number[1]) {
    return 'You do not have enough credit to buy the card(s).';
  }
  return '';
}

/**
 * Completes a transaction by logging the transaction and updates the user's balance.
 * @param {object} db the database object.
 * @param {string} userName the username.
 * @param {number} cardID the item ID.
 * @param {number} price the item's price.
 * @param {number} balance the user's balance before the transaction.
 * @param {number} number the quantity of items bought.
 * @returns {object} the JSON object containing the user's balance after the
 * transaction and the transaction ID.
 */
async function transact(db, userName, cardID, price, balance, number) {
  let builtHistory = 'INSERT INTO Transactions (\'user_name\', \'item_id\', \'total_price\',' +
    '\'quantity\') VALUES (?, ?, ?, ?);';
  let transactionID = await db.run(builtHistory, [userName, cardID, number * price, number]);
  const newBalance = 'UPDATE Accounts SET balance = ? WHERE user_name = ?;';
  await db.run(newBalance, [balance - number * price, userName]);
  let userBalance = await db.get(GET_BALANCE, [userName]);
  await db.close();
  return {'confirmation_number': transactionID.lastID, 'balance': userBalance.balance};
}

/**
 * Get all of the items from the Items table, along with their average score.
 * @returns {object} the JSON array representing all of the items that we get from
 *                   the Items table.
 */
async function getItemsFromTable() {
  let db = await getDBConnection();
  let result = await db.all(GET_ITEMS);
  for (let i = 0; i < result.length; i++) {
    result[i]['avg_score'] = await getAverageScore(result[i].item_id);
  }
  await db.close();
  return result;
}

/**
 * Get the item IDs of the items matching a search query.
 * @param {string} diffType the search brand.
 * @returns {object} the JSON object representing the IDs of the items matching
 * the search query.
 */
async function getItemsBySearchQuery(diffType) {
  let db = await getDBConnection();
  let getType = '%' + diffType + '%';
  let getSearch = 'SELECT item_id FROM Items WHERE item_name LIKE ?' +
    ' OR description LIKE ? OR category LIKE ?;';
  let result = await db.all(getSearch, [getType, getType, getType]);
  let finalResult = [];
  for (let i = 0; i < result.length; i++) {
    finalResult.push(result[i]['item_id']);
  }
  await db.close();
  return finalResult;
}

/**
 * Get more detailed information about an item from Items table, with an id specified by "itemID".
 * Return undefined if no item with id of "itemID" exists in the table.
 * @param {number} itemID - the item id of the item that we want to get more information from
 * @returns {object} the JSON object representing an item with an id itemID, along with
 *                       the feedbacks of the users for that item. If there is no item with id of
 *                       "itemID", undefined is returned.
 */
async function getItemFromTable(itemID) {
  let getFeedback = 'SELECT user_name, score, feedback_text ' +
    'FROM Feedbacks WHERE item_id = ?;';
  let db = await getDBConnection();
  let cardInfo = await db.get('SELECT * FROM Items WHERE item_id = ?;', [itemID]);
  if (cardInfo) {
    cardInfo['avg_score'] = await getAverageScore(itemID);
    cardInfo['feedbacks'] = await db.all(getFeedback, [itemID]);
  }
  await db.close();
  return cardInfo;
}

/**
 * Get the average user score of an item with an item id of "itemID". Returns full score (5) if
 * an item doesn't have any user score.
 * @param {number} itemID the item id of the item that we want to get the average user score from.
 * @returns {number} the average user score of an item or 5 if there is no user score yet for
 *                   current item with an id of "itemID"
 */
async function getAverageScore(itemID) {
  let db = await getDBConnection();
  let getAvg = 'SELECT AVG(score) AS avg_score FROM Feedbacks WHERE item_id = ?;';
  let avgScore = await db.get(getAvg, [itemID]);
  if (!avgScore['avg_score']) {
    avgScore['avg_score'] = 5;
  }
  await db.close();
  return avgScore['avg_score'];
}

/**
 * Establishes a database connection to the database and returns the database
 * object. Any errors that occur should be caught in the function that calls this
 * one.
 * @returns {object} the database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'backend_db.db',
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT);
