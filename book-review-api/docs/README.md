# Book Review API

A serverless REST API for managing books and their reviews, built with AWS Lambda, API Gateway, and DynamoDB.

---

## Architecture

```
Client
  │
  ▼
┌─────────────────────────────────────────┐
│          API Gateway (REST API)         │
│          Stage: dev  |  Regional        │
└──────┬──────────┬──────────┬────────────┘
       │          │          │
       ▼          ▼          ▼
  ┌─────────┐ ┌────────┐ ┌──────────┐
  │ /books  │ │/books/ │ │/books/   │
  │  POST   │ │{id}    │ │{id}/     │
  │  GET    │ │GET     │ │reviews   │
  └────┬────┘ │DELETE  │ │POST GET  │
       │      └───┬────┘ └────┬─────┘
       │          │           │
       ▼          ▼           ▼
┌──────────────────────────────────────────┐
│              AWS Lambda                  │
│  createBook  getBook   createReview      │
│  getBooks    deleteBook  getReviews      │
│        (Node.js 22.x, ES Modules)        │
└──────────────────┬───────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │       DynamoDB       │
        │  ┌────────────────┐  │
        │  │  Books Table   │  │
        │  │  PK: bookId    │  │
        │  └────────────────┘  │
        │  ┌────────────────┐  │
        │  │ Reviews Table  │  │
        │  │  PK: reviewId  │  │
        │  │  GSI: bookId   │  │
        │  └────────────────┘  │
        └──────────────────────┘
```

---

## Prerequisites

- An AWS account with console access
- A chosen AWS region (these instructions use **us-east-1** as an example — substitute your preferred region throughout)

---

## Step 1 — Create DynamoDB Tables

### 1a. Books Table

