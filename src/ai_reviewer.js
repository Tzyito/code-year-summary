import fs from "fs/promises";
import path from "path";
import ora from "ora";
import chalk from "chalk";
import dayjs from "dayjs";
import { prompts } from "./prompt.js";
import AIService from "./services/ai-service.js";

// summary generator
export default class AIReviewer {
  constructor(options) {
    this.aiService = new AIService(options);
    this.options = options;
  }

  async checkModelAvailability() {
    if (this.options.type !== "ollama") {
      return true;
    }

    const spinner = ora("Checking model availability...").start();

    try {
      const response = await fetch(`${this.baseUrl}/tags`);

      if (!response.ok) {
        spinner.fail("Failed to fetch available models");
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      const availableModels = data.models || [];

      console.log(chalk.blue("\nAvailable models:"));
      console.log(availableModels.map((m) => `- ${m.name}`).join("\n"));

      const isModelAvailable = availableModels.some((m) =>
        m.name.startsWith(this.options.model),
      );

      if (!isModelAvailable) {
        spinner.fail(`Model "${this.options.model}" is not available`);
        console.log(chalk.yellow("\nYou can pull the model using:"));
        console.log(chalk.cyan(`ollama pull ${this.options.model}`));
        throw new Error(`Model "${this.options.model}" is not available`);
      }

      spinner.succeed(`Model "${this.options.model}" is available`);
      return true;
    } catch (error) {
      spinner.fail("Model check failed");
      throw error;
    }
  }

  async generateSummary(diffDir, outputPath) {
    const spinner = ora("Reading diff files...").start();
    try {
      await this.checkModelAvailability();

      const files = await this.getAllFiles(diffDir);
      // 收集所有作者信息作为上下文
      const authorContext = [];
      for (const file of files) {
        const fileContent = await fs.readFile(file, "utf8");
        authorContext.push(fileContent);
      }

      spinner.succeed("Preparing AI summary...");

      const prompt = this.createPrompt(JSON.stringify(authorContext, null, 2));
      // write prompt for testing
      const promptFileName = path.join(
        outputPath,
        `prompt-${dayjs().format("YYYY-MM-DD HH:mm:ss")}.txt`,
      );
      await fs.writeFile(promptFileName, prompt, "utf8");
      console.log(
        chalk.blue(`\nPrompt saved to ${promptFileName} for testing`),
      );

      const spinner2 = ora("Generating AI summary...").start();
      const response = await this.aiService.generateReview(prompt);
      spinner2.succeed("AI summary generated");
      // ensure output directory exists
      await fs.mkdir(outputPath, { recursive: true });

      const fileName = path.join(
        outputPath,
        `summary-${dayjs().format("YYYY-MM-DD HH:mm:ss")}.md`,
      );
      // write summary to file
      const spinner3 = ora("Writing summary to file...").start();
      try {
        await fs.writeFile(fileName, response, "utf8");
        spinner3.succeed(`Summary saved to ${fileName}`);
        console.log(
          chalk.green(
            "\n✨ Code review summary has been generated successfully!",
          ),
        );
      } catch (error) {
        spinner3.fail("Failed to write summary file");
        throw error;
      }

      return response;
    } catch (error) {
      spinner.fail("Error generating summary");
      throw error;
    }
  }

  async getAllFiles(dir) {
    const files = await fs.readdir(dir, { recursive: true });
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.join(dir, file));
  }

  createPrompt(diffData) {
    return prompts[this.options.style].replace("{ctx}", diffData);
  }

  generateProjectSummary(diffData) {
    return diffData.reduce((summary, file) => {
      summary.totalFiles = (summary.totalFiles || 0) + 1;
      summary.totalCommits =
        (summary.totalCommits || 0) + file.summary.totalCommits;
      summary.totalAdditions =
        (summary.totalAdditions || 0) + file.summary.totalAdditions;
      summary.totalDeletions =
        (summary.totalDeletions || 0) + file.summary.totalDeletions;
      return summary;
    }, {});
  }

  // deprecated
  async getAIResponse(prompt) {
    const spinner = ora("Generating AI response...").start();

    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: "POST",
        body: JSON.stringify({
          model: this.options.model,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      spinner.succeed("AI analysis completed");
      console.log("\nAI Summary:");
      console.log(chalk.cyan("----------------------------------------"));

      // const reader = response.body.getReader();
      // const decoder = new TextDecoder();
      // let fullText = '';
      // while (true) {
      //   const { done, value } = await reader.read();
      //   if (done) break;

      //   const chunk = decoder.decode(value);
      //   const lines = chunk.split('\n').filter(Boolean);

      //   for (const line of lines) {
      //     try {
      //       const data = JSON.parse(line);
      //       process.stdout.write(data.response);
      //     } catch (e) {
      //       console.error('Error parsing JSON:', e);
      //     }
      //   }
      // }
      const spinner2 = ora("Reading AI response...").start();
      const data = await response.json();
      spinner2.succeed("AI response read");
      console.log(chalk.cyan("\n----------------------------------------"));
      console.log(data);
      console.log(chalk.cyan("\n----------------------------------------"));
      return { response: data.response };
    } catch (error) {
      spinner.fail("AI analysis failed");
      throw error;
    }
  }
}
