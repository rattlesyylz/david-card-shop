# David's Card Shop API Documentation
The David's Card Shop API provides information about various cards sold by the card shop and to be interacted with the website user.

## Get a list of all Cards in this service
**Request Format:** `/card/products`

**Request Type:** `GET`

**Returned Data Format**: `JSON`

**Description:** Return a list of all of the cards that user can look up in this API

**Example Request:** `/card/products`

**Example Response:**

```
[
  {
    "product_id": 1,
    "name": "Orbit V7",
    "price": $19.99,
    "color": "Blue",
    "category": "ORBIT",
    "img": "img/product1.jpg",
    "description": "The seventh iteration of the popular Orbit deck series.."
  },
  {
    "product_id": 2,
    "name": "Fontaine Sleights",
    "price": $24.99,
    "color": "Blue",
    "category": "FONTAINES",
    "img": "img/product2.jpg",
    "description": "A unique deck of cards designed specifically for cardistry sleights and moves."
  }
  ...
]
```

**Error Handling:**
* If the card products are not found, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.

## Look up a card's Information
**Request Format:** `/card/product/:productid`

**Request Type:** `GET`


**Returned Data Format:** `JSON`

**Description:** Returns a list of all of the Cards' parameter that user can look up in this API. In details, the card's name, price, feature, category and image link, according to the given productid of the card.

**Example Request:** `/card/product/3`

**Example Response:**

```
{
  "product_id": 3,
  "name": "Smoke and Mirrors",
  "price": $29.99,
  "color": "Black",
  "category": "DD",
  "img": "img/product3.jpg",
  "description": "A classic deck of cards with a modern twist, perfect for cardistry performances."
}
```

**Error Handling:**
* If the product ID parameter is not a positive integer or no items are found with this product ID, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.

## Get a List of Card with category
**Request Format:** `/card/search/:category`

**Request Type:** `GET`

**Required Parameters**
* `category` (`DD`, `FONTAINES`, and so on)

**Returned Data Format**: `JSON`

**Description:** *Returns the name, category, price, and image link etc. of all products given the category*

**Example Request:** `/card/search/:FONTAINES`

**Example Response:**

```
[
  {
    "product_id": 2,
    "name": "Fontaine Sleights",
    "price": $24.99,
    "color": "Blue",
    "category": "FONTAINES",
    "img": "img/product2.jpg",
    "description": "A unique deck of cards designed specifically for cardistry sleights and moves."
  }
  ...
]
```

* If the category parameter is not found, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.

## Look up s user's Information
**Request Format:** `/card/user/:userid`

**Request Type:** `GET`

**Returned Data Format:** `JSON`

**Description:** Returns a list of information of user's login account
**Example Request:** `/user/3`

**Example Response:**

```
{
  "user_id": 3,
  "name": "David Wang",
  "email": davidW3@uw.edu,
  "password": 123456,
  "description": "the information of user David Wang."
}
```

**Error Handling:**
* If the product ID parameter is not a positive integer or no items are found with this product ID, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.

## Look up s user's buying history
**Request Format:** `/card/history/:userid`

**Request Type:** `GET`

**Returned Data Format:** `JSON`

**Description:** Returns a list of buying history of the user
**Example Request:** `/user/history/3`

**Example Response:**

```
[
  {
      "product_id": 1,
      "history_id": 12,
      "price": 19.99,
      "data": "2023-05-10 00:03:09",
  },
  {
      "product_id": 1,
      "history_id": 13,
      "price": 19.99,
      "data": "2023-05-12 00:05:09",
  }
]
```

**Error Handling:**
* If the product ID parameter is not a positive integer or no items are found with this product ID, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.

## Get a list of card's Feedback
**Request Format:** `/card/feedback/:productid`

**Request Type:** `GET`

**Returned Data Format**: `JSON`

**Description:** returns the list of feedback

**Example Request:** `/card/feedback/3/feedback`

**Example Response:**

```
[
  {
    "product_id": 3,
    "average_rate": 8,
    "given_rate": 9,
    "reason": "This classic deck of cards has been updated with a modern twist, making it perfect for cardistry performances. The cards are made of high-quality stock and have a smooth finish, making them easy to handle and manipulate.."
  }
  ...
]
```

**Error Handling:**
* If the product ID parameter is not a positive integer or no items are found with this product ID, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.

## Get Feedback of Card from User
**Request Format:** `/card/feedback`

**Request Type:** `POST`

**Required Parameters**
* `product_name`
* `product_id`
* `given_rate`
* `feedback_reason`

**Returned Data Format**: `Plain Text`

**Description:** Store the name of card, rate given by buyer, and the rate reason into the database

**Example Request:** `/card/feedback` with
`feedbackData` params:

```
{
  "product_name": "Smoke and Mirrors",
  "product_id": 3;
  `given_rate`: 10;
  "feedback": "I love this card so much!"
}
```

**Example Response:**
`"Feedback receive, thanks so much~"`

**Error Handling:**
* If the POST parameter is not found, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.
* If the user is not log in, thrown an plain text that "you should login first!"

## Verify Login Process
**Request Format:** `/login` with post parameter of user name and password

**Request Type:** `POST`

**Required Parameters**
* `user_name`
* `user_password`

**Returned Data Format**: JSON

**Description:** Verify whether the login is successful. If it is successful, return the account information of user; if it is not successful, return -1.

**Example Request:** `/login` with
`user_name` = David & `user_password` = 123456

**Example Response:**

```
 96.05
```

**Error Handling:**
* If the POST parameter is not found, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.

## Signup Process
**Request Format:** `/signup` with post parameter of user name, email, and password

**Request Type:** `POST`

**Required Parameters**
* `user_name`
* `user_email`
* `user_password`

**Returned Data Format**: JSON

**Description:** Create a account for user who do not have the account with the user name. email, and password.

**Example Request:** `/signup` with
`user_name` = David & `user_email` = davidw3@uw.edu &`user_password` = 123456

**Example Response:**

```
300
```

**Error Handling:**
* If the POST parameter is not found, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.

## Buying Process
**Request Format:** `/buy`

**Request Type:** `POST`

**Required Parameters**
* `product_id`
* `user_name`

**Returned Data Format**: JSON

**Description:** User could but the card product and check their buying history (add the buying information into his account)

**Example Request:** `/buy` with
`product_id` = 3 & 'user_name' = david

**Example Response:**
```
{
  'history_id' = 1
}
```

**Error Handling:**
* If the POST parameter is not found, the API responds with a `400` status code and a plain text error message.
* If the server encounters an error while connecting to the database, the API responds with a `500` status code and a plain text error message.
* If the user is not log in, thrown an plain text that "you should login first!"
