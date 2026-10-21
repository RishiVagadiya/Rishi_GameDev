---
title: Nexus AI
emoji: 🎮
colorFrom: indigo
colorTo: cyan
sdk: gradio
app_file: app.py
python_version: "3.10"
pinned: false
---

# Host the Nexus AI portfolio chat

The website keeps its own branded chat interface in the Nexus AI section. This folder is the separate Hugging Face Space that loads the trained LoRA adapter and serves replies from `/api/chat`; the portfolio calls that endpoint in the background, without opening another page or embedding the Space UI. The browser never receives a Hugging Face token. The Space also exposes its Gradio test chat at `/space-chat`.

## Before creating the Space

The portfolio repository currently includes a training notebook and dataset, but it does not include saved adapter weights or raw training logs. Run the notebook with your chosen compute, save the final PEFT adapter, and upload that adapter to a Hugging Face model repository. Set the model repository ID in the Space as described below. The reports displayed on the portfolio are owner-supplied screenshots; their figures are not independently verified.

You need a Hugging Face account and access to the selected base model. For Meta Llama, accept its license on Hugging Face. If the adapter or base model is private or gated, create a read token with access to both repositories.

## Create the Space

1. Create a new Hugging Face Space with the **Gradio** SDK. Upload `app.py`, `requirements.txt`, and this README.
2. In **Settings → Variables and secrets**, add the variable `NEXUS_MODEL_ID` with the adapter repository ID, such as `your-account/nexus-ai-lora`.
3. If the adapter uses a different base model, add `NEXUS_BASE_MODEL_ID` with its Hugging Face repository ID. The default is `meta-llama/Llama-3.2-1B-Instruct`.
4. Add `HF_TOKEN` as a **Secret**, with repository read access. Never paste this token into the portfolio website or commit it to source control.
5. Optionally add `NEXUS_ALLOWED_ORIGINS` as a variable with your portfolio origin, such as `https://your-domain.com`. If you omit it, the public inference endpoint accepts cross-origin browser requests from any origin; this endpoint does not use cookies or a browser token.
6. Choose Space hardware. CPU can be slow for model inference; GPU hardware may require a paid plan. Review the current hardware options and costs before selecting one.
7. Wait for the Space to build, then check the Gradio test chat at `/space-chat`.

## Connect it to the portfolio

Open `../nexus-config.js` and set the public Space base URL:

```js
window.NEXUS_AI_SPACE_URL = 'https://your-account-your-space.hf.space';
```

Use the Space's `hf.space` URL. Publish the static portfolio again. Its chat form will send questions to `https://your-account-your-space.hf.space/api/chat` and show replies inline in the portfolio. Until the URL is configured, it shows the hosting instructions. Serve the portfolio from HTTPS or a local web server when using browser chat; opening the HTML as a `file://` URL may be restricted by browser cross-origin rules.

## Model loading notes

`app.py` loads the adapter with `AutoPeftModelForCausalLM` and loads the tokenizer from the base model. If your adapter repository already contains its matching tokenizer, you can change `BASE_MODEL_ID` to that repository or adjust the tokenizer line. The Space needs enough memory for the base model and adapter. This scaffold does not create or upload the fine-tuned weights for you.
