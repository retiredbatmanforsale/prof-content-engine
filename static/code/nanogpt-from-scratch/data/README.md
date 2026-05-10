# Data

Place training corpora here. Lesson 10 trains on `tinyshakespeare.txt` (~1MB).

Download:

```bash
curl -L https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt \
    -o tinyshakespeare.txt
```

`train.py` will auto-download this if the file is missing.
