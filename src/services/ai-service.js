import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import Ollama from 'ollama'

export default class AIService {
    constructor(options) {
        this.type = options.type;
        this.apiKey = options.apiKey;
        this.model = options.model;
        this.baseUrl = options.baseUrl;
        this.client = this.initializeClient();
    }

    initializeClient() {
        switch (this.type) {
            case "ollama":
                return new Ollama({
                    baseURL: this.baseUrl || 'http://localhost:11434',
                    apiKey: this.apiKey,
                });
            case "openai":
                return new OpenAI({
                    baseURL: this.baseUrl || 'https://api.openai.com/v1',
                    apiKey: this.apiKey,
                });
            case "claude":
                return new Anthropic({
                    baseURL: this.baseUrl || 'https://api.anthropic.com',
                    apiKey: this.apiKey,
                });
            default:
                throw new Error(`Unsupported AI service type: ${this.type}`);
        }
    }

    async generateReview(prompt) {
        try {
            switch (this.type) {
                case "ollama":
                    const ollamaResponse = await this.client.generate({
                        model: this.model,
                        prompt,
                        stream: false,
                    });
                    if (!ollamaResponse.ok) {
                        throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);
                    }
                    const data = await ollamaResponse.json();
                    return data.response;

                case "openai":
                    const openaiResponse = await this.client.chat.completions.create({
                        model: this.model || 'gpt-4o-mini',
                        messages: [{ role: "system", content: prompt }],
                    });
                    return openaiResponse.choices[0].message.content;

                case "claude":
                    const claudeResponse = await this.client.messages.create({
                        model: this.model || 'claude-3-5-sonnet-20241022',
                        system: prompt,
                        messages: [{ role: "user", content: "Generate the review now." }],
                    });
                    return JSON.parse(claudeResponse).content[0]?.text;

                default:
                    throw new Error(`Unsupported AI service type: ${this.type}`);
            }
        } catch (error) {
            console.log(error);
            throw new Error(`AI service [${this.type}] call failed: ${error.message}`);
        }
    }
}
