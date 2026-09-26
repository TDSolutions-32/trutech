# Truly Digital Solutions (TruTech) website

Static site for Truly Digital Solutions, LLC — Jacksonville, NC.

## Editing
Pages are generated. Edit `_src/pages/*.html` (shared header, footer, CTA and icons live in `_src/build.py`), then run:

```bash
python3 _src/build.py
```

Commit the regenerated root `.html` files. GitHub Pages serves the repo root; Jekyll skips the `_src/` folder automatically.
