/**
 * Syntactika - Application Core Orchestrator
 * Manages shared state, view routing, themes, and data loading.
 */

class Application {
  constructor() {
    this.corpus = null;
    this.roots = null;
    this.currentView = 'dashboard';
    this.theme = 'dark';
    
    // Resilient Fallback Data (in case compilation hasn't run yet)
    this.fallbackCorpus = {
      "metadata": { "total_sentences": 3, "books": ["Alice in Wonderland", "Sherlock Holmes", "Pride and Prejudice"] },
      "sentences": [
        {
          "id": "alice_in_wonderland_1",
          "text": "Alice was beginning to get very tired of sitting by her sister.",
          "book": "Alice in Wonderland",
          "tokens": [
            {"index": 0, "text": "Alice", "lemma": "alice", "pos": "PROPN", "tag": "NNP", "dep": "nsubj", "head": 2, "explanation": "nominal subject", "root_link": null},
            {"index": 1, "text": "was", "lemma": "be", "pos": "AUX", "tag": "VBD", "dep": "aux", "head": 2, "explanation": "auxiliary", "root_link": null},
            {"index": 2, "text": "beginning", "lemma": "begin", "pos": "VERB", "tag": "VBG", "dep": "ROOT", "head": 2, "explanation": "root verb", "root_link": null},
            {"index": 3, "text": "to", "lemma": "to", "pos": "PART", "tag": "TO", "dep": "aux", "head": 4, "explanation": "infinitival to", "root_link": null},
            {"index": 4, "text": "get", "lemma": "get", "pos": "VERB", "tag": "VB", "dep": "xcomp", "head": 2, "explanation": "open clausal complement", "root_link": null},
            {"index": 5, "text": "very", "lemma": "very", "pos": "ADV", "tag": "RB", "dep": "advmod", "head": 6, "explanation": "adverbial modifier", "root_link": null},
            {"index": 6, "text": "tired", "lemma": "tired", "pos": "ADJ", "tag": "JJ", "dep": "acomp", "head": 4, "explanation": "adjectival complement", "root_link": null},
            {"index": 7, "text": "of", "lemma": "of", "pos": "ADP", "tag": "IN", "dep": "prep", "head": 6, "explanation": "prepositional modifier", "root_link": null},
            {"index": 8, "text": "sitting", "lemma": "sit", "pos": "VERB", "tag": "VBG", "dep": "pcomp", "head": 7, "explanation": "complement of preposition", "root_link": null},
            {"index": 9, "text": "by", "lemma": "by", "pos": "ADP", "tag": "IN", "dep": "prep", "head": 8, "explanation": "prepositional modifier", "root_link": null},
            {"index": 10, "text": "her", "lemma": "she", "pos": "PRON", "tag": "PRP$", "dep": "poss", "head": 11, "explanation": "possessive determiner", "root_link": null},
            {"index": 11, "text": "sister", "lemma": "sister", "pos": "NOUN", "tag": "NN", "dep": "pobj", "head": 9, "explanation": "object of preposition", "root_link": null}
          ],
          "grammar_tags": ["Intransitive", "Aspectual Complement"]
        },
        {
          "id": "sherlock_holmes_1",
          "text": "To Sherlock Holmes she is always the woman.",
          "book": "Sherlock Holmes",
          "tokens": [
            {"index": 0, "text": "To", "lemma": "to", "pos": "ADP", "tag": "IN", "dep": "prep", "head": 5, "explanation": "prepositional modifier", "root_link": null},
            {"index": 1, "text": "Sherlock", "lemma": "sherlock", "pos": "PROPN", "tag": "NNP", "dep": "compound", "head": 2, "explanation": "noun compound modifier", "root_link": null},
            {"index": 2, "text": "Holmes", "lemma": "holmes", "pos": "PROPN", "tag": "NNP", "dep": "pobj", "head": 0, "explanation": "object of preposition", "root_link": null},
            {"index": 3, "text": "she", "lemma": "she", "pos": "PRON", "tag": "PRP", "dep": "nsubj", "head": 5, "explanation": "nominal subject", "root_link": null},
            {"index": 4, "text": "is", "lemma": "be", "pos": "AUX", "tag": "VBZ", "dep": "ROOT", "head": 4, "explanation": "copula root verb", "root_link": null},
            {"index": 5, "text": "always", "lemma": "always", "pos": "ADV", "tag": "RB", "dep": "advmod", "head": 4, "explanation": "adverbial modifier", "root_link": null},
            {"index": 6, "text": "the", "lemma": "the", "pos": "DET", "tag": "DT", "dep": "det", "head": 7, "explanation": "determiner", "root_link": null},
            {"index": 7, "text": "woman", "lemma": "woman", "pos": "NOUN", "tag": "NN", "dep": "attr", "head": 4, "explanation": "attribute (subject complement)", "root_link": "mono"}
          ],
          "grammar_tags": ["Intransitive", "Copular Predicate"]
        },
        {
          "id": "pride_and_prejudice_1",
          "text": "It is a truth universally acknowledged.",
          "book": "Pride and Prejudice",
          "tokens": [
            {"index": 0, "text": "It", "lemma": "it", "pos": "PRON", "tag": "PRP", "dep": "nsubj", "head": 1, "explanation": "nominal subject", "root_link": null},
            {"index": 1, "text": "is", "lemma": "be", "pos": "AUX", "tag": "VBZ", "dep": "ROOT", "head": 1, "explanation": "copula root verb", "root_link": null},
            {"index": 2, "text": "a", "lemma": "a", "pos": "DET", "tag": "DT", "dep": "det", "head": 3, "explanation": "determiner", "root_link": null},
            {"index": 3, "text": "truth", "lemma": "truth", "pos": "NOUN", "tag": "NN", "dep": "attr", "head": 1, "explanation": "attribute", "root_link": null},
            {"index": 4, "text": "universally", "lemma": "universally", "pos": "ADV", "tag": "RB", "dep": "advmod", "head": 5, "explanation": "adverbial modifier", "root_link": "poly"},
            {"index": 5, "text": "acknowledged", "lemma": "acknowledge", "pos": "VERB", "tag": "VBN", "dep": "acl", "head": 3, "explanation": "adjectival clause modifier", "root_link": null}
          ],
          "grammar_tags": ["Passive Modifier", "Copular Predicate"]
        }
      ]
    };

    this.fallbackRoots = {
      "roots": [
        {
          "root": "mono",
          "origin": "Greek",
          "meaning": "one, single, alone",
          "examples": ["monologue", "monopoly", "monotonous", "monochrome", "monastery", "monarch"],
          "description": "Derived from Greek 'monos', meaning single, alone, or solitary. Denotes singular ownership, speech, or form.",
          "corpus_usages": [
            {"sentence_id": "sherlock_holmes_1", "sentence_text": "To Sherlock Holmes she is always the woman.", "word_used": "woman", "word_lemma": "woman", "book": "Sherlock Holmes"}
          ]
        },
        {
          "root": "poly",
          "origin": "Greek",
          "meaning": "many, much",
          "examples": ["polygon", "polytheism", "polynomial", "polymer", "polymath", "polygamy"],
          "description": "Derived from Greek 'polys', meaning many or multiple. Found in terms describing multiplicity, diversity, or compounds.",
          "corpus_usages": [
            {"sentence_id": "pride_and_prejudice_1", "sentence_text": "It is a truth universally acknowledged.", "word_used": "universally", "word_lemma": "universally", "book": "Pride and Prejudice"}
          ]
        }
      ]
    };
  }

