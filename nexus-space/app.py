import os
from typing import Literal

import gradio as gr
import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from peft import AutoPeftModelForCausalLM
from pydantic import BaseModel, Field
from transformers import AutoTokenizer


MODEL_ID = os.getenv("NEXUS_MODEL_ID", "").strip()
BASE_MODEL_ID = os.getenv(
    "NEXUS_BASE_MODEL_ID", "meta-llama/Llama-3.2-1B-Instruct"
).strip()
HF_TOKEN = os.getenv("HF_TOKEN") or None

if not MODEL_ID:
    raise RuntimeError(
        "Set the NEXUS_MODEL_ID Space variable to the Hugging Face repository "
        "that contains your trained LoRA adapter."
    )

tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID, token=HF_TOKEN)
if tokenizer.pad_token_id is None:
    tokenizer.pad_token = tokenizer.eos_token

model = AutoPeftModelForCausalLM.from_pretrained(
    MODEL_ID,
    token=HF_TOKEN,
    device_map="auto",
    torch_dtype="auto",
)
model.eval()

SYSTEM_PROMPT = """You are Nexus AI, a portfolio assistant for Rishi D. Vagadiya.
Answer recruiter questions clearly and briefly. Use only these verified portfolio facts:
- Rishi has released CrowdWar: Crowd Runner 3D and Car Parking on Google Play.
- Nexus AI is a Llama 3.2 1B Instruct fine-tuning project using a 60-example JSONL dataset and a notebook with Unsloth and LoRA/PEFT workflow.
- The portfolio displays owner-supplied training and evaluation report images. Their numbers are not independently verified; the project folder does not contain raw run logs or trained adapter weights.
- The website's chat runs this deployed adapter. If asked for details not in the facts or model knowledge, say what is unknown instead of inventing a claim.
"""


def respond(message: str, history: list[dict] | None) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in history or []:
        role = turn.get("role")
        content = turn.get("content")
        if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content.strip()})
    messages.append({"role": "user", "content": message.strip()})

    prompt = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = tokenizer(prompt, return_tensors="pt")
    inputs = {key: value.to(model.device) for key, value in inputs.items()}
    with torch.inference_mode():
        output = model.generate(
            **inputs,
            max_new_tokens=256,
            do_sample=True,
            temperature=0.65,
            top_p=0.9,
            repetition_penalty=1.08,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )
    answer = tokenizer.decode(
        output[0, inputs["input_ids"].shape[-1] :], skip_special_tokens=True
    ).strip()
    return answer or "I could not form a response. Please try asking in a different way."


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=1600)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1600)
    history: list[ChatTurn] = Field(default_factory=list, max_length=12)


api = FastAPI(title="Nexus AI Portfolio Chat")
allowed_origins = [
    origin.strip()
    for origin in os.getenv("NEXUS_ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]
api.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@api.post("/api/chat")
def portfolio_chat(payload: ChatRequest) -> dict[str, str]:
    try:
        history = [turn.model_dump() for turn in payload.history]
        return {"reply": respond(payload.message, history)}
    except Exception as exc:
        print(f"Nexus AI inference error: {exc}")
        raise HTTPException(
            status_code=503,
            detail="Nexus AI is temporarily unavailable. Please try again later.",
        ) from exc


demo = gr.ChatInterface(
    fn=respond,
    type="messages",
    title="Nexus AI",
    description="Ask about Rishi's Unity games, AI fine-tuning project, or technical workflow.",
    examples=[
        "What did you build with Unity?",
        "How was Nexus AI fine-tuned?",
        "What should I know about the training report?",
    ],
    flagging_mode="never",
)
app = gr.mount_gradio_app(api, demo, path="/space-chat")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
