# Layout header contract fixtures

`utils/scripts/layoutHeaderContract.ts` is the structural detector extracted for Interface Vision t-127 before wiring it into `verifyLayoutContract.ts`.

The detector is deliberately conservative and encodes the audited boundary from `docs/interface-vision-t-127-header-audit.md`:

- **positive:** a shallow page-chrome toolbar containing a direct `text-3xl font-black` title plus sibling eyebrow/description copy;
- **positive:** the same shape with responsive `md:text-2xl` title sizing;
- **negative:** a `text-3xl font-black` runtime profile name nested inside an `article`;
- **negative:** a dynamic result title nested inside a `section`;
- **negative:** a lone large `font-black` rank/score value with no sibling copy;
- **negative:** a large title inside a `kr-panel*` or `card` surface.

The next wiring step should call `hasShallowDuplicateTitleBlock(parseTemplate(template))` alongside the existing literal `<h1>` test. The helper accepts the verifier's existing parsed-node shape, so no second tokenizer is introduced.
