/**
 * Syntactika - Interactive Syntax Visualizer & Quiz Engine
 * Integrates Immersive Book Reader, Pattern Explorer, and Drag-to-Pan SVG canvas.
 */

class SyntaxTool {
  constructor() {
    this.corpus = null;
    this.filteredSentences = [];
    this.currentIndex = 0;
    this.selectedWordIndex = null;
    this.workspaceTab = 'reader'; // 'reader' or 'explorer'
    
    // Quiz State
    this.quizActive = false;
    this.quizSentences = [];
    this.quizCurrentIndex = 0;
    this.quizScore = 0;
    this.quizTargetDep = "";
    this.quizTargetLabel = "";
    this.quizAnswered = false;
  }

  /**
   * Initialize with compiled literature corpus
   */
  init(corpus) {
    this.corpus = corpus;
    this.filteredSentences = [...corpus.sentences];
    
    this.populateBookSelector();
    this.filterSentences(); // Sets up current book list and active sentence
    
    this.switchWorkspaceTab('reader');
    this.setupCanvasDrag(); // Setup mouse-drag canvas panning!
  }

  /**
   * Fills dropdown list with available literary works
   */
  populateBookSelector() {
    const selector = document.getElementById('bookSelector');
    selector.innerHTML = '<option value="all">📚 All Literature</option>';
    
    this.corpus.metadata.books.forEach(book => {
      const opt = document.createElement('option');
      opt.value = book;
      opt.textContent = '📖 ' + book;
      selector.appendChild(opt);
    });
  }

  /**
   * Handle dropdown books selection
   */
  onBookChange() {
    this.filterSentences();
    this.renderReader(); // Refresh the sequential page scroller
  }

  /**
   * Handles switching the visual tab panes between Book Reader and flat list Explorer
   */
  switchWorkspaceTab(tabName) {
    this.workspaceTab = tabName;
    
    const btnReader = document.getElementById('wsTabBtnReader');
    const btnExplorer = document.getElementById('wsTabBtnExplorer');
    const paneReader = document.getElementById('wsTabReader');
    const paneExplorer = document.getElementById('wsTabExplorer');
    
    if (tabName === 'reader') {
      btnReader.classList.add('active');
      btnExplorer.classList.remove('active');
      paneReader.classList.add('active');
      paneExplorer.classList.remove('active');
      
      this.renderReader();
    } else {
      btnReader.classList.remove('active');
      btnExplorer.classList.add('active');
      paneReader.classList.remove('active');
      paneExplorer.classList.add('active');
      
      if (this.filteredSentences.length > 0) {
        this.loadSentence(this.currentIndex);
      }
    }
  }

  /**
   * Filters sentences based on book selection and grammar tag selection
   */
  filterSentences() {
    const bookVal = document.getElementById('bookSelector').value;
    const grammarVal = document.getElementById('sentenceGrammarFilter').value;
    
    this.filteredSentences = this.corpus.sentences.filter(s => {
      const matchBook = (bookVal === 'all' || s.book === bookVal);
      const matchGrammar = (grammarVal === 'all' || s.grammar_tags.includes(grammarVal));
      return matchBook && matchGrammar;
    });

    this.currentIndex = 0;
    
    if (this.filteredSentences.length > 0) {
      this.loadSentence(0);
    } else {
      this.displayNoSentencesFound();
    }
  }

  /**
   * Visual indicator when no matches satisfy filters
   */
  displayNoSentencesFound() {
    document.getElementById('sentenceCounter').textContent = '0 / 0';
    document.getElementById('sentenceSourceBook').textContent = 'No Matches';
    if (document.getElementById('sentenceGrammarTags')) {
      document.getElementById('sentenceGrammarTags').innerHTML = '';
    }
    
    const quoteBox = document.getElementById('interactiveQuoteText');
    if (quoteBox) {
      quoteBox.innerHTML = '<span class="text-muted" style="font-size:15px; font-style:normal;">No sentences in the library match your current filter parameters. Try adjusting the grammar pattern or book!</span>';
    }
    
    // Clear canvas
    document.getElementById('svgLinksGroup').innerHTML = '';
    document.getElementById('svgWordsGroup').innerHTML = '';
    
    this.hideWordDetails();
  }

