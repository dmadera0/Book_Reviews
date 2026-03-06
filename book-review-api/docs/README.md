# Book Review API

A serverless REST API for managing books and reviews, built with AWS Lambda, API Gateway, and DynamoDB.

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat&logo=node.js&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-FF9900?style=flat&logo=awslambda&logoColor=white)
![DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-4053D6?style=flat&logo=amazondynamodb&logoColor=white)
![API Gateway](https://img.shields.io/badge/AWS-API_Gateway-FF4F8B?style=flat&logo=amazonapigateway&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)

---

## Overview

The Book Review API provides a set of RESTful endpoints for creating, retrieving, and deleting books, as well as submitting and reading reviews tied to specific books. All data is persisted in DynamoDB and served through AWS-managed infrastructure with no servers to maintain.

This project was built as a portfolio piece to demonstrate practical experience with serverless architecture on AWS, including function design, IAM configuration, DynamoDB data modeling with Global Secondary Indexes, and REST API design.

---

## Architecture

```
Client
  │
  ▼
┌─────────────────────────────────┐
│     API Gateway (REST API)      │
│         Regional Stage          │
└────┬──────────┬─────────────────┘
     │          │
     ▼          ▼
┌─────────────────────────────────┐
│       AWS Lambda Functions      │
│                                 │
│  createBook    getBook          │
│  getBooks      deleteBook       │
│  createReview  getReviews       │
│                                 │
│      (Node.js 22.x / ESM)       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│           DynamoDB              │
│                                 │
│  Books Table   Reviews Table    │
│                (GSI: bookId)    │
└─────────────────────────────────┘
```

---

## Tech Stack

| Service | Role |
|---|---|
| **AWS Lambda** | Serverless compute — each endpoint is an isolated function with its own handler |
| **AWS API Gateway** | Exposes Lambda functions as HTTP endpoints, handles routing and stage management |
| **AWS DynamoDB** | NoSQL database for books and reviews; on-demand billing with a GSI for review lookups |
| **Node.js 22.x** | Lambda runtime using ES Modules (`.mjs`) for clean, modern JavaScript |
| **AWS SDK v3** | Modular AWS SDK used across all functions (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) |

---

## API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/books` | Create a new book | `title`, `author`, `genre` | Created book object |
| `GET` | `/books` | Get all books | — | Array of book objects |
| `GET` | `/books/{bookId}` | Get a single book by ID | — | Book object |
| `DELETE` | `/books/{bookId}` | Delete a book by ID | — | Confirmation message |
| `POST` | `/books/{bookId}/reviews` | Create a review for a book | `reviewerName`, `rating`, `comment` | Created review object |
| `GET` | `/books/{bookId}/reviews` | Get all reviews for a book | — | Array of review objects |

---

## Getting Started

### Prerequisites

- [AWS Account](https://aws.amazon.com/free/)
- [Node.js 22.x](https://nodejs.org/)
- [Postman](https://www.postman.com/downloads/) (optional, for testing)
- AWS CLI configured with appropriate credentials

---

### 1. DynamoDB Table Setup

Create two tables in DynamoDB via the AWS Console or CLI.

**Books Table**

```
Table name:    Books
Partition key: bookId (String)
Billing mode:  On-demand
```

**Reviews Table**

```
Table name:    Reviews
Partition key: reviewId (String)
Billing mode:  On-demand
```

Add a Global Secondary Index (GSI) to the Reviews table to support querying by book:

```
Index name:    bookId-index
Partition key: bookId (String)
```

---

### 2. IAM Role Setup

Create an IAM role for Lambda with the following permissions:

- `AWSLambdaBasicExecutionRole` — allows Lambda to write logs to CloudWatch
- A custom inline policy granting DynamoDB access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Books",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Reviews",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Reviews/index/bookId-index"
      ]
    }
  ]
}
```

Replace `REGION` and `ACCOUNT_ID` with your values.

---

### 3. Lambda Function Deployment

For each function in `functions/`:

1. Zip the function directory (e.g., `zip -j createBook.zip functions/createBook/index.mjs`)
2. Create a Lambda function in the AWS Console:
   - **Runtime:** Node.js 22.x
   - **Handler:** `index.handler`
   - **Execution role:** the IAM role created above
3. Upload the zip file as the function code

Repeat for all six functions: `createBook`, `getBooks`, `getBook`, `deleteBook`, `createReview`, `getReviews`.

---

### 4. API Gateway Configuration

1. Create a new **REST API** in API Gateway
2. Create the following resources and methods, each integrated with the corresponding Lambda function:

| Resource | Method | Lambda Function |
|---|---|---|
| `/books` | `POST` | `createBook` |
| `/books` | `GET` | `getBooks` |
| `/books/{bookId}` | `GET` | `getBook` |
| `/books/{bookId}` | `DELETE` | `deleteBook` |
| `/books/{bookId}/reviews` | `POST` | `createReview` |
| `/books/{bookId}/reviews` | `GET` | `getReviews` |

3. Enable **Lambda Proxy Integration** for each method
4. Deploy the API to a stage (e.g., `dev`)
5. Copy the generated **Invoke URL** — this is your `baseUrl`

---

### 5. Postman Collection

A ready-to-use Postman collection is included at `book-review-api.postman_collection.json`.

1. Open Postman and click **Import**
2. Select `book-review-api.postman_collection.json`
3. Open the collection and go to **Variables**
4. Set `baseUrl` to your API Gateway Invoke URL
5. Run **Create Book** first — the test script automatically saves the returned `bookId` to the `bookId` collection variable, which all subsequent requests use

---

## Example Requests & Responses

### POST /books

**Request**
```http
POST /books
Content-Type: application/json

