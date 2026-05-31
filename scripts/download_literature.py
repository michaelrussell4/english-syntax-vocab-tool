import os
import requests

LITERATURE_SOURCES = {
    "alice_in_wonderland.txt": {
        "url": "https://www.gutenberg.org/cache/epub/11/pg11.txt",
        "fallback": """CHAPTER I. Down the Rabbit-Hole

Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, “and what is the use of a book,” thought Alice “without pictures or conversations?”

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so VERY remarkable in that; nor did Alice think it so VERY much out of the way to hear the Rabbit say to itself, “Oh dear! Oh dear! I shall be late!” (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually TOOK A WATCH OUT OF ITS WAISTCOAT-POCKET, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.

In another moment down went Alice after it, never once considering how in the world she was to get out again.
"""
    },
    "sherlock_holmes.txt": {
        "url": "https://www.gutenberg.org/cache/epub/1661/pg1661.txt",
        "fallback": """I. A SCANDAL IN BOHEMIA

To Sherlock Holmes she is always _the_ woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position. He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer—excellent for drawing the veil from men’s motives and actions. But for the trained reasoner to admit such intrusions into his own delicate and finely adjusted temperament was to introduce a distracting factor which might throw a doubt upon all his mental results. Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his. And yet there was but one woman to him, and that woman was the late Irene Adler, of doubtful and questionable memory.
"""
    },
    "pride_and_prejudice.txt": {
        "url": "https://www.gutenberg.org/cache/epub/1342/pg1342.txt",
        "fallback": """CHAPTER I.

It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

“My dear Mr. Bennet,” said his lady to him one day, “have you heard that Netherfield Park is let at last?”

Mr. Bennet replied that he had not.

“But it is,” returned she; “for Mrs. Long has just been there, and she told me all about it.”

Mr. Bennet made no answer.

“Do you not want to know who has taken it?” cried his wife impatiently.

“_You_ want to tell me, and I have no objection to hearing it.”

This was invitation enough.
"""
    }
}

def download_file(filename, info, dest_dir):
    dest_path = os.path.join(dest_dir, filename)
    print(f"Acquiring {filename}...")
    
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        response = requests.get(info["url"], headers=headers, timeout=10)
        if response.status_code == 200:
            with open(dest_path, "w", encoding="utf-8") as f:
                f.write(response.text)
            print(f"Successfully downloaded {filename} from {info['url']}")
            return
        else:
            print(f"HTTP {response.status_code} received from {info['url']}. Using fallback text.")
    except Exception as e:
        print(f"Failed to download {filename} due to: {e}. Using fallback text.")
    
    # Save fallback text
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(info["fallback"])
    print(f"Successfully created fallback for {filename}")

def main():
    dest_dir = os.path.join("data", "raw_literature")
    os.makedirs(dest_dir, exist_ok=True)
    
    for filename, info in LITERATURE_SOURCES.items():
        download_file(filename, info, dest_dir)
        
if __name__ == "__main__":
    main()
