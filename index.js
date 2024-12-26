#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import GitAnalyzer from "./src/git_analyzer.js";
import AIReviewer from "./src/ai_reviewer.js";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";
dotenv.config();

program
  .name("code-year-summary")
  .description("Generate year-end code summary using git history and AI")
  .option("-p, --path <path>", "specify the project path", process.cwd())
  .option("-m, --model <model>", "specify the LLM model(If you use ollama, you can'n ignore this)")
  .requiredOption(
    "-a, --author <path>",
    "specify the commit author（if not specified, use current git user)",
    execSync("git config user.name", { encoding: "utf8" }).trim(),
  )
  .option("-s, --style <style>", "specify the summary style", "crazy")
  .option("-i, --include <include>", "specify the include file pattern")
  .option("-e, --exclude <exclude>", "specify the exclude file pattern")
  .requiredOption(
    "-t, --type <type>",
    "select ai service (ollama/openai/claude)",
    "ollama",
  )
  .option("-k, --api-key <key>", "online ai service API Key")
  .option("-b, --base-url <url>", "online ai service base url")
  .parse(process.argv);

const options = program.opts();

function validateOptions() {
  if (!options.output) {
    options.output = path.join(options.path, "report");
  }

  if (options.type === 'ollama' && !options.model) {
    console.error(chalk.red("Must provide Ollama model"));
    process.exit(1);
  }

  if (!options.model) {
    console.warn(chalk.yellow("Since you didn't choose an online model, the default model is gpt-4o-mini or claude-3-5-sonnet-20241022"));
    options.model = options.type === 'openai' ? "gpt-4o-mini" : "claude-3-5-sonnet-20241022";
  }

  if (!options.apiKey) {
    console.error(chalk.red("Must provide API key"));
    process.exit(1);
  }

  if (!["crazy", "encourage"].includes(options.style)) {
    console.warn(chalk.yellow(`Unsupported summary style: ${options.style}, using default style: crazy`));
    options.style = "crazy";
  }
}
async function main() {
  try {
    console.log(chalk.blue("\nStarting code year summary for:", options.path));
    // 1. 分析git历史
    const gitAnalyzer = new GitAnalyzer(options);
    const diffDir = await gitAnalyzer.analyzeProject();
    // 2. 使用AI生成总结
    const reviewer = new AIReviewer(options);
    await reviewer.generateSummary(diffDir, options.output);
  } catch (error) {
    console.error(chalk.red("\nError:", error.message));
    process.exit(1);
  }
}
validateOptions();
main();
