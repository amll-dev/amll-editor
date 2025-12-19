import csv
import prosodic
from pathlib import Path


INPUT_FILE = Path("./pipelines/prosoticDictGen/SUBTLEXus.csv")

CSV_OUT = Path("./pipelines/prosoticDictGen/SUBTLEXus_syllables.csv")
TXT_OUT = Path("./pipelines/prosoticDictGen/SUBTLEXus_syllables-readable.txt")
FAIL_OUT = Path("./pipelines/prosoticDictGen/SUBTLEXus_failed.txt")

failed_words = []


def hyphenate_word(src: str) -> str:
    try:
        text = prosodic.Text(src)
        syllables = []
        for line in text.lines:
            for word in line.WordTokens:
                wt = word.WordType
                if wt is None or wt.WordForms is None:
                    return src
                wf = wt.WordForm
                for syl in wf.Syllables:
                    syllables.append(syl)
        if not syllables:
            return word
        return "-".join(syl.txt for syl in syllables)
    except Exception:
        print(f"Failed to hyphenate word: {src}")
        failed_words.append(src)
        return src


def main():

    with open(INPUT_FILE, newline="", encoding="utf-8") as infile, open(
        CSV_OUT, "w", newline="", encoding="utf-8"
    ) as csv_out, open(TXT_OUT, "w", encoding="utf-8") as txt_out, open(
        FAIL_OUT, "w", encoding="utf-8"
    ) as fail_out:

        reader = csv.DictReader(infile)
        fieldnames = ["word", "splitted", "freqcount", "cdcount"]
        writer = csv.DictWriter(csv_out, fieldnames=fieldnames)
        writer.writeheader()

        for i, row in enumerate(reader, start=1):
            word = row["Word"]
            freq = row["FREQcount"]
            cd = row["CDcount"]

            splitted = hyphenate_word(word)

            writer.writerow(
                {
                    "word": word,
                    "splitted": splitted,
                    "freqcount": freq,
                    "cdcount": cd,
                }
            )

            if "-" in splitted:
                txt_out.write(f"{word}: {splitted}\n")

            if i % 200 == 0:
                print(f"Processed {i} words...")

        for failed in failed_words:
            fail_out.write(f"{failed}\n")

    print("Done!")
    print(f"Results saved to:\n- {CSV_OUT}\n- {TXT_OUT}")
    print(f"Failed to hyphenate {len(failed_words)} words, see failed_words list.")


if __name__ == "__main__":
    main()