{
  "title": "Dune",
  "author": "Frank Herbert",
  "genre": "Sci-Fi"
}
```

**Response** `201 Created`
```json
{
  "bookId": "a3f2c1d0-8e4b-4f7a-b6c2-1d9e0f3a5b8c",
  "title": "Dune",
  "author": "Frank Herbert",
  "genre": "Sci-Fi",
  "createdAt": "2026-03-06T12:00:00.000Z"
}
```

---

### POST /books/{bookId}/reviews

**Request**
```http
POST /books/a3f2c1d0-8e4b-4f7a-b6c2-1d9e0f3a5b8c/reviews
Content-Type: application/json

{
  "reviewerName": "Jane Doe",
  "rating": 5,
  "comment": "An absolute masterpiece. One of the greatest sci-fi novels ever written."
}
```

**Response** `201 Created`
```json
{
  "reviewId": "d7b1e2f4-3a5c-4d8e-9f0b-2c6a1e4d7f3b",
  "bookId": "a3f2c1d0-8e4b-4f7a-b6c2-1d9e0f3a5b8c",
  "reviewerName": "Jane Doe",
  "rating": 5,
  "comment": "An absolute masterpiece. One of the greatest sci-fi novels ever written.",
  "createdAt": "2026-03-06T12:05:00.000Z"
}
```

---

### GET /books/{bookId}/reviews

**Request**
```http
GET /books/a3f2c1d0-8e4b-4f7a-b6c2-1d9e0f3a5b8c/reviews
```

**Response** `200 OK`
```json
[
  {
    "reviewId": "d7b1e2f4-3a5c-4d8e-9f0b-2c6a1e4d7f3b",
    "bookId": "a3f2c1d0-8e4b-4f7a-b6c2-1d9e0f3a5b8c",
    "reviewerName": "Jane Doe",
    "rating": 5,
    "comment": "An absolute masterpiece. One of the greatest sci-fi novels ever written.",
    "createdAt": "2026-03-06T12:05:00.000Z"
  }
]
```

---

## Project Structure

```
book-review-api/
├── functions/
│   ├── createBook/
│   │   └── index.mjs
│   ├── getBooks/
│   │   └── index.mjs
│   ├── getBook/
│   │   └── index.mjs
│   ├── deleteBook/
│   │   └── index.mjs
│   ├── createReview/
│   │   └── index.mjs
│   └── getReviews/
│       └── index.mjs
├── book-review-api.postman_collection.json
├── testData.json
└── README.md
```

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
