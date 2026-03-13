from typing import List, Optional
from enum import Enum

from pydantic import BaseModel


class FitLevel(str, Enum):
    PERFECT = "Perfect"
    GOOD = "Good"
    MARGINAL = "Marginal"
    TOO_TIGHT = "TooTight"


class RunMode(str, Enum):
    GPU = "Gpu"
    CPU_OFFLOAD = "CpuOffload"
    CPU_ONLY = "CpuOnly"


class GpuInfo(BaseModel):
    name: str
    vram_total_gb: float
    vram_available_gb: float


class SystemSpecs(BaseModel):
    cpu_name: str
    cpu_cores: int
    ram_total_gb: float
    ram_available_gb: float
    gpus: List[GpuInfo]
    unified_memory: bool = False


class LlmModel(BaseModel):
    name: str
    provider: str
    parameter_count: int
    min_ram_gb: float
    recommended_ram_gb: float
    min_vram_gb: Optional[float] = None
    quantization: str
    context_length: int
    use_case: str


class UtilizationScores(BaseModel):
    vram: float = 0.0
    ram: float = 0.0


class ModelFit(BaseModel):
    model: LlmModel
    fit_level: FitLevel
    run_mode: RunMode
    utilization: UtilizationScores
    quality_score: float
    speed_score: float
    context_score: float
    overall_score: float


class FilterOptions(BaseModel):
    search_text: str = ""
    providers: List[str] = []
    fit_levels: List[FitLevel] = []
    min_params: Optional[int] = None
    max_params: Optional[int] = None
    min_context: Optional[int] = None
    use_cases: List[str] = []


class ExportFormat(str, Enum):
    JSON = "json"
    CSV = "csv"
