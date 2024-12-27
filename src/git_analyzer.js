import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import ora from "ora";
import { ensureDirectoryExists } from "./utils.js";

// analyze git history
export default class GitAnalyzer {
  constructor(options) {
    this.options = options;
    this.baseOutputDir = path.join(options.path, "file_diff");
  }

  getFileChanges(filePath) {
    const currentYear = new Date().getFullYear();
    try {
      const command = `git log --since="${currentYear}-01-01" --author="${this.options.author}" --format="%H|%ad|%an|%s" --date=short -- "${filePath}"`;
      const output = execSync(command, { cwd: this.options.path })
        .toString()
        .trim();

      if (!output) {
        return {
          filePath,
          totalCommits: 0,
          changes: [],
        };
      }

      const commits = output.split("\n");
      const changes = commits.map((commit) => {
        const [hash, date, author, message] = commit.split("|");
        const diffCommand = `git show --format="" ${hash} -- "${filePath}"`;
        const diff = execSync(diffCommand, {
          cwd: this.options.path,
        }).toString();

        return {
          commit: { hash, date, author, message },
          changes: this.analyzeDiff(diff),
        };
      });

      return {
        filePath,
        totalCommits: commits.length,
        changes,
      };
    } catch (error) {
      return { filePath, error: error.message };
    }
  }

  analyzeDiff(diff) {
    const lines = diff.split("\n");
    const changes = {
      additions: [],
      deletions: [],
      modifications: [],
    };

    let lineNumber = 0;

    for (const line of lines) {
      if (
        line.startsWith("diff --git") ||
        line.startsWith("index") ||
        line.startsWith("---") ||
        line.startsWith("+++")
      ) {
        continue;
      }

      if (line.startsWith("@@")) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          lineNumber = parseInt(match[2]);
        }
        continue;
      }

      if (line.startsWith("+") && !line.startsWith("+++")) {
        changes.additions.push({
          line: lineNumber,
          content: line.substring(1),
        });
        lineNumber++;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        changes.deletions.push({
          content: line.substring(1),
        });
      } else if (line.startsWith(" ")) {
        lineNumber++;
      }
    }

    return changes;
  }

  generateChangeSummary(changes) {
    return {
      summary: {
        totalCommits: changes.totalCommits,
        totalAdditions: changes.changes.reduce(
          (sum, change) => sum + change.changes.additions.length,
          0,
        ),
        totalDeletions: changes.changes.reduce(
          (sum, change) => sum + change.changes.deletions.length,
          0,
        ),
      },
      commits: changes.changes.map((change) => ({
        date: change.commit.date,
        message: change.commit.message,
        author: change.commit.author,
        changes: {
          additions: change.changes.additions.length,
          deletions: change.changes.deletions.length,
          addedLines: change.changes.additions.map((a) => a.content),
          deletedLines: change.changes.deletions.map((d) => d.content),
        },
      })),
    };
  }

  getExecCommand(includePattern = '', excludePattern = '') {
    const safeInclude = includePattern
      .replace(/[^\w\s/.-]/g, '')
      .replace(/'/g, '')
      .trim();

    const safeExclude = excludePattern
      .replace(/[^\w\s/.-]/g, '')
      .replace(/'/g, '')
      .trim();
    let command = 'git ls-files';

    if (safeInclude) {
      command += ` | grep -E '${safeInclude}'`;
    }

    if (safeExclude) {
      command += ` | grep -vE '${safeExclude}'`;
    }

    return command;
  }

  async analyzeProject() {
    const spinner = ora("Analyzing git history...").start();

    try {
      const { success, _path } = await ensureDirectoryExists(this.baseOutputDir);

      if (!success) {
        throw new Error(`Failed to create diff json root directory: ${_path}`);
      }
      const exclude = this.options.exclude;
      const include = this.options.include;
      const command = this.getExecCommand(include, exclude);
      const files = execSync(command, { cwd: this.options.path })
        .toString()
        .split("\n")
        .filter(Boolean)
      for (const file of files) {
        const changes = this.getFileChanges(file);

        if (changes.totalCommits === 0) continue;

        const summary = this.generateChangeSummary(changes);
        const dirParts = file.split("/");
        const fileName = dirParts.pop();

        const outputDir = path.join(
          this.baseOutputDir,
          ...dirParts.map((part) => `${part}_diff`),
        );

        const { success: _success, _path: _outputDir } = await ensureDirectoryExists(outputDir);
        if (!_success) {
          throw new Error(`Failed to create diff json directory: ${_outputDir}`);
        }

        const outputPath = path.join(
          outputDir,
          `${path.parse(fileName).name}_diff.json`,
        );

        await fs.writeFile(
          outputPath,
          JSON.stringify(
            {
              fileInfo: {
                path: file,
                extension: path.extname(file),
              },
              ...summary,
            },
            null,
            2,
          ),
        );
      }

      spinner.succeed("Git history analysis completed");
      return this.baseOutputDir;
    } catch (error) {
      spinner.fail("Git history analysis failed");
      throw error;
    }
  }
}
