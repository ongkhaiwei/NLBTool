import {
    BaseToolOptions,
    BaseToolRunOptions,
    Tool,
    ToolInput,
    JSONToolOutput,
    ToolError,
    ToolEmitter,
} from "bee-agent-framework/tools/base";
import { z } from "zod";
import { GetRunContext } from "bee-agent-framework/context";
import { Callback, Emitter } from "bee-agent-framework/emitter/emitter";
import dotenv from "dotenv";
dotenv.config();

type ToolOptions = BaseToolOptions & { maxResults?: number };
type ToolRunOptions = BaseToolRunOptions;

const header = {
    "X-Api-Key": process.env.NLB_API_KEY,
    "X-App-Code": process.env.NLB_APP_CODE,
};

export interface NLBResponse {
    totalRecords: number;
    count: number;
    hasMoreRecords: boolean,
    nextRecordsOffset: number,
    setId: number,
    titles: [];
}

export class NLBToolOutput extends JSONToolOutput<NLBResponse> {
    isEmpty(): boolean {
        return !this.result || this.result.totalRecords === 0 || this.result.titles.length === 0;
    }
}

export class NLBTool extends Tool<NLBToolOutput, ToolOptions, ToolRunOptions> {
    name = "NLB";
    description =
        "Provides access to Singapore National Library of resources with information about titles, authors, contributors, publication dates, publisher and isbn.";

    inputSchema() {
        return z
            .object({
                title: z.string(),
                author: z.string(),
                isbn: z.string(),
                subject: z.string(),
                keyword: z.string(),
                publisher: z.string(),
            })
            .partial();
    }

    public readonly emitter: ToolEmitter<
        ToolInput<this>,
        NLBToolOutput,
        {
            beforeFetch: Callback<{ request: { url: string; options: RequestInit } }>;
            afterFetch: Callback<{ data: NLBResponse }>;
        }
    > = Emitter.root.child({
        namespace: ["tool", "search", "NLB"],
        creator: this,
    });

    static {
        this.register();
    }

    protected async _run(
        input: ToolInput<this>,
        _options: Partial<ToolRunOptions>,
        run: GetRunContext<this>,
    ) {

        const request = {
            url: `https://openweb.nlb.gov.sg/api/v2/Catalogue/GetTitles?Limit=20&${new URLSearchParams(input).toString()}`,
            options: {
                signal: run.signal,
                headers: header
            } as RequestInit,
        };

        await run.emitter.emit("beforeFetch", { request });
        const response = await fetch(request.url, request.options);

        if (!response.ok) {
            throw new ToolError(
                "Request to NLB API has failed!",
                [new Error(await response.text())],
                {
                    context: { input },
                },
            );
        }
        const json: NLBResponse = await response.json();

        await run.emitter.emit("afterFetch", { data: json });
        return new NLBToolOutput(json);
    }
}