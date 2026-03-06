# Book Review API

A serverless REST API for managing books and their reviews, built with AWS Lambda, API Gateway, and DynamoDB.

## Project Overview

This is a fully serverless application that allows users to:
- Create, retrieve, and delete books
- Create and retrieve reviews for books
- Query reviews efficiently by book ID

The API is built with Node.js 22.x using ES Modules and runs entirely on AWS managed services, requiring no server infrastructure to maintain.

## Architecture

```
┌──────────────────────────────────────────┐
│          API Gateway (REST API)          │
│              Regional Stage               │
└──────┬──────────┬──────────┬─────────────┘
       │          │          │
       ▼          ▼          ▼
   /books      /books/{id}  /reviews
   (POST)      (GET)        (GET/POST)
   (GET)       (DELETE)
       │          │          │
       ▼          ▼          ▼
┌──────────────────────────────────────────┐
│          AWS Lambda Functions            │
│  - createBook          - createReview    │
│  - getBook             - getReviews      │
│  - getBooks            - deleteBook      │
│      (Node.js 22.x, ES Modules)          │
└──────────────────┬───────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │       DynamoDB       │
        │  Books & Reviews     │
        └──────────────────────┘
```

## Database Schema

### Books Table
- **Table Name**: `Books`
- **Partition Key**: `bookId` (String)
- **Billing Mode**: On-Demand (Pay-per-request)
- **Attributes**:
  - `bookId`: Unique identifier (UUID)
  - `title`: Book title
  - `author`: Author name
  - `genre`: Book genre
  - `createdAt`: ISO 8601 timestamp

### Reviews Table
- **Table Name**: `Reviews`
- **Partition Key**: `reviewId` (String)
- **Billing Mode**: On-Demand (Pay-per-request)
- **Global Secondary Index**: `bookId-index`
  - Allows efficient querying of all reviews for a specific book
- **Attributes**:
  - `reviewId`: Unique identifier (UUID)
  - `bookId`: Reference to Books table (GSI Partition Key)
  - `reviewerName`: Name of the reviewer
  - `rating`: Numeric rating (1–5)
  - `comment`: Review text
  - `createdAt`: ISO 8601 timestamp

## API Endpoints

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| POST | `/books` | `createBook` | Create a new book |
| GET | `/books` | `getBooks` | Get all books |
| GET | `/books/{id}` | `getBook` | Get a specific book by ID |
| DELETE | `/books/{id}` | `deleteBook` | Delete a book by ID |
| POST | `/books/{id}/reviews` | `createReview` | Create a review for a book |
| GET | `/books/{id}/reviews` | `getReviews` | Get all reviews for a book |

## Lambda Functions

All Lambda functions are located in `book-review-api/functions/`:

- **createBook** (`createBook/index.mjs`): Creates a new book with title, author, and genre
- **getBooks** (`getBooks/index.mjs`): Scans and returns all books from the Books table
- **getBook** (`getBook/index.mjs`): Retrieves a single book by ID
- **deleteBook** (`deleteBook/index.mjs`): Deletes a book and its associated reviews
- **createReview** (`createReview/index.mjs`): Creates a review linked to a specific book
- **getReviews** (`getReviews/index.mjs`): Queries reviews by book ID using the GSI

All functions use:
- AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- ES Module syntax
- Standard error handling with HTTP response codes

## Project Structure

```
book-review-api/
├── table-schemas.json        # DynamoDB table definitions and schema
├── docs/
│   └── README.md             # Detailed setup and deployment guide
└── functions/
    ├── createBook/
    ├── createReview/
    ├── deleteBook/
    ├── getBook/
    ├── getBooks/
    └── getReviews/
```

## Key Technologies

- **Runtime**: Node.js 22.x
- **Module System**: ES Modules (`.mjs` files)
- **AWS Services**:
  - Lambda (Function compute)
  - API Gateway (REST API management)
  - DynamoDB (NoSQL database)
  - IAM (Access control)
- **AWS SDK**: Version 3 (modular, tree-shakeable)

## Setup & Deployment

For detailed setup instructions including DynamoDB table creation, IAM role configuration, Lambda function deployment, and API Gateway setup, see [book-review-api/docs/README.md](book-review-api/docs/README.md).

## Development Notes

- All Lambda functions follow a consistent error handling pattern
- DynamoDB uses on-demand billing mode for cost optimization
- The Reviews table uses a Global Secondary Index to enable efficient lookups by book ID
- Each resource (book, review) is assigned a UUID for unique identification
- Timestamps are stored in ISO 8601 format for consistency and compatibility
