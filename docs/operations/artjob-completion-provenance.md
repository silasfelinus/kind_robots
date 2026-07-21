# ArtJob completion provenance

This contract prevents a ComfyUI image from being attached to the wrong ArtJob when the relay retries, times out, or sees multiple recent history entries.

The matching relay implementation lives in the Conductor repository:

- `ops/home-server/relay_agent.py`
- `ops/home-server/relay_media_agent.py`
- `tests/test_relay_completion_provenance.py`

It is implemented in `silasfelinus/conductor#992` alongside the coloring-book semantic gate.

## Capability negotiation

The strict relay declares the capability when it claims work:

```json
{
  "agentId": "relay:Silas-PC",
  "agentVersion": "conductor-relay-completion-proof-v1",
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
3. Capture the returned `prompt_id`, or recover only the prompt accepted for the relay's unique `client_id` when the HTTP response times out.
4. Poll only `/history/{prompt_id}` until that exact request completes or fails.
5. Select an output tuple from that history record: `filename`, `subfolder`, and `type`.
6. Fetch those exact bytes from `/view` using that tuple.
7. Compute SHA-256 over the decoded output bytes.
8. Upload those same bytes through `/api/art/save-generated`, using the ArtJob's exact `promptString` for the saved metadata.
9. Complete the ArtJob with the proof object below.

Do not scan global Comfy history for a recent image. Do not upload one output and report the tuple or hash of another.

## Completion request

```json
{
  "success": true,
  "artImageId": 12345,
  "provenance": {
    "relayVersion": "conductor-relay-completion-proof-v1",
    "relayCommit": "optional-deployed-git-sha",
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

1. Merge and deploy the Kind Robots server contract in `silasfelinus/kind_robots#821`.
2. Merge `silasfelinus/conductor#992` and deploy the updated `relay_media_agent.py` service from Conductor.
3. Optionally set `KR_RELAY_VERSION` and `KR_RELAY_COMMIT` in the relay service environment; safe defaults exist when omitted.
4. Confirm a test job reports `completion.status = VERIFIED` and matching completion/ArtImage hashes in the diagnostic endpoint.
5. Keep `supportsCompletionProof` enabled. Jobs claimed by that relay then require strict proof automatically.
