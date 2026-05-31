/**
 * Syntactika - Vocabulary Root & Etymology Explorer
 */

class EtymologyTool {
  constructor() {
    this.roots = null;
    this.filteredRoots = [];
    this.selectedRoot = null;
    this.originFilter = 'all';
    
    // Game State
    this.quizActive = false;
    this.quizScore = 0;
    this.quizCurrentIndex = 0;
    this.quizAnswered = false;
    this.quizQuestions = [];
  }

  /**
   * Initialize with compiled root etymology database
   */
  init(roots) {
    this.roots = roots;
    this.filteredRoots = [...roots.roots];
    
    this.renderRootsList();
    this.selectRootByIndex(0);
  }

  /**
   * Renders the sidebar index items representing historical roots
   */
  renderRootsList() {
    const container = document.getElementById('rootsListContainer');
    container.innerHTML = '';
    
    if (this.filteredRoots.length === 0) {
      container.innerHTML = '<span class="text-muted" style="font-size:12.5px; padding:12px;">No roots match your search filter.</span>';
      return;
    }
    
    this.filteredRoots.forEach((r, idx) => {
      const row = document.createElement('div');
      row.className = 'root-item-row';
      if (this.selectedRoot && this.selectedRoot.root === r.root) {
        row.classList.add('active');
      }
      
      // Text labels
      const textCol = document.createElement('div');
      textCol.className = 'root-item-text';
      
      const rootStr = document.createElement('strong');
      rootStr.textContent = r.root + '-';
      
      const meaningStr = document.createElement('span');
      meaningStr.textContent = r.meaning;
      
      textCol.appendChild(rootStr);
      textCol.appendChild(meaningStr);
      
      // Origin Dot Badge
      const badge = document.createElement('span');
      badge.className = `origin-dot ${r.origin.toLowerCase()}`;
      badge.textContent = r.origin.substring(0, 3);
      
      row.appendChild(textCol);
      row.appendChild(badge);
      
      // Selection Trigger
      row.onclick = () => {
        // Clear active classes
        document.querySelectorAll('.root-item-row').forEach(el => el.classList.remove('active'));
        row.classList.add('active');
        this.selectRoot(r);
      };
      
      container.appendChild(row);
    });
  }

  /**
   * Search / input text filtering callback
   */
  filterRoots() {
    const query = document.getElementById('rootSearchInput').value.toLowerCase();
    
    this.filteredRoots = this.roots.roots.filter(r => {
      const matchesOrigin = (this.originFilter === 'all' || r.origin === this.originFilter);
      const matchesQuery = r.root.toLowerCase().includes(query) || 
                           r.meaning.toLowerCase().includes(query) ||
                           r.description.toLowerCase().includes(query) ||
                           r.examples.some(ex => ex.toLowerCase().includes(query));
      return matchesOrigin && matchesQuery;
    });
    
    this.renderRootsList();
  }

