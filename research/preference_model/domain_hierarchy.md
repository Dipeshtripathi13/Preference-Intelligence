# Domain and task hierarchy

Status: **proposed MVP taxonomy**.

```text
global
├── software_engineering
│   ├── backend (java, python, distributed_systems)
│   ├── frontend
│   └── databases
├── machine_learning
│   ├── deep_learning
│   ├── nlp
│   └── computer_vision
├── science
│   ├── physics
│   ├── biology
│   └── chemistry
├── finance
├── legal
├── health
├── education
├── professional_writing
├── creative_writing
└── general
```

Tasks are orthogonal labels such as `explanation`, `implementation`, `debugging`, `summarization`, `comparison`, `planning`, `editing`, and `brainstorming`.

## Isolation rules

1. A scoped record applies only to its exact domain path or descendants explicitly declared in the taxonomy.
2. No expertise or technical-depth value transfers across top-level domains.
3. Global stylistic preferences may fall back into any domain, unless the dimension is marked non-transferable.
4. A domain-specific value overrides a global value for the same dimension.
5. A low-confidence classification retrieves only global transferable preferences.
6. Current-request instructions override every stored scope.

`technical_depth`, `explanation_level`, and `math_depth` default to non-transferable across top-level domains. Presentation dimensions such as tone and verbosity default to globally transferable, but a scoped override wins.

## Classification uncertainty

The classifier returns `domain`, optional `subdomain`, optional `task`, confidence, and evidence labels. Below a configurable confidence threshold (initially 0.55), the system uses `general` and avoids domain-expertise assertions. Multi-domain prompts may return several candidates, but the MVP should withhold incompatible depth preferences instead of choosing one arbitrarily.

## Extensibility

Taxonomy identifiers are stable machine keys with separate human labels. Namespaced custom domains are allowed in exported profiles. Importers that do not recognize a domain preserve it but do not compile it automatically.
