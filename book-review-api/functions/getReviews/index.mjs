import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const { bookId } = event.pathParameters || {};

    if (!bookId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "bookId path parameter is required" }),
      };
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: "Reviews",
        IndexName: "bookId-index",
        KeyConditionExpression: "bookId = :bookId",
        ExpressionAttributeValues: {
          ":bookId": bookId,
        },
      })
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.Items || []),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Failed to retrieve reviews", error: error.message }),
    };
  }
};
