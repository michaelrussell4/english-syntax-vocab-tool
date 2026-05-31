import os
import json
import re

try:
    import spacy
    HAS_SPACY = True
except ImportError:
    HAS_SPACY = False

def is_garbage_sentence(text):
    """
    Identifies if a parsed sentence is actually structural metadata,
    Gutenberg headers, chapter titles, illustrations, or non-educational fragments.
    """
    text_strip = text.strip()
    
    # 1. Skip empty or extremely short snippets
    if len(text_strip) < 15:
        return True
        
    # 2. Skip chapter headings and book divisions
    # Matches patterns like "CHAPTER I", "CHAPTER IX", "CHAPTER 10", "Act I", "SCENE II"
    chapter_regex = r'\b(chapter|preface|contents|illustration|scene|act|part|epilogue|prologue)\b'
    if re.search(chapter_regex, text_strip, re.IGNORECASE):
        return True
        
    # Matches roman numerals or list indicators at the start (e.g. "I. A Scandal", "VIII. A Mad Tea-Party")
    if re.match(r'^(?:[IVXLCDM]+\.?|\d+\.?)\s+[A-Z]', text_strip):
        return True
        
    # 3. Skip lines that are entirely uppercase (headings)
    words = [w for w in text_strip.split() if w.isalpha()]
    if words and all(w.isupper() for w in words):
        return True
        
    # 4. Skip illustration text brackets or metadata
    if "[" in text_strip or "]" in text_strip or "Illustration:" in text_strip:
        return True
        
    # 5. Skip Gutenberg legalese or URLs
    gutenberg_indicators = ["gutenberg", "license", "ebook", "url", "http", "www.", "ascii", "copyright"]
    if any(ind in text_strip.lower() for ind in gutenberg_indicators):
        return True
        
    # 6. Ensure it starts with a capital letter and ends with normal sentence punctuation
    if not text_strip[0].isupper():
        return True
    if text_strip[-1] not in ['.', '?', '!']:
        return True
        
    return False