  /**
   * Origin tags filters (Latin / Greek / Germanic)
   */
  setOriginFilter(origin) {
    this.originFilter = origin;
    
    // Toggle tab classes
    const tabs = {
      'all': 'tabOriginAll',
      'Latin': 'tabOriginLatin',
      'Greek': 'tabOriginGreek',
      'Germanic': 'tabOriginGermanic'
    };
    
    Object.keys(tabs).forEach(k => {
      const el = document.getElementById(tabs[k]);
      if (k === origin) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
    
    this.filterRoots();
  }

  /**
   * Public triggers to select roots from other interfaces
   */
  selectRootByName(rootName) {
    const rootObj = this.roots.roots.find(r => r.root === rootName);
    if (rootObj) {
      this.selectRoot(rootObj);
      this.renderRootsList();
      
      // Highlight in the scroll list
      setTimeout(() => {
        const rows = document.querySelectorAll('.root-item-row');
        rows.forEach(row => {
          const rootTextNode = row.querySelector('strong');
          if (rootTextNode && rootTextNode.textContent === rootName + '-') {
            row.classList.add('active');
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      }, 50);
    }
  }

  selectRootByIndex(idx) {
    if (this.filteredRoots.length > idx) {
      this.selectRoot(this.filteredRoots[idx]);
    }
  }

  /**
   * Load and visual render root detail specs
   */
  selectRoot(rootObj) {
    this.selectedRoot = rootObj;
    
    document.getElementById('rootPlaceholder').classList.add('hidden');
    const content = document.getElementById('rootContent');
    content.classList.remove('hidden');
    
    // Title details
    document.getElementById('rTitle').textContent = rootObj.root + '-';
    
    const originBadge = document.getElementById('rOrigin');
    originBadge.className = `badge badge-lg origin-dot ${rootObj.origin.toLowerCase()}`;
    originBadge.textContent = rootObj.origin + ' Origin';
    
    document.getElementById('rMeaning').textContent = `Meaning: "${rootObj.meaning}"`;
    document.getElementById('rDescription').textContent = rootObj.description;
    
    // Render Word Botanical Tree and examples
    this.drawWordTree(rootObj);
    this.renderLiteratureUsages(rootObj);
  }

  /**
   * Draws modern botanical-style family tree of descendants
   */
  drawWordTree(rootObj) {
    document.getElementById('treeRootNode').textContent = rootObj.root + '-';
    
    const branchesContainer = document.getElementById('treeBranchesContainer');
    branchesContainer.innerHTML = '';
    
    rootObj.examples.forEach(word => {
      const leaf = document.createElement('div');
      leaf.className = 'tree-leaf-node';
      leaf.textContent = word;
      
      // Highlight if this word is explicitly observed in our parsed literature
      const isObserved = rootObj.corpus_usages && rootObj.corpus_usages.some(u => u.word_used.toLowerCase() === word.toLowerCase() || u.word_lemma.toLowerCase() === word.toLowerCase());
      if (isObserved) {
        leaf.style.borderColor = 'var(--accent-primary)';
        leaf.style.background = 'var(--accent-glow)';
        leaf.setAttribute('title', `${word} is utilized in your active classic literature!`);
      }
      
      // Clicking leaf prompts quick dictionary popup or search
      leaf.onclick = () => {
        alert(`Modern English Descendant: "${word}"\nIncorporates root "${rootObj.root}-" (${rootObj.meaning}).`);
      };
      
      branchesContainer.appendChild(leaf);
    });
  }

  /**
   * Renders paragraphs from literature that contain descendants of this root
   */
  renderLiteratureUsages(rootObj) {
    const container = document.getElementById('usagesListContainer');
    container.innerHTML = '';
    
    const usages = rootObj.corpus_usages || [];
    
    if (usages.length === 0) {
      container.innerHTML = '<div class="panel-placeholder" style="padding:16px;">No sentence snippets in the active classic corpus utilize words from this root. Try scanning other roots!</div>';
      return;
    }
    
    usages.forEach(usage => {
      const card = document.createElement('div');
      card.className = 'usage-sentence-card glass-inset';
      
      // Dynamic bolding of matching words inside sentence
      const cleanWord = usage.word_used.replace(/[^\w]/g, '');
      const regex = new RegExp(`\\b(${cleanWord})\\b`, 'gi');
      const highlightedText = usage.sentence_text.replace(regex, '<strong style="color:var(--accent-primary); text-decoration:underline;">$1</strong>');
      
      const p = document.createElement('p');
      p.innerHTML = `“${highlightedText}”`;
      
      const meta = document.createElement('div');
      meta.className = 'usage-meta';
      
      const badge = document.createElement('span');
      badge.className = 'usage-book-badge';
      badge.textContent = `📖 ${usage.book}`;
      
      const lexical = document.createElement('span');
      lexical.textContent = `Word: ${usage.word_used} (Lemma: ${usage.word_lemma})`;
      
      meta.appendChild(badge);
      meta.appendChild(lexical);
      
      card.appendChild(p);
      card.appendChild(meta);
      
      container.appendChild(card);
    });
  }

  /* ==========================================================================
     ETYMOLOGY / ROOT WORD MATCHING CHALLENGE
     ========================================================================== */

  startQuiz() {
    this.quizActive = true;
    this.quizScore = 0;
    this.quizCurrentIndex = 0;
    
    // Construct 5 dynamic questions based on root databases
    this.quizQuestions = [];
    
    const allRoots = [...this.roots.roots];
    
    // Choose 5 random distinct roots
    const chosenRoots = allRoots.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    chosenRoots.forEach((r, idx) => {
      const questionType = Math.random() > 0.5 ? 'root_to_meaning' : 'meaning_to_root';
      const question = {
        type: questionType,
        targetRoot: r.root,
        targetMeaning: r.meaning,
        targetOrigin: r.origin,
        examples: r.examples,
        options: []
      };
      
      if (questionType === 'root_to_meaning') {
        question.text = `What is the meaning of the ancient root <strong style="color:var(--accent-primary)">'${r.root}'</strong> (of ${r.origin} origin)?`;
        question.correctOption = r.meaning;
        
        // Add wrong options from other roots
        const wrongOptions = allRoots
          .filter(x => x.root !== r.root)
          .map(x => x.meaning)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
          
        question.options = [r.meaning, ...wrongOptions].sort(() => 0.5 - Math.random());
      } else {
        question.text = `Which linguistic root represents the meaning <strong style="color:var(--accent-primary)">"${r.meaning}"</strong>?`;
        question.correctOption = r.root + '-';
        
        const wrongOptions = allRoots
          .filter(x => x.root !== r.root)
          .map(x => x.root + '-')
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
          
        question.options = [r.root + '-', ...wrongOptions].sort(() => 0.5 - Math.random());
      }
      
      this.quizQuestions.push(question);
    });
    
    // Show modal
    const modal = document.getElementById('etymologyQuizModal');
    modal.classList.remove('hidden');
    
    document.getElementById('etymologyQuizBody').classList.remove('hidden');
    document.getElementById('etymologyQuizResults').classList.add('hidden');
    
    this.loadQuizQuestion();
  }

  loadQuizQuestion() {
    this.quizAnswered = false;
    document.getElementById('etFeedback').classList.add('hidden');
    
    const question = this.quizQuestions[this.quizCurrentIndex];
    
    document.getElementById('etQIndex').textContent = this.quizCurrentIndex + 1;
    document.getElementById('etScore').textContent = this.quizScore;
    document.getElementById('etQuestionText').innerHTML = question.text;
    
    // Options grid buttons populating
    const grid = document.getElementById('etOptionsGrid');
    grid.innerHTML = '';
    
    question.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      
      btn.onclick = () => this.submitQuizAnswer(opt, btn);
      grid.appendChild(btn);
    });
  }

  submitQuizAnswer(chosenVal, btnElement) {
    if (this.quizAnswered) return;
    this.quizAnswered = true;
    
    const question = this.quizQuestions[this.quizCurrentIndex];
    const isCorrect = chosenVal === question.correctOption;
    
    // Disable other buttons, highlight correct / wrong
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === question.correctOption) {
        btn.classList.add('correct');
      }
    });
    
    if (isCorrect) {
      this.quizScore++;
      btnElement.classList.add('correct');
      
      // Dynamic details details
      let details = "";
      if (question.examples && question.examples.length > 0) {
        details = ` Examples include: <em>${question.examples.slice(0, 3).join(', ')}</em>.`;
      }
      
      document.getElementById('etFeedbackText').innerHTML = `🎉 <strong>Correct!</strong> Root <em>${question.targetRoot}</em> signifies <em>${question.targetMeaning}</em>.${details}`;
    } else {
      btnElement.classList.add('wrong');
      document.getElementById('etFeedbackText').innerHTML = `❌ <strong>Incorrect.</strong> The correct answer was "${question.correctOption}".`;
    }
    
    document.getElementById('etFeedback').classList.remove('hidden');
    document.getElementById('etScore').textContent = this.quizScore;
  }

  nextQuizQuestion() {
    this.quizCurrentIndex++;
    if (this.quizCurrentIndex < 5) {
      this.loadQuizQuestion();
    } else {
      // Completed! Show final results screen
      document.getElementById('etymologyQuizBody').classList.add('hidden');
      document.getElementById('etymologyQuizResults').classList.remove('hidden');
      document.getElementById('etFinalScore').textContent = this.quizScore;
    }
  }

  closeQuiz() {
    document.getElementById('etymologyQuizModal').classList.add('hidden');
    this.quizActive = false;
  }
}

// Instantiate global etymology explorer engine
const etymologyTool = new EtymologyTool();
