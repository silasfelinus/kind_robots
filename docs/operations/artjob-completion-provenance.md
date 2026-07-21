# ArtJob completion provenance

This contract prevents a ComfyUI image from being attached to the wrong ArtJob when the relay retries, times out, or sees multiple recent history entries.

## Capability negotiation

A relay that implements strict completion proof declares the capability when it claims work:

```json
{
  "agentId": "relay:Silas-PC",
  "agentVersion": "relay-2026.07.21",
  "engines": ["A1111", "COMFY"],
  "supportsInputImages": true,
  "supportsCompletionProof": true
}
```

The claim response includes:

```json
{
  "relayContract": {
    "supportsCompletionProof": true,
    "completionProofRequired": true
  }
}
```

Older relays may omit the capability. Their jobs continue to run, but completion is recorded as `UNVERIFIED` rather than pretending provenance exists.

## Required Comfy relay flow

For a claimed COMFY ArtJob:

1. Read `job.payload.promptString`, `job.payload.workflow`, and `job.payload.provenance` from the claim response.
2. POST that exact workflow to ComfyUI `/prompt`.
3. Capture the returned `prompt_id`. Never infer the request from queue order or “latest history.”
4. Poll only `/history/{prompt_id}` until that exact request completes or fails.
5. Select an output tuple from that history record: `filename`, `subfolder`, and `type`.
6. Fetch those exact bytes from `/view` using that tuple.
7. Compute SHA-256 over the decoded image bytes.
8. Upload those same bytes through `/api/art/save-generated`, using the ArtJob's exact `promptString` for the saved metadata.
9. Complete the ArtJob with the proof object below.

Do not scan global Comfy history for a recent image. Do not upload one output and report the tuple or hash of another.

## Completion request

```json
{
  "success": true,
  "artImageId": 12345,
  "provenance": {
    "relayVersion": "relay-2026.07.21",
    "relayCommit": "optional-git-sha",
    "promptId": "comfy-prompt-id",
    "promptHash": "job.payload.provenance.promptHash",
    "workflowHash": "job.payload.provenance.workflowHash",
    "workflowPromptHash": "job.payload.provenance.workflowPromptHash",
    "imageHash": "sha256-of-decoded-uploaded-bytes",
    "output": {
      "filename": "kindrobots_flux_dev_00001_.png",
      "subfolder": "",
      "type": "output"
    }
  }
}
```

The completion endpoint rejects the request when:

- the job is not currently `RUNNING`
- required proof is omitted
- any prompt or workflow hash belongs to another attempt
- the uploaded ArtImage prompt metadata differs from the ArtJob prompt
- the SHA-256 of the stored ArtImage bytes differs from `imageHash`

## Diagnosis

Use:

```text
GET /api/art/queue/{jobId}/provenance
```

with admin or server credentials. The response presents the request hashes, extracted workflow prompt text, expected model names, relay completion trace, exact output tuple, and a freshly computed hash of the linked ArtImage bytes in one place.

## Rollout order

1. Deploy the Kind Robots server changes while the current relay still omits `supportsCompletionProof`.
2. Update the relay to follow this document and send the capability flag.
3. Confirm a test job reports `completion.status = VERIFIED` and matching completion/ArtImage hashes in the diagnostic endpoint.
4. Keep the capability enabled. Jobs claimed by that relay will then require strict proof automatically.
