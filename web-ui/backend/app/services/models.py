import json
import sys
import os
from pathlib import Path
from typing import List

from app.models.schemas import LlmModel


def get_base_path():
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent.parent


def load_models_from_json() -> List[LlmModel]:
    try:
        base_path = get_base_path()
        
        # Try multiple possible locations for the data file
        possible_paths = [
            base_path / "data" / "hf_models.json",
            base_path / "hf_models.json",
            Path(__file__).resolve().parent.parent.parent / "data" / "hf_models.json",
        ]
        
        for data_path in possible_paths:
            if data_path.exists():
                with open(data_path, "r", encoding="utf-8") as f:
                    models_data = json.load(f)
                return [LlmModel(**model) for model in models_data]
    except Exception:
        pass
    return get_fallback_models()


def get_fallback_models() -> List[LlmModel]:
    return [
        LlmModel(
            name="meta-llama/Llama-3.1-8B-Instruct",
            provider="Meta",
            parameter_count=8000000000,
            min_ram_gb=5.5,
            recommended_ram_gb=11.0,
            min_vram_gb=5.0,
            quantization="Q4_K_M",
            context_length=128000,
            use_case="General-purpose chat, reasoning",
        ),
        LlmModel(
            name="meta-llama/Llama-3.1-70B-Instruct",
            provider="Meta",
            parameter_count=70000000000,
            min_ram_gb=44.0,
            recommended_ram_gb=88.0,
            min_vram_gb=40.0,
            quantization="Q4_K_M",
            context_length=128000,
            use_case="High-quality reasoning, complex tasks",
        ),
        LlmModel(
            name="mistralai/Mistral-7B-Instruct-v0.3",
            provider="Mistral",
            parameter_count=7000000000,
            min_ram_gb=5.0,
            recommended_ram_gb=10.0,
            min_vram_gb=4.5,
            quantization="Q4_K_M",
            context_length=32768,
            use_case="Fast, efficient chat",
        ),
        LlmModel(
            name="Qwen/Qwen2.5-7B-Instruct",
            provider="Qwen",
            parameter_count=7000000000,
            min_ram_gb=5.0,
            recommended_ram_gb=10.0,
            min_vram_gb=4.5,
            quantization="Q4_K_M",
            context_length=128000,
            use_case="Multilingual, coding",
        ),
        LlmModel(
            name="google/gemma-2-9B-it",
            provider="Google",
            parameter_count=9000000000,
            min_ram_gb=6.0,
            recommended_ram_gb=12.0,
            min_vram_gb=5.5,
            quantization="Q4_K_M",
            context_length=8192,
            use_case="General-purpose chat",
        ),
    ]


_models: List[LlmModel] = load_models_from_json()


def get_all_models() -> List[LlmModel]:
    return _models


def search_models(query: str) -> List[LlmModel]:
    query = query.lower()
    return [
        model for model in _models
        if query in model.name.lower() or query in model.provider.lower() or query in model.use_case.lower()
    ]
