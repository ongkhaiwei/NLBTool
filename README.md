# NLBTool

`NLBTool` is custom tool built based on [Bee Agent Framework](https://i-am-bee.github.io/bee-agent-framework/#/). 

The NLBTool class extends the Tool class and has a name and description property. It has an inputSchema method that defines the input schema for the tool, which includes properties for title, author, ISBN, subject, keyword, and publisher. The emitter property is an instance of the Emitter class that emits events before and after fetching data from the NLB API.

The _run method is an asynchronous function that takes input, options, and run as parameters. It constructs a request object with the URL and options for fetching data from the NLB API. It then emits the beforeFetch event, sends the request using the fetch function, and checks if the response is successful. If not, it throws a ToolError with an error message and the response text. If the response is successful, it parses the response body as JSON and emits the afterFetch event. Finally, it returns a new NLBToolOutput instance with the parsed JSON data.

This code can be used as a reference for creating an AI coding assistant that interacts with the NLB API.

## Singapore National Library API

To get the access to Singapore National Library API. Please visit [NLBlabs](https://www.nlb.gov.sg/main/partner-us/contribute-and-create-with-us/NLBLabs) to apply for the credential to access the API. 

## Test the NLBTool
To test the custom tool, `flows.ts` as a simple example of Bee Agent application to trigger NLBTool to perform the query.
```
npx tsx flows.ts