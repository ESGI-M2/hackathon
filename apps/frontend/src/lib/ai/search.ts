import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { DefaultAzureCredential } from "@azure/identity";
import { embed } from "ai";
import { azure } from "@ai-sdk/azure";
import { createHash } from "crypto";

const embeddingModel = azure.textEmbeddingModel(process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME!);
const endpoint = process.env.AZURE_SEARCH_ENDPOINT!;
const indexName = process.env.AZURE_SEARCH_INDEX_NAME!;
const credential = process.env.AZURE_SEARCH_KEY
  ? new AzureKeyCredential(process.env.AZURE_SEARCH_KEY)
  : new DefaultAzureCredential();
const USER_AGENT_PREFIX = "vercel-nextjs-azs";

const searchClient = new SearchClient(
  endpoint,
  indexName,
  credential,
  {
    userAgentOptions: {
      userAgentPrefix: USER_AGENT_PREFIX,
    },
  }
);

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {

  const searchParameters: any = {
    top: 5,
    queryType: "simple",
  };

  if (process.env.AZURE_SEARCH_SEMANTIC_CONFIGURATION_NAME) {
    searchParameters.queryType = "semantic";
    searchParameters.semanticSearchOptions = {
      configurationName: process.env.AZURE_SEARCH_SEMANTIC_CONFIGURATION_NAME,
    };
  }

  if (process.env.AZURE_SEARCH_VECTOR_FIELD) {
    const userQueryEmbedded = await generateEmbedding(userQuery);
    searchParameters.vectorSearchOptions = {
      queries: [
        {
          kind: "vector",
          fields: [process.env.AZURE_SEARCH_VECTOR_FIELD],
          kNearestNeighborsCount: process.env.AZURE_SEARCH_SEMANTIC_CONFIGURATION_NAME ? 50 : 5,
          vector: userQueryEmbedded,
        },
      ],
    };
  }

  const searchResults = await searchClient.search(userQuery, searchParameters);

  const similarDocs = [];
  const contentColumn = process.env.AZURE_SEARCH_CONTENT_FIELD!;
  for await (const result of searchResults.results) {
    const textField = (result.document as any).hasOwnProperty(contentColumn) ? (result.document as any)[contentColumn] : result.document;
    const hash = createHash('sha256').update(textField).digest('base64').substring(0, 8);

    similarDocs.push({
      text: textField,
      id: hash,
      similarity: result.score,
    });
  }

  return similarDocs;
};