def clean_paragraph_text(text):
    # Remove Gutenberg underscores (representing italics) and odd formatting
    text = re.sub(r'_[^_]+_', lambda m: m.group(0)[1:-1], text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def load_etymology_db():
    db_path = os.path.join("data", "etymology_db.json")
    if not os.path.exists(db_path):
        return {"roots": []}
    with open(db_path, "r", encoding="utf-8") as f:
        return json.load(f)

def match_root(word, lemma, etymology_db):
    word_lower = word.lower()
    lemma_lower = lemma.lower()
    
    matched_roots = []
    
    for r in etymology_db.get("roots", []):
        root_str = r["root"].lower()
        examples = [e.lower() for e in r.get("examples", [])]
        
        # Rule 1: Direct match in examples
        if word_lower in examples or lemma_lower in examples:
            matched_roots.append(r["root"])
            continue
            
        # Rule 2: Substring prefix/infix check
        if r["origin"] == "Germanic" or root_str in ["bene", "mal", "auto", "tele", "contra"]:
            if word_lower.startswith(root_str) and len(word_lower) > len(root_str) + 2:
                matched_roots.append(r["root"])
                continue
        else:
            if root_str in lemma_lower and len(lemma_lower) >= len(root_str):
                if len(root_str) <= 3 and not (lemma_lower.startswith(root_str) or lemma_lower.endswith(root_str)):
                    continue
                matched_roots.append(r["root"])
                
    return matched_roots[0] if matched_roots else None

def parse_paragraph_with_spacy(nlp, para_text, book_title, etymology_db, global_sentence_idx, para_idx):
    """
    Parses a single paragraph text, tokenizing into sentences and applying strict
    educational grammar filters to ensure perfect subject-verb constructs are loaded.
    """
    doc = nlp(para_text)
    sentences_data = []
    
    for sent in doc.sents:
        sent_text = sent.text.strip()
        
        # 1. Skip structural garbage, titles, or illustration annotations
        if is_garbage_sentence(sent_text):
            continue
            
        # 2. Skip sentences that are too short (fragments) or too long (run-on)
        words = [t for t in sent if not t.is_punct]
        words_count = len(words)
        if words_count < 6 or words_count > 25:
            continue
            
        # 3. CRITICAL FILTER: Ensure sentence has BOTH a subject (nsubj/nsubjpass) and a ROOT verb!
        # This guarantees it's a complete, learnable grammatical sentence.
        deps = [t.dep_.lower() for t in sent]
        has_subject = "nsubj" in deps or "nsubjpass" in deps or "csubj" in deps or "csubjpass" in deps
        has_root_verb = "root" in deps
        
        if not (has_subject and has_root_verb):
            continue
            
        # Extract individual token nodes
        tokens_list = []
        for token in sent:
            token_idx = token.i - sent.start
            
            if token.head.i >= sent.start and token.head.i < sent.end:
                head_idx = token.head.i - sent.start
            else:
                head_idx = token_idx
                
            root_linked = None
            if not token.is_punct and not token.is_stop:
                root_linked = match_root(token.text, token.lemma_, etymology_db)
                
            explanation = spacy.explain(token.dep_) if HAS_SPACY else ""
            if not explanation:
                explanation = token.dep_
                
            tokens_list.append({
                "index": token_idx,
                "text": token.text,
                "lemma": token.lemma_,
                "pos": token.pos_,
                "tag": token.tag_,
                "dep": token.dep_,
                "head": head_idx,
                "explanation": explanation,
                "root_link": root_linked
            })
            
        # Classify grammatical patterns
        grammar_tags = []
        if "nsubjpass" in deps or "auxpass" in deps:
            grammar_tags.append("Passive Voice")
        if "advcl" in deps:
            grammar_tags.append("Adverbial Clause")
        if "relcl" in deps:
            grammar_tags.append("Relative Clause")
        if "ccomp" in deps or "xcomp" in deps:
            grammar_tags.append("Complex Predicate")
        if "cond" in deps or "if" in [t.text.lower() for t in sent]:
            grammar_tags.append("Conditional")
        if "dobj" in deps:
            grammar_tags.append("Transitive (with Direct Object)")
        else:
            grammar_tags.append("Intransitive")
            
        sentences_data.append({
            "id": f"{book_title.lower().replace(' ', '_')}_{global_sentence_idx}",
            "paragraph_id": f"{book_title.lower().replace(' ', '_')}_p_{para_idx}",
            "text": sent_text,
            "book": book_title,
            "tokens": tokens_list,
            "grammar_tags": grammar_tags
        })
        global_sentence_idx += 1
        
    return sentences_data, global_sentence_idx

def main():
    print("Starting corpus compilation...")
    etymology_db = load_etymology_db()
    
    raw_dir = os.path.join("data", "raw_literature")
    os.makedirs(raw_dir, exist_ok=True)
    
    literature_files = {
        "alice_in_wonderland.txt": "Alice in Wonderland",
        "sherlock_holmes.txt": "Sherlock Holmes",
        "pride_and_prejudice.txt": "Pride and Prejudice"
    }
    
    # Trigger download or fallbacks if files missing
    files_missing = any(not os.path.exists(os.path.join(raw_dir, f)) for f in literature_files)
    if files_missing:
        print("Raw literature files missing. Running download script...")
        import download_literature
        download_literature.main()
        
    # Load NLP parser
    nlp = None
    if HAS_SPACY:
        print("spaCy is available. Loading 'en_core_web_sm' model...")
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("spaCy model 'en_core_web_sm' not found. Installing...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            nlp = spacy.load("en_core_web_sm")
            
    compiled_sentences = []
    
    # Process each literature text
    for filename, book_title in literature_files.items():
        filepath = os.path.join(raw_dir, filename)
        if not os.path.exists(filepath):
            continue
            
        print(f"Parsing {book_title}...")
        with open(filepath, "r", encoding="utf-8") as f:
            full_text = f.read()
            
        # Find chapter starting lines and strip Project Gutenberg legal header/footer blocks
        # (This avoids loading legal licensing text as literature examples!)
        lines = full_text.splitlines()
        start_line = 0
        end_line = len(lines)
        
        for idx, line in enumerate(lines[:1000]):
            if "*** START OF THE PROJECT GUTENBERG" in line or "*** START OF THIS PROJECT GUTENBERG" in line:
                start_line = idx + 1
                break
        for idx, line in enumerate(lines[-2000:]):
            if "*** END OF THE PROJECT GUTENBERG" in line or "*** END OF THIS PROJECT GUTENBERG" in line:
                end_line = len(lines) - 2000 + idx
                break
                
        cleaned_body = "\n".join(lines[start_line:end_line])
        
        # Split body into raw double-newline paragraphs
        raw_paragraphs = [clean_paragraph_text(p) for p in cleaned_body.split("\n\n") if p.strip()]
        
        # We will parse paragraphs to generate a beautiful sequential reading narrative!
        # Limit paragraph count per book to keep compiled JSON size lightweight and fast
        # (E.g. first 80-100 high-quality paragraphs)
        paragraph_limit = 110
        valid_paragraphs_count = 0
        
        global_sentence_idx = 1
        
        for para_idx, raw_para in enumerate(raw_paragraphs):
            if valid_paragraphs_count >= paragraph_limit:
                break
                
            # Skip brief table of contents lines or legal notes
            if len(raw_para) < 40:
                continue
            # Skip if it starts with common title/chapter indicators to avoid clutter
            if re.match(r'^(?:chapter|preface|contents|illustration|scene|act|part|epilogue|prologue)\b', raw_para, re.IGNORECASE):
                continue
                
            if nlp:
                sents, global_sentence_idx = parse_paragraph_with_spacy(
                    nlp, raw_para, book_title, etymology_db, global_sentence_idx, para_idx
                )
            else:
                # Mock fallback
                continue 
                
            if sents:
                compiled_sentences.extend(sents)
                valid_paragraphs_count += 1
                
        print(f"Compiled {valid_paragraphs_count} paragraphs ({global_sentence_idx - 1} sentences) from {book_title}")
        
    # Write output to web/data/
    web_data_dir = os.path.join("web", "data")
    os.makedirs(web_data_dir, exist_ok=True)
    
    # Create final corpus.json
    corpus_payload = {
        "metadata": {
            "total_sentences": len(compiled_sentences),
            "books": list(literature_files.values())
        },
        "sentences": compiled_sentences
    }
    
    corpus_out_path = os.path.join(web_data_dir, "corpus.json")
    with open(corpus_out_path, "w", encoding="utf-8") as f:
        json.dump(corpus_payload, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(compiled_sentences)} clean sentences to {corpus_out_path}")
    
    # Generate roots database with reverse mappings
    roots_expanded = []
    for r in etymology_db.get("roots", []):
        root_name = r["root"]
        usage_links = []
        for s in compiled_sentences:
            for t in s["tokens"]:
                if t["root_link"] == root_name:
                    usage_entry = {
                        "sentence_id": s["id"],
                        "sentence_text": s["text"],
                        "word_used": t["text"],
                        "word_lemma": t["lemma"],
                        "book": s["book"]
                    }
                    if usage_entry not in usage_links:
                        usage_links.append(usage_entry)
                        
        r_copy = r.copy()
        r_copy["corpus_usages"] = usage_links
        roots_expanded.append(r_copy)
        
    roots_payload = {
        "roots": roots_expanded
    }
    
    roots_out_path = os.path.join(web_data_dir, "roots.json")
    with open(roots_out_path, "w", encoding="utf-8") as f:
        json.dump(roots_payload, f, indent=2, ensure_ascii=False)
    print(f"Saved etymology roots database to {roots_out_path}")
    print("Compilation completed successfully!")

if __name__ == "__main__":
    main()
