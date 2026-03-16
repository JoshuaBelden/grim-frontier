import os
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from PIL import Image

app = FastAPI()

MODEL_ID = os.environ.get("MODEL_ID", "runwayml/stable-diffusion-v1-5")
IMAGES_DIR = "/images"
NEGATIVE_PROMPT = "cartoon, anime, blurry, low quality, deformed, ugly, watermark, text"

pipeline = None


@app.on_event("startup")
def load_pipeline():
    global pipeline
    print(f"Loading model: {MODEL_ID}")
    pipeline = StableDiffusionPipeline.from_pretrained(MODEL_ID, torch_dtype=torch.float32)
    pipeline.scheduler = DPMSolverMultistepScheduler.from_config(pipeline.scheduler.config)
    pipeline = pipeline.to("cpu")
    pipeline.safety_checker = None
    print("Model loaded")


class GenerateRequest(BaseModel):
    prompt: str
    npc_id: str
    seed: int | None = None


class GenerateCustomRequest(BaseModel):
    prompt: str
    image_id: str
    negative_prompt: str | None = None
    seed: int | None = None


def run_pipeline(prompt: str, negative_prompt: str, seed: int | None) -> Image.Image:
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    generator = torch.Generator("cpu")
    if seed is not None:
        generator.manual_seed(seed)

    return pipeline(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=25,
        guidance_scale=7.5,
        width=512,
        height=512,
        generator=generator,
    ).images[0]


@app.post("/generate")
def generate(request: GenerateRequest):
    image = run_pipeline(request.prompt, NEGATIVE_PROMPT, request.seed)

    filename = f"npc-{request.npc_id}.jpg"
    path = os.path.join(IMAGES_DIR, filename)
    image.save(path, "JPEG", quality=85)

    return {"filename": filename}


@app.post("/generate/custom")
def generate_custom(request: GenerateCustomRequest):
    negative_prompt = request.negative_prompt if request.negative_prompt is not None else NEGATIVE_PROMPT
    image = run_pipeline(request.prompt, negative_prompt, request.seed)

    filename = f"img-{request.image_id}.jpg"
    path = os.path.join(IMAGES_DIR, filename)
    image.save(path, "JPEG", quality=85)

    return {"filename": filename}


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": pipeline is not None}
