# WonderLab archive

WonderLab was retired from the Kind Robots product and runtime in August 2026.

This directory is the exportable historical bundle for artifacts worth keeping after that retirement. It is intentionally outside the live component/runtime graph.

## Temporary exception

The active comment-rewrite project still reads `config/wonderlab-voice-polish-batch-001.json` through `-039.json` as voice evidence. Those 39 files stay in `config/` until that project has finished extracting the historical Component comments. They are the only intentional WonderLab-era corpus dependency left outside this archive.

The Prisma `Component` model/data is likewise preserved temporarily for that rewrite. Runtime Component APIs, museum/admin surfaces, reconciliation tooling, preview fixtures, rollout workflows, and museum-only verifiers are retired and must not return.

Once the comment rewrite no longer needs the corpus or Component rows, the remaining evidence can be copied here for posterity and the Component schema/data can be removed in a separate migration.