  /**
   * Initializes the application. Loads styles, checks theme, fetches JSON databases.
   */
  async init() {
    this.setupTheme();
    await this.loadData();
    
    // Initialize child tools
    syntaxTool.init(this.corpus);
    etymologyTool.init(this.roots);

    this.updateDashboardStats();
  }

  /**
   * Set up theme based on user preferences and localStorage cache
   */
  setupTheme() {
    const cachedTheme = localStorage.getItem('theme') || 'dark';
    this.theme = cachedTheme;
    document.body.className = `${cachedTheme}-mode`;
  }

  /**
   * Toggle between dark-mode and light-mode classes on the body
   */
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.body.className = `${this.theme}-mode`;
    localStorage.setItem('theme', this.theme);
    
    // Trigger canvas redraws in child tools if needed to handle color contrast changes
    if (this.currentView === 'syntax') {
      syntaxTool.drawTree();
    }
  }

  /**
   * Asynchronously fetches literature corpus and roots JSON databases.
   * Falls back gracefully to localized structures if the HTTP requests fail.
   */
  async loadData() {
    try {
      const corpusResponse = await fetch('data/corpus.json');
      if (corpusResponse.ok) {
        this.corpus = await corpusResponse.json();
        console.log('Corpus data loaded successfully via HTTP fetch');
      } else {
        throw new Error('HTTP Status ' + corpusResponse.status);
      }
    } catch (e) {
      console.warn('Failed to fetch corpus.json (' + e.message + '). Loading robust localized fallback corpus.');
      this.corpus = this.fallbackCorpus;
    }

    try {
      const rootsResponse = await fetch('data/roots.json');
      if (rootsResponse.ok) {
        this.roots = await rootsResponse.json();
        console.log('Etymology roots loaded successfully via HTTP fetch');
      } else {
        throw new Error('HTTP Status ' + rootsResponse.status);
      }
    } catch (e) {
      console.warn('Failed to fetch roots.json (' + e.message + '). Loading robust localized fallback roots.');
      this.roots = this.fallbackRoots;
    }
  }

  /**
   * Updates display statistics on the dashboard landing page
   */
  updateDashboardStats() {
    const sentCount = this.corpus.sentences.length;
    const rootCount = this.roots.roots.length;

    document.getElementById('statSentences').textContent = sentCount;
    document.getElementById('statRoots').textContent = rootCount;
  }

  /**
   * Handles switching views with smooth visual fade-ins
   */
  switchView(viewName) {
    if (viewName === this.currentView) return;

    // Toggle navigation classes
    const buttons = {
      'dashboard': 'navBtnDashboard',
      'syntax': 'navBtnSyntax',
      'etymology': 'navBtnEtymology'
    };

    // Remove active from all navigation buttons
    Object.values(buttons).forEach(id => {
      document.getElementById(id).classList.remove('active');
    });

    // Deactivate current view element
    const activeSection = document.querySelector('.view-section.active');
    if (activeSection) {
      activeSection.classList.remove('active');
    }

    // Activate selected navigation and view element
    const targetButton = document.getElementById(buttons[viewName]);
    if (targetButton) targetButton.classList.add('active');

    const targetSectionId = 'view' + viewName.charAt(0).toUpperCase() + viewName.slice(1);
    const targetSection = document.getElementById(targetSectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    this.currentView = viewName;

    // Specific tool transition callbacks
    if (viewName === 'syntax') {
      syntaxTool.drawTree();
    } else if (viewName === 'etymology') {
      // Auto select the first root if nothing is selected
      if (!etymologyTool.selectedRoot) {
        etymologyTool.selectRootByIndex(0);
      }
    }
  }
}

// Instantiate global app orchestrator
const app = new Application();

// Self-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
