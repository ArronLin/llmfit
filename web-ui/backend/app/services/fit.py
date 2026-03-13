from typing import List

from app.models.schemas import (
    FitLevel,
    LlmModel,
    ModelFit,
    RunMode,
    SystemSpecs,
    UtilizationScores,
)


def analyze_fit(model: LlmModel, specs: SystemSpecs) -> ModelFit:
    best_run_mode = None
    best_fit_level = FitLevel.TOO_TIGHT
    best_utilization = UtilizationScores()
    max_vram_available = max([gpu.vram_available_gb for gpu in specs.gpus]) if specs.gpus else 0
    ram_available = specs.ram_available_gb

    if specs.gpus and max_vram_available > 0:
        if model.min_vram_gb and max_vram_available >= model.recommended_ram_gb:
            best_run_mode = RunMode.GPU
            best_fit_level = FitLevel.PERFECT
            best_utilization.vram = model.min_vram_gb / max_vram_available if model.min_vram_gb else 0
        elif model.min_vram_gb and max_vram_available >= model.min_vram_gb:
            best_run_mode = RunMode.GPU
            best_fit_level = FitLevel.GOOD
            best_utilization.vram = model.min_vram_gb / max_vram_available if model.min_vram_gb else 0

    if not best_run_mode and not specs.unified_memory:
        if ram_available >= model.recommended_ram_gb:
            best_run_mode = RunMode.CPU_OFFLOAD
            best_fit_level = FitLevel.PERFECT
            best_utilization.ram = model.min_ram_gb / ram_available
        elif ram_available >= model.min_ram_gb:
            best_run_mode = RunMode.CPU_OFFLOAD
            best_fit_level = FitLevel.GOOD
            best_utilization.ram = model.min_ram_gb / ram_available

    if not best_run_mode:
        if ram_available >= model.recommended_ram_gb:
            best_run_mode = RunMode.CPU_ONLY
            best_fit_level = FitLevel.PERFECT
            best_utilization.ram = model.min_ram_gb / ram_available
        elif ram_available >= model.min_ram_gb:
            best_run_mode = RunMode.CPU_ONLY
            best_fit_level = FitLevel.GOOD
            best_utilization.ram = model.min_ram_gb / ram_available

    if not best_run_mode and ram_available >= model.min_ram_gb * 0.8:
        best_run_mode = RunMode.CPU_ONLY
        best_fit_level = FitLevel.MARGINAL
        best_utilization.ram = model.min_ram_gb / ram_available

    if not best_run_mode:
        best_run_mode = RunMode.CPU_ONLY
        best_fit_level = FitLevel.TOO_TIGHT
        best_utilization.ram = model.min_ram_gb / ram_available if ram_available > 0 else 1.0

    quality_score = calculate_quality_score(model)
    speed_score = calculate_speed_score(best_run_mode, model, specs)
    context_score = calculate_context_score(model, specs)
    overall_score = calculate_overall_score(best_fit_level, quality_score, speed_score, context_score)

    return ModelFit(
        model=model,
        fit_level=best_fit_level,
        run_mode=best_run_mode,
        utilization=best_utilization,
        quality_score=quality_score,
        speed_score=speed_score,
        context_score=context_score,
        overall_score=overall_score,
    )


def calculate_quality_score(model: LlmModel) -> float:
    params_billions = model.parameter_count / 1e9
    if params_billions >= 70:
        return 1.0
    elif params_billions >= 30:
        return 0.85
    elif params_billions >= 13:
        return 0.7
    elif params_billions >= 7:
        return 0.55
    else:
        return 0.4


def calculate_speed_score(run_mode: RunMode, model: LlmModel, specs: SystemSpecs) -> float:
    base_score = 0.0
    if run_mode == RunMode.GPU:
        base_score = 1.0
    elif run_mode == RunMode.CPU_OFFLOAD:
        base_score = 0.6
    else:
        base_score = 0.3

    params_billions = model.parameter_count / 1e9
    size_penalty = max(0.0, 1.0 - (params_billions / 100))
    
    return base_score * (0.7 + 0.3 * size_penalty)


def calculate_context_score(model: LlmModel, specs: SystemSpecs) -> float:
    if model.context_length >= 128000:
        return 1.0
    elif model.context_length >= 32768:
        return 0.8
    elif model.context_length >= 8192:
        return 0.6
    else:
        return 0.4


def calculate_overall_score(fit_level: FitLevel, quality: float, speed: float, context: float) -> float:
    fit_weight = 0.4
    quality_weight = 0.25
    speed_weight = 0.2
    context_weight = 0.15

    fit_score = {
        FitLevel.PERFECT: 1.0,
        FitLevel.GOOD: 0.75,
        FitLevel.MARGINAL: 0.5,
        FitLevel.TOO_TIGHT: 0.0,
    }[fit_level]

    return (
        fit_score * fit_weight +
        quality * quality_weight +
        speed * speed_weight +
        context * context_weight
    )


def get_fit_level_priority(fit_level: FitLevel) -> int:
    priorities = {
        FitLevel.PERFECT: 0,
        FitLevel.GOOD: 1,
        FitLevel.MARGINAL: 2,
        FitLevel.TOO_TIGHT: 3,
    }
    return priorities.get(fit_level, 4)


def get_run_mode_priority(run_mode: RunMode) -> int:
    priorities = {
        RunMode.GPU: 0,
        RunMode.CPU_OFFLOAD: 1,
        RunMode.CPU_ONLY: 2,
    }
    return priorities.get(run_mode, 3)


def rank_models_by_fit(fits: List[ModelFit]) -> List[ModelFit]:
    return sorted(
        fits,
        key=lambda fit: (
            get_fit_level_priority(fit.fit_level),
            get_run_mode_priority(fit.run_mode),
            -fit.overall_score,
            -(fit.utilization.vram + fit.utilization.ram) / 2,
        ),
    )