  /**
   * DYNAMIC BOOK READER VIEW:
   * Groups sentences sequentially by paragraph, rendering a continuous pages layout.
   * Hovering over sentences highlights them, and clicking parses them instantly below.
   */
  renderReader() {
    const bookVal = document.getElementById('bookSelector').value;
    const activeBook = bookVal === 'all' ? this.corpus.metadata.books[0] : bookVal;
    
    document.getElementById('readerBookTitle').textContent = `📖 ${activeBook}`;
    
    const scroller = document.getElementById('readerTextScroller');
    scroller.innerHTML = '';
    
    const bookSentences = this.corpus.sentences.filter(s => s.book === activeBook);
    
    if (bookSentences.length === 0) {
      scroller.innerHTML = '<span class="text-muted" style="font-size:14px;">No sentences available to read in this selection.</span>';
      return;
    }
    
    const paragraphIdsOrdered = [];
    const paragraphsMap = {};
    
    bookSentences.forEach(s => {
      if (!paragraphsMap[s.paragraph_id]) {
        paragraphsMap[s.paragraph_id] = [];
        paragraphIdsOrdered.push(s.paragraph_id);
      }
      paragraphsMap[s.paragraph_id].push(s);
    });
    
    paragraphIdsOrdered.forEach(paraId => {
      const p = document.createElement('p');
      p.className = 'reader-paragraph';
      
      const sentences = paragraphsMap[paraId];
      sentences.forEach(s => {
        const span = document.createElement('span');
        span.className = 'reader-sentence';
        span.id = `rsent_${s.id}`;
        span.textContent = s.text + ' ';
        
        const activeSentence = this.filteredSentences[this.currentIndex];
        if (activeSentence && activeSentence.id === s.id) {
          span.classList.add('active-sentence');
        }
        
        span.onclick = () => {
          document.querySelectorAll('.reader-sentence').forEach(el => el.classList.remove('active-sentence'));
          span.classList.add('active-sentence');
          this.loadSentenceFromObject(s);
        };
        
        p.appendChild(span);
      });
      
      scroller.appendChild(p);
    });
  }

  /**
   * Load and render a specific sentence object directly (used by Book Reader clicks)
   */
  loadSentenceFromObject(s) {
    const idx = this.filteredSentences.findIndex(x => x.id === s.id);
    
    if (idx !== -1) {
      this.currentIndex = idx;
      this.loadSentence(idx);
    } else {
      document.getElementById('sentenceGrammarFilter').value = 'all';
      this.filterSentences();
      const newIdx = this.filteredSentences.findIndex(x => x.id === s.id);
      if (newIdx !== -1) {
        this.currentIndex = newIdx;
        this.loadSentence(newIdx);
      }
    }
  }