1. Open the [DynamoDB console](https://console.aws.amazon.com/dynamodb).
2. Click **Create table**.
3. Fill in:
   - **Table name**: `Books`
   - **Partition key**: `bookId` — type **String**
4. Under **Table settings**, select **Customize settings**.
5. Under **Read/write capacity settings**, choose **On-demand**.
6. Leave all other defaults and click **Create table**.

### 1b. Reviews Table

1. Click **Create table** again.
2. Fill in:
   - **Table name**: `Reviews`
   - **Partition key**: `reviewId` — type **String**
3. Under **Table settings**, select **Customize settings**.
4. Under **Read/write capacity settings**, choose **On-demand**.
5. Scroll to **Global Secondary Indexes** and click **Add index**:
   - **Partition key**: `bookId` — type **String**
   - **Index name**: `bookId-index`
   - **Attribute projections**: All
   - Click **Create index**.
6. Click **Create table**.

---

## Step 2 — Create the IAM Role

1. Open the [IAM console](https://console.aws.amazon.com/iam).
2. In the left sidebar click **Roles**, then click **Create role**.
3. Under **Trusted entity type**, select **AWS service**.
4. Under **Use case**, select **Lambda**. Click **Next**.
5. In the permissions search box, attach the following two policies:
   - `AWSLambdaBasicExecutionRole`
   - `AmazonDynamoDBFullAccess`
6. Click **Next**.
7. Set **Role name**: `lambda-book-review-role`.
8. Click **Create role**.

> **Note**: `AmazonDynamoDBFullAccess` is used here for simplicity. In production, replace it with a least-privilege custom policy scoped to only the `Books` and `Reviews` tables.

---

## Step 3 — Create and Deploy Lambda Functions

Each function is deployed the same way. Repeat these steps for all 6 functions.

### Function list

| Function name  | Handler file location                          | Runtime       |
|----------------|------------------------------------------------|---------------|
| `createBook`   | `functions/createBook/index.mjs`               | Node.js 22.x  |
| `getBooks`     | `functions/getBooks/index.mjs`                 | Node.js 22.x  |
| `getBook`      | `functions/getBook/index.mjs`                  | Node.js 22.x  |
| `deleteBook`   | `functions/deleteBook/index.mjs`               | Node.js 22.x  |
| `createReview` | `functions/createReview/index.mjs`             | Node.js 22.x  |
| `getReviews`   | `functions/getReviews/index.mjs`               | Node.js 22.x  |

### Steps per function

1. Open the [Lambda console](https://console.aws.amazon.com/lambda).
2. Click **Create function** → **Author from scratch**.
3. Fill in:
   - **Function name**: e.g. `createBook`
   - **Runtime**: Node.js 22.x
   - **Architecture**: x86_64
4. Under **Permissions**, expand **Change default execution role**:
   - Select **Use an existing role**
   - Choose `lambda-book-review-role`
5. Click **Create function**.
6. In the **Code source** panel, open the inline editor.
   - Delete the default `index.mjs` content.
   - Paste the full content of the corresponding `index.mjs` from this project.
7. Click **Deploy**.

> **AWS SDK v3 note**: `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` are included in the Lambda Node.js managed runtime — no `node_modules` upload or layer is required.

---

## Step 4 — Create the API Gateway

1. Open the [API Gateway console](https://console.aws.amazon.com/apigateway).
2. Click **Create API** → **REST API** (not Private) → **Build**.
3. Fill in:
   - **API name**: `book-review-api`
   - **Endpoint type**: Regional
4. Click **Create API**.

### 4a. Create Resources and Methods

Build the following resource tree:

```
/
├── books                    (resource)
│   ├── GET   → getBooks
│   ├── POST  → createBook
│   └── {bookId}             (resource, path parameter)
│       ├── GET    → getBook
│       ├── DELETE → deleteBook
│       └── reviews          (resource)
│           ├── GET  → getReviews
│           └── POST → createReview
```

#### Create `/books`

1. In the **Resources** panel, select the root `/`.
2. Click **Create resource**.
   - **Resource name**: `books`
   - **Resource path**: `books`
   - Click **Create resource**.

#### Add GET /books → getBooks

1. Select the `/books` resource.
2. Click **Create method** → choose **GET** → click the checkmark.
3. Fill in:
   - **Integration type**: Lambda Function
   - **Lambda proxy integration**: **Enabled** (check the box)
   - **Lambda function**: `getBooks`
4. Click **Save** and confirm the permission dialog.

#### Add POST /books → createBook

1. Select `/books`, click **Create method** → **POST**.
2. Same settings as above but **Lambda function**: `createBook`.
3. Click **Save**.

#### Create `/books/{bookId}`

1. Select `/books`, click **Create resource**.
   - **Resource name**: `{bookId}` (or label it `bookId`)
   - **Resource path**: `{bookId}`
   - Click **Create resource**.

#### Add GET /books/{bookId} → getBook

1. Select `/{bookId}`, click **Create method** → **GET**.
2. Lambda proxy integration enabled, **Lambda function**: `getBook`.
3. Click **Save**.

#### Add DELETE /books/{bookId} → deleteBook

1. Select `/{bookId}`, click **Create method** → **DELETE**.
2. Lambda proxy integration enabled, **Lambda function**: `deleteBook`.
3. Click **Save**.

#### Create `/books/{bookId}/reviews`

1. Select `/{bookId}`, click **Create resource**.
   - **Resource name**: `reviews`
   - **Resource path**: `reviews`
   - Click **Create resource**.

#### Add GET /books/{bookId}/reviews → getReviews

1. Select `/reviews`, click **Create method** → **GET**.
2. Lambda proxy integration enabled, **Lambda function**: `getReviews`.
3. Click **Save**.

#### Add POST /books/{bookId}/reviews → createReview

1. Select `/reviews`, click **Create method** → **POST**.
2. Lambda proxy integration enabled, **Lambda function**: `createReview`.
3. Click **Save**.

### 4b. Deploy to the `dev` Stage

1. Click **Deploy API** (top of the Actions menu or the Deploy button).
2. Under **Deployment stage**, select **[New Stage]**.
   - **Stage name**: `dev`
3. Click **Deploy**.
4. Copy the **Invoke URL** shown — it will look like:
   ```
   https://<api-id>.execute-api.<region>.amazonaws.com/dev
   ```

---

## API Endpoints

| Method | Path                          | Lambda function | Description            |
|--------|-------------------------------|-----------------|------------------------|
| POST   | `/books`                      | createBook      | Create a new book      |
| GET    | `/books`                      | getBooks        | List all books         |
| GET    | `/books/{bookId}`             | getBook         | Get a single book      |
| DELETE | `/books/{bookId}`             | deleteBook      | Delete a book          |
| POST   | `/books/{bookId}/reviews`     | createReview    | Add a review to a book |
| GET    | `/books/{bookId}/reviews`     | getReviews      | List reviews for a book|

---

## Testing

Set your base URL once:

```bash
BASE_URL="https://<api-id>.execute-api.<region>.amazonaws.com/dev"
```

---

### POST /books — Create a book

**Request**
```bash
curl -X POST "$BASE_URL/books" \
  -H "Content-Type: application/json" \
  -d '{"title":"The Pragmatic Programmer","author":"David Thomas","genre":"Technology"}'
```

**Response — 201 Created**
```json
{
  "bookId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "The Pragmatic Programmer",
  "author": "David Thomas",
  "genre": "Technology",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error — 400 Bad Request** (missing fields)
```json
{ "message": "title, author, and genre are required" }
```

---

### GET /books — List all books

**Request**
```bash
curl "$BASE_URL/books"
```

**Response — 200 OK**
```json
[
  {
    "bookId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "The Pragmatic Programmer",
    "author": "David Thomas",
    "genre": "Technology",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### GET /books/{bookId} — Get a single book

**Request**
```bash
BOOK_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
curl "$BASE_URL/books/$BOOK_ID"
```

**Response — 200 OK**
```json
{
  "bookId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "The Pragmatic Programmer",
  "author": "David Thomas",
  "genre": "Technology",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error — 404 Not Found**
```json
{ "message": "Book not found" }
```

---

### DELETE /books/{bookId} — Delete a book

**Request**
```bash
BOOK_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
curl -X DELETE "$BASE_URL/books/$BOOK_ID"
```

**Response — 200 OK**
```json
{ "message": "Book a1b2c3d4-e5f6-7890-abcd-ef1234567890 deleted successfully" }
```

---

### POST /books/{bookId}/reviews — Create a review

**Request**
```bash
BOOK_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
curl -X POST "$BASE_URL/books/$BOOK_ID/reviews" \
  -H "Content-Type: application/json" \
  -d '{"reviewerName":"Jane Smith","rating":5,"comment":"An essential read for every developer."}'
```

**Response — 201 Created**
```json
{
  "reviewId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
  "bookId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reviewerName": "Jane Smith",
  "rating": 5,
  "comment": "An essential read for every developer.",
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

**Error — 400 Bad Request** (invalid rating)
```json
{ "message": "rating must be a number between 1 and 5" }
```

---

### GET /books/{bookId}/reviews — Get reviews for a book

**Request**
```bash
BOOK_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
curl "$BASE_URL/books/$BOOK_ID/reviews"
```

**Response — 200 OK**
```json
[
  {
    "reviewId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "bookId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "reviewerName": "Jane Smith",
    "rating": 5,
    "comment": "An essential read for every developer.",
    "createdAt": "2024-01-15T11:00:00.000Z"
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
├── docs/
│   └── README.md         ← you are here
└── table-schemas.json
```

---

## IAM Role Summary

| Field          | Value                          |
|----------------|--------------------------------|
| Role name      | `lambda-book-review-role`      |
| Trusted entity | `lambda.amazonaws.com`         |
| Policies       | `AWSLambdaBasicExecutionRole`, `AmazonDynamoDBFullAccess` |
