# 🚀 Code Year Summary

## 🌟 Overview

Code Year Summary is an intelligent CLI tool that transforms your yearly coding journey into an insightful, AI-powered review. It's like having a personal code therapist who analyzes your git commits and provides a comprehensive summary of your programming adventures!

## 🔧 Features

- 🔍 Comprehensive Git History Analysis
- 🤖 AI-Powered Code Review
- 📊 Detailed Insights into Your Coding Year
- 🌈 Multiple AI Service Support (Ollama, OpenAI, Claude)

## 🚀 Usage

## Basic usage
```bash
code-year-summary -a "git commit user name" -t openai -k YOUR_API_KEY
```
## Specify project path
```bash
code-year-summary -p /path/to/your/project -a "git commit user name" -t claude -k YOUR_API_KEY
```
## Choose summary style
```bash
code-year-summary -a "git commit user name" -t ollama -m llama2 -s encourage
```
## Specify include and exclude file pattern
```bash
code-year-summary -a "git commit user name" -t ollama -m llama2 -s encourage -i "^src" -e "node_modules"
```

## 🛠 Options

- `-p, --path`: Project path (default: current directory)
- `-a, --author`: Git commit author name (default: current git user name)
- `-t, --type`: AI service (ollama/openai/claude) (default: ollama)
- `-m, --model`: Specific AI model
- `-k, --api-key`: AI service API key
- `-s, --style`: Summary style (crazy/encourage) (default: crazy)
- `-b, --base-url`: AI service base url (default: ollama/http://localhost:11434, openai/https://api.openai.com/v1, claude/https://api.anthropic.com)
- `-i, --include`: Specify the include file pattern
- `-e, --exclude`: Specify the exclude file pattern

## 🌈 Supported AI Services

- Ollama
- OpenAI
- Anthropic

## 📋 Requirements

- Node.js 18+
- Git
- API Key for online AI services

## 🎉 Example Output

The tool generates a markdown file with:
- Total commits
- Code additions/deletions
- Key project milestones
- AI-generated insights and recommendations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 🌟 Motivation

Inspired by the desire to help developers reflect on their coding journey and grow professionally.

## 💡 Tips

- Ensure you have a stable internet connection
- Keep your API keys secure
- Choose the right AI model for your needs

Enjoy your coding year review! 🚀👩‍💻👨‍💻
