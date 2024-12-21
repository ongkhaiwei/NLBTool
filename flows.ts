import dotenv from "dotenv";
dotenv.config();
import { WatsonXChatLLM } from "bee-agent-framework/adapters/watsonx/chat";
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { TokenMemory } from "bee-agent-framework/memory/tokenMemory";
import { FrameworkError } from "bee-agent-framework/errors"
import { NLBTool } from "./NLB.ts";

const model_id = process.env.MODEL_ID;

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
  ]
});


async function main() {

  let chatQuestion = "I would like to borrow a book with title why nations fail"
  let prompt = chatQuestion

  const response = await agent
    .run({ prompt: prompt },
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
      emitter.on("error", ({ error }) => {
        console.log(`Agent 🤖 : `, FrameworkError.ensure(error).dump());
      });
    });

  console.log(`Agent 🤖 : `, response.result.text);

}
main().catch(console.error);