  /**
   * Load and render a specific sentence by index in the filtered array
   */
  loadSentence(idx) {
    if (idx < 0 || idx >= this.filteredSentences.length) return;
    
    this.currentIndex = idx;
    this.selectedWordIndex = null;
    
    const sentence = this.filteredSentences[idx];
    
    const counterNode = document.getElementById('sentenceCounter');
    if (counterNode) {
      counterNode.textContent = `${idx + 1} / ${this.filteredSentences.length}`;
    }
    const bookTitleNode = document.getElementById('sentenceSourceBook');
    if (bookTitleNode) {
      bookTitleNode.textContent = sentence.book;
    }
    
    const readerSpan = document.getElementById(`rsent_${sentence.id}`);
    if (readerSpan) {
      document.querySelectorAll('.reader-sentence').forEach(el => el.classList.remove('active-sentence'));
      readerSpan.classList.add('active-sentence');
      readerSpan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    const tagsContainer = document.getElementById('sentenceGrammarTags');
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
      sentence.grammar_tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        tagsContainer.appendChild(span);
      });
    }
    
    const quoteContainer = document.getElementById('interactiveQuoteText');
    if (quoteContainer) {
      quoteContainer.innerHTML = '';
      
      sentence.tokens.forEach((t, i) => {
        const span = document.createElement('span');
        span.className = 'interactive-word';
        span.id = `word_${i}`;
        span.textContent = t.text;
        
        span.onclick = () => this.selectWord(i);
        quoteContainer.appendChild(span);
        
        if (i < sentence.tokens.length - 1) {
          quoteContainer.appendChild(document.createTextNode(' '));
        }
      });
    }

    this.updateHighlights();
    this.drawTree();
    this.hideWordDetails();
  }

  prevSentence() {
    if (this.filteredSentences.length === 0) return;
    let idx = this.currentIndex - 1;
    if (idx < 0) idx = this.filteredSentences.length - 1;
    this.loadSentence(idx);
  }

  nextSentence() {
    if (this.filteredSentences.length === 0) return;
    let idx = this.currentIndex + 1;
    if (idx >= this.filteredSentences.length) idx = 0;
    this.loadSentence(idx);
  }

  /**
   * Synchronizes visual checked overlays (subjects, verbs, adjectives etc.)
   */
  updateHighlights() {
    if (this.filteredSentences.length === 0) return;
    const sentence = this.filteredSentences[this.currentIndex];
    
    const hlSubj = document.getElementById('hlSubject').checked;
    const hlVerb = document.getElementById('hlVerb').checked;
    const hlObj = document.getElementById('hlObject').checked;
    const hlAdj = document.getElementById('hlAdjective').checked;
    const hlAdv = document.getElementById('hlAdverb').checked;

    sentence.tokens.forEach((t, i) => {
      const span = document.getElementById(`word_${i}`);
      if (!span) return;
      
      span.className = 'interactive-word';
      if (this.selectedWordIndex === i) {
        span.classList.add('selected');
      }

      const dep = t.dep.toLowerCase();
      const pos = t.pos.toLowerCase();
      
      if (hlSubj && (dep === 'nsubj' || dep === 'nsubjpass')) {
        span.classList.add('hl-subject');
      } else if (hlVerb && (dep === 'root' || pos === 'verb')) {
        span.classList.add('hl-verb');
      } else if (hlObj && (dep === 'dobj' || dep === 'pobj')) {
        span.classList.add('hl-object');
      } else if (hlAdj && dep === 'amod') {
        span.classList.add('hl-adjective');
      } else if (hlAdv && dep === 'advmod') {
        span.classList.add('hl-adverb');
      }
    });
  }

  /**
   * Handles clicking on a word. Displays grammatical metadata side card.
   */
  selectWord(i) {
    this.selectedWordIndex = i;
    this.updateHighlights();
    
    document.querySelectorAll('.svg-word-text').forEach(el => {
      el.classList.remove('active');
    });
    const svgTextNode = document.getElementById(`svg_w_${i}`);
    if (svgTextNode) svgTextNode.classList.add('active');

    const sentence = this.filteredSentences[this.currentIndex];
    const token = sentence.tokens[i];
    
    document.getElementById('wordDetailsPlaceholder').classList.add('hidden');
    
    const content = document.getElementById('wordDetailsContent');
    content.classList.remove('hidden');
    
    document.getElementById('detWordText').textContent = token.text;
    document.getElementById('detWordPOS').textContent = `${token.pos} (${token.tag})`;
    document.getElementById('detWordLemma').textContent = token.lemma;
    document.getElementById('detWordDep').textContent = token.dep;
    
    let expl = token.explanation || `Grammatical connection categorized as '${token.dep}'.`;
    if (token.dep.toLowerCase() === 'root') {
      expl = "The main predicate or anchor verb of the sentence, around which all other structures revolve.";
    }
    document.getElementById('detWordExplanation').textContent = expl;

    const etyCard = document.getElementById('detWordEtymologyCard');
    if (token.root_link) {
      etyCard.classList.remove('hidden');
      document.getElementById('detWordRootName').textContent = token.root_link + '-';
      
      const rootObj = app.roots.roots.find(r => r.root === token.root_link);
      const meaning = rootObj ? rootObj.meaning : 'historical origin';
      document.getElementById('detWordRootMeaning').textContent = meaning;
      
      document.getElementById('detWordRootBtn').onclick = () => {
        app.switchView('etymology');
        etymologyTool.selectRootByName(token.root_link);
      };
    } else {
      etyCard.classList.add('hidden');
    }
  }

  hideWordDetails() {
    document.getElementById('wordDetailsPlaceholder').classList.remove('hidden');
    document.getElementById('wordDetailsContent').classList.add('hidden');
  }

  /**
   * Premium UX Interaction: Enables native grab-and-pan sliding
   * for the visual tree SVG canvas, removing scrolling friction.
   */
  setupCanvasDrag() {
    const container = document.getElementById('syntaxCanvasContainer');
    if (!container) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;
    
    container.addEventListener('mousedown', (e) => {
      isDown = true;
      container.style.cursor = 'grabbing';
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });
    
    container.addEventListener('mouseleave', () => {
      isDown = false;
      container.style.cursor = 'grab';
    });
    
    container.addEventListener('mouseup', () => {
      isDown = false;
      container.style.cursor = 'grab';
    });
    
    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      // Scroll speed multiplier
      const walk = (x - startX) * 1.5; 
      container.scrollLeft = scrollLeft - walk;
    });
    
    container.style.cursor = 'grab';
  }

  /**
   * CORE VISUAL PIPELINE: Draws custom SVG grammar dependency arcs
   */
  drawTree() {
    if (this.filteredSentences.length === 0) return;
    const sentence = this.filteredSentences[this.currentIndex];
    
    const svg = document.getElementById('syntaxTreeSvg');
    const linksGroup = document.getElementById('svgLinksGroup');
    const wordsGroup = document.getElementById('svgWordsGroup');
    
    linksGroup.innerHTML = '';
    wordsGroup.innerHTML = '';
    
    const wordSpacing = 85;
    const marginX = 40;
    const baselineY = 220; 
    
    const totalWords = sentence.tokens.length;
    const svgWidth = Math.max(800, marginX * 2 + (totalWords - 1) * wordSpacing);
    
    svg.setAttribute('width', svgWidth);
    
    // 1. Draw words and POS tags
    sentence.tokens.forEach((t, i) => {
      const x = marginX + i * wordSpacing;
      
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${x}, ${baselineY})`);
      
      const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textNode.setAttribute('id', `svg_w_${i}`);
      textNode.setAttribute('class', 'svg-word-text');
      textNode.setAttribute('text-anchor', 'middle');
      textNode.textContent = t.text;
      if (this.selectedWordIndex === i) {
        textNode.classList.add('active');
      }
      
      textNode.onclick = () => {
        this.selectWord(i);
        document.querySelectorAll('.interactive-word').forEach(span => span.classList.remove('selected'));
        const span = document.getElementById(`word_${i}`);
        if (span) span.classList.add('selected');
      };
      
      const posNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      posNode.setAttribute('class', 'svg-word-pos');
      posNode.setAttribute('text-anchor', 'middle');
      posNode.setAttribute('y', '18');
      posNode.textContent = t.pos;
      
      g.appendChild(textNode);
      g.appendChild(posNode);
      wordsGroup.appendChild(g);
    });
    
    // 2. Draw dependency arcs (Bezier connectors)
    sentence.tokens.forEach((t, i) => {
      const headIdx = t.head;
      
      if (headIdx === i || t.dep.toLowerCase() === 'root') return;
      
      const xSource = marginX + i * wordSpacing;
      const xTarget = marginX + headIdx * wordSpacing;
      
      const span = Math.abs(xTarget - xSource);
      const arcHeight = Math.min(130, span * 0.45);
      const controlY = baselineY - 20 - arcHeight;
      const startY = baselineY - 18;
      
      const pathNode = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathNode.setAttribute('id', `arc_${i}`);
      pathNode.setAttribute('class', 'dep-arc');
      
      const d = `M ${xSource} ${startY} Q ${(xSource + xTarget) / 2} ${controlY} ${xTarget} ${startY}`;
      pathNode.setAttribute('d', d);
      
      const arrowNode = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      arrowNode.setAttribute('id', `arrow_${i}`);
      arrowNode.setAttribute('class', 'dep-arrow');
      
      const isSourceLeft = xSource < xTarget;
      const arrowSize = 4;
      const arrowX = xSource;
      const arrowY = startY - 2;
      
      let points = "";
      if (isSourceLeft) {
        points = `${arrowX},${arrowY} ${arrowX - arrowSize},${arrowY - arrowSize*2} ${arrowX + arrowSize*2},${arrowY - arrowSize}`;
      } else {
        points = `${arrowX},${arrowY} ${arrowX + arrowSize},${arrowY - arrowSize*2} ${arrowX - arrowSize*2},${arrowY - arrowSize}`;
      }
      arrowNode.setAttribute('points', points);
      
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('id', `lbl_${i}`);
      labelText.setAttribute('class', 'dep-label-text');
      labelText.setAttribute('text-anchor', 'middle');
      
      labelText.setAttribute('x', `${(xSource + xTarget) / 2}`);
      labelText.setAttribute('y', `${controlY + arcHeight / 2 - 8}`);
      labelText.textContent = t.dep;
      
      const highlightArc = (active) => {
        if (active) {
          pathNode.classList.add('active');
          arrowNode.classList.add('active');
          labelText.classList.add('active');
        } else {
          pathNode.classList.remove('active');
          arrowNode.classList.remove('active');
          labelText.classList.remove('active');
        }
      };
      
      labelText.onmouseover = () => highlightArc(true);
      labelText.onmouseout = () => highlightArc(false);
      pathNode.onmouseover = () => highlightArc(true);
      pathNode.onmouseout = () => highlightArc(false);
      
      labelText.onclick = () => this.selectWord(i);
      
      linksGroup.appendChild(pathNode);
      linksGroup.appendChild(arrowNode);
      linksGroup.appendChild(labelText);
    });
  }

  /* ==========================================================================
     SYNTAX PRACTICE ARENA / QUIZZES
     ========================================================================== */

  startQuiz() {
    this.quizActive = true;
    this.quizScore = 0;
    this.quizCurrentIndex = 0;
    
    const richSentences = this.corpus.sentences.filter(s => {
      const deps = s.tokens.map(t => t.dep.toLowerCase());
      return deps.includes('dobj') || deps.includes('nsubj') || deps.includes('amod') || deps.includes('advmod');
    });
    
    const shuffled = [...richSentences].sort(() => 0.5 - Math.random());
    this.quizSentences = shuffled.slice(0, 5);
    
    const modal = document.getElementById('syntaxQuizModal');
    modal.classList.remove('hidden');
    
    document.getElementById('syntaxQuizBody').classList.remove('hidden');
    document.getElementById('syntaxQuizResults').classList.add('hidden');
    
    this.loadQuizQuestion();
  }

  loadQuizQuestion() {
    this.quizAnswered = false;
    document.getElementById('quizFeedback').classList.add('hidden');
    
    const sentence = this.quizSentences[this.quizCurrentIndex];
    document.getElementById('quizQIndex').textContent = this.quizCurrentIndex + 1;
    document.getElementById('quizScore').textContent = this.quizScore;
    
    const availableDeps = sentence.tokens.map(t => t.dep.toLowerCase());
    
    if (availableDeps.includes('dobj') && Math.random() > 0.5) {
      this.quizTargetDep = 'dobj';
      this.quizTargetLabel = 'Direct Object (dobj)';
    } else if (availableDeps.includes('nsubj')) {
      this.quizTargetDep = 'nsubj';
      this.quizTargetLabel = 'Nominal Subject (nsubj)';
    } else if (availableDeps.includes('amod')) {
      this.quizTargetDep = 'amod';
      this.quizTargetLabel = 'Adjectival Modifier (amod)';
    } else if (availableDeps.includes('advmod')) {
      this.quizTargetDep = 'advmod';
      this.quizTargetLabel = 'Adverbial Modifier (advmod)';
    } else {
      this.quizTargetDep = 'root';
      this.quizTargetLabel = 'Anchor/ROOT Verb (ROOT)';
    }
    
    document.getElementById('quizQuestionText').innerHTML = `Identify and click the <strong style="color:var(--accent-primary)">${this.quizTargetLabel}</strong> word in the sentence below:`;
    
    const container = document.getElementById('quizSentenceInteractive');
    container.innerHTML = '';
    
    sentence.tokens.forEach((t, i) => {
      const span = document.createElement('span');
      span.className = 'interactive-word';
      span.textContent = t.text;
      
      span.onclick = () => this.submitQuizAnswer(i, span);
      
      container.appendChild(span);
      if (i < sentence.tokens.length - 1) {
        container.appendChild(document.createTextNode(' '));
      }
    });
  }

  submitQuizAnswer(idx, spanElement) {
    if (this.quizAnswered) return;
    this.quizAnswered = true;
    
    const sentence = this.quizSentences[this.quizCurrentIndex];
    const clickedToken = sentence.tokens[idx];
    const isCorrect = clickedToken.dep.toLowerCase() === this.quizTargetDep;
    
    if (isCorrect) {
      this.quizScore++;
      spanElement.style.background = 'rgba(16, 185, 129, 0.2)';
      spanElement.style.borderColor = 'var(--subject-color)';
      spanElement.style.color = 'var(--subject-color)';
      spanElement.style.fontWeight = '700';
      
      document.getElementById('quizFeedbackText').innerHTML = `🎉 <strong>Correct!</strong> "${clickedToken.text}" is indeed the ${this.quizTargetLabel}.`;
    } else {
      spanElement.style.background = 'rgba(239, 68, 68, 0.2)';
      spanElement.style.borderColor = '#ef4444';
      spanElement.style.color = '#ef4444';
      spanElement.style.fontWeight = '700';
      
      const correctIdx = sentence.tokens.findIndex(t => t.dep.toLowerCase() === this.quizTargetDep);
      const correctText = correctIdx !== -1 ? sentence.tokens[correctIdx].text : "";
      
      document.getElementById('quizFeedbackText').innerHTML = `❌ <strong>Not quite.</strong> "${clickedToken.text}" is classified as <em>${clickedToken.dep}</em>. The correct answer was "${correctText}".`;
    }
    
    document.getElementById('quizFeedback').classList.remove('hidden');
    document.getElementById('quizScore').textContent = this.quizScore;
  }

  nextQuizQuestion() {
    this.quizCurrentIndex++;
    if (this.quizCurrentIndex < 5) {
      this.loadQuizQuestion();
    } else {
      document.getElementById('syntaxQuizBody').classList.add('hidden');
      document.getElementById('syntaxQuizResults').classList.remove('hidden');
      document.getElementById('quizFinalScore').textContent = this.quizScore;
    }
  }

  closeQuiz() {
    document.getElementById('syntaxQuizModal').classList.add('hidden');
    this.quizActive = false;
  }
}

// Instantiate global syntax engine
const syntaxTool = new SyntaxTool();
