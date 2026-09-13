# Current paper draft

This publication-oriented manuscript reports a completed exploratory local-model
pilot of 128 real generations. It makes no claim of improved subjective quality:
human judgments and several planned ablations are explicitly labeled as unmeasured.

Build from this directory with a TeX distribution:

```bash
tectonic main.tex
```

The draft deliberately uses a generic anonymous article format. Replace it
with the selected venue's official, current template only after checking that
venue's rules. If verified references exist in `../literature/references.bib`,
BibTeX can load them; do not add placeholder or unverified citations.

Before a confirmatory submission:

1. record the preregistration and analysis commit;
2. freeze model identifiers, prompts, benchmark hashes, exclusions, and
   multiplicity rules;
3. complete the ethics/IRB determination required by the institution;
4. retain failed generations and missing judgments in the flow accounting;
5. regenerate tables and figures from analysis code, not manual transcription;
6. report null and harmful effects as well as favorable ones.
