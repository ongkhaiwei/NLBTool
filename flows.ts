import dotenv from "dotenv";
dotenv.config();
import { WatsonXChatLLM } from "bee-agent-framework/adapters/watsonx/chat";
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { TokenMemory } from "bee-agent-framework/memory/tokenMemory";
import { NLBTool } from "./NLB.ts";

const model_id = process.env.MODEL_ID;
//const model_id = 'ibm/granite-3-8b-instruct'

const llm = WatsonXChatLLM.fromPreset(model_id, {
  apiKey: process.env.IBMCLOUD_API_KEY,
  projectId: process.env.WATSONX_PROJECT_ID,
  parameters: {
    decoding_method: "greedy",
    max_new_tokens: 1000,
  },
});

const agent = new BeeAgent({
    llm,
    memory: new TokenMemory({ llm }),
    tools: [
        new NLBTool(),
    ]});


async function main() {

  let chatQuestion = "I would like to borrow a book with title The Silmarillion"
  let prompt = chatQuestion

  const response = await agent
    .run({ prompt: prompt },
    //.run({ prompt: "how many countries are there?" },
        {
            signal: AbortSignal.timeout(300 * 1000), // 1 minute timeout
            execution: {
            // How many times an agent may repeat the given step before it halts (tool call, llm call, ...)
            maxRetriesPerStep: 3,
        
            // How many retries can the agent occur before halting
            totalMaxRetries: 10,
        
            // Maximum number of iterations in which the agent must figure out the final answer
            maxIterations: 20,
            },
      })
    .observe((emitter) => {
      emitter.on("update", async ({ data, update, meta }) => {
        console.log(`Agent (${update.key}) 🤖 : `, update.value);
      });
    });

  console.log(`Agent 🤖 : `, response.result.text);

}
main().catch(console.error);