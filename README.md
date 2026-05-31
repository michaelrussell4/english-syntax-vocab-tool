# 🏛️ English Syntax & Vocabulary Learning Tool

A premium, interactive web application that bridges classic literature, natural language processing, and historical linguistics to teach English syntax and etymological vocabulary. Hosted entirely as a static site on GitHub Pages, the application features an immersive **Syntax Dependency Visualizer & Parser** powered by `spaCy` and an **Etymology Root Explorer** mapping Latin, Greek, and Germanic origins.

---

## ✨ Features

### 1. 🌲 Interactive English Syntax Visualizer
Unlock the grammatical skeletal structure of classic literature.
* **Literature Corpus**: Snippets pulled from classics such as *Alice in Wonderland*, *The Adventures of Sherlock Holmes*, and *Pride and Prejudice*.
* **Dynamic Dependency Graph**: Custom SVG rendering of grammatical dependency trees, displaying how subjects, verbs, objects, and modifiers connect.
* **Grammatical Highlighting**: Toggle-able highlighting of primary sentence parts (nouns, verbs, adjectives, adverbs, subjects, direct objects).
* **Syntax Detective Quizzes**: Gamified, interactive exercises prompting users to identify subjects, objects, or specifiers in rich context.

### 2. 🧬 Vocabulary Root & Etymology Explorer
Explore how modern English words are built from historical linguistic building blocks.
* **Root Taxonomy**: Deep dive into over 80 Latin, Greek, and Germanic/Saxon roots, prefixes, and suffixes.
* **Linguistic Derivation Mapping**: Beautiful visual trees showing modern English words branching from ancient root nodes.
* **Contextual Integration**: Words in the classic literature snippets are automatically linked to their etymological roots. Clicking an eligible word reveals its linguistic ancestry!
* **Root Builder Quizzes**: Challenge your etymological deduction by matching roots to meanings or synthesizing words from component morphemes.

---

## 🛠️ Architecture & Tech Stack

The application employs a dual-stage architecture to deliver a zero-latency, high-performance static frontend while utilizing powerful Python NLP tools under the hood:

```mermaid
graph TD
    subgraph Build Phase (Python / spaCy)
        A[Classic Literature Raw Texts] --> C[spaCy English NLP Pipeline]
        B[Etymology Database JSON] --> D[Linguistic Mapper Script]
        C --> D
        D --> E[Processed Web Assets - corpus.json & roots.json]
    end

    subgraph Runtime Phase (Static Web App / GitHub Pages)
        E --> F[Dashboard Core Routing]
        F --> G[Interactive Syntax Visualizer / SVG Renderer]
        F --> H[Interactive Root Explorer / Word Tree]
        F --> I[Gamified Assessment Engines]
    end
```

### Backend / Build Tooling:
* **Python 3.13**: Modern, robust runtime.
* **spaCy (en_core_web_sm)**: Pre-compiled industrial-strength Natural Language Processing pipeline for part-of-speech (POS) tagging and dependency parsing.
* **uv**: Ultra-fast Python package and environment manager to orchestrate builds.

### Frontend:
* **Vanilla HTML5 & ES6+ JavaScript**: Clean, framework-free client codebase for blazing-fast page loads and full control over interactive rendering.
* **Premium CSS3**: Built with visual excellence featuring high-contrast typography (*Inter* and *Playfair Display*), gorgeous HSL color palettes, standard-setting glassmorphism, responsive CSS Grid/Flexbox layouts, and buttery-smooth micro-animations. No Tailwind is used to keep styling custom, ultra-lightweight, and pixel-perfect.
* **SVG Rendering Pipeline**: High-performance, dynamically resizing canvas for drawing bezier-curve dependency arcs and linguistic structural graphs.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Python 3.13](https://www.python.org/) and [uv](https://github.com/astral-sh/uv) installed.

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/english-syntax-vocab-tool.git
   cd english-syntax-vocab-tool
   ```

2. **Set up the Python virtual environment and install dependencies:**
   ```bash
   uv sync
   ```

3. **Download the spaCy pipeline model:**
   ```bash
   uv run python -m spacy download en_core_web_sm
   ```

4. **Run the build-time compiler to generate the static datasets:**
   ```bash
   uv run python scripts/process_corpus.py
   ```

5. **Launch a local server to view the app:**
   You can serve the static frontend using Python's built-in HTTP server:
   ```bash
   python -m http.server --directory web 8000
   ```
   Now navigate to `http://localhost:8000` in your browser!

---

## 🏗️ Project Structure

```
english-syntax-vocab-tool/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD to build & deploy to Pages
├── data/
│   ├── raw_literature/         # Classic text source snippets
│   └── etymology_db.json       # Structured roots dictionary
├── scripts/
│   ├── process_corpus.py       # Core spaCy extractor and static JSON compiler
│   └── download_literature.py  # Utility to pull raw books from Project Gutenberg
├── web/
│   ├── index.html              # Central application dashboard & hub
│   ├── css/
│   │   └── styles.css          # Core custom styles (typography, dark mode, layout)
│   ├── js/
│   │   ├── app.js              # Application core, routing, data-loader
│   │   ├── syntax-tool.js      # Syntax SVG renderer and grammar quiz engine
│   │   └── etymology-tool.js   # Word tree builder and root matching quiz
│   └── data/                   # Output directory for compiled JSON database files
├── pyproject.toml              # Project dependencies and metadata
└── README.md                   # This overview
```

---

## 🌐 Deployment to GitHub Pages

This project is fully automated for hosting on **GitHub Pages**. A custom GitHub Action `.github/workflows/deploy.yml` triggers on every push to the `main` branch. 

The action:
1. Provisions a secure Ubuntu build runner.
2. Installs `uv` and builds the Python 3.13 environment.
3. Automatically downloads the `spaCy` NLP pipeline.
4. Compiles the classic literature texts and maps the etymologies, writing `corpus.json` and `roots.json` inside the web directory.
5. Deploys the finalized `web/` assets directly to GitHub Pages!
