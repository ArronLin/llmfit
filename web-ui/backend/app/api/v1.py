import json
import csv
from io import StringIO
from typing import List, Optional

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    ExportFormat,
    FilterOptions,
    LlmModel,
    ModelFit,
    SystemSpecs,
)
from app.services.fit import analyze_fit, rank_models_by_fit
from app.services.hardware import detect_system_specs
from app.services.models import get_all_models, search_models

router = APIRouter(prefix="/api/v1", tags=["v1"])


@router.get("/system", response_model=SystemSpecs)
async def get_system_specs():
    return detect_system_specs()


@router.get("/models", response_model=List[LlmModel])
async def get_models(q: Optional[str] = None):
    if q:
        return search_models(q)
    return get_all_models()


@router.get("/models/providers", response_model=List[str])
async def get_providers():
    models = get_all_models()
    providers = sorted(list(set([model.provider for model in models])))
    return providers


@router.get("/models/use-cases", response_model=List[str])
async def get_use_cases():
    models = get_all_models()
    use_cases = set()
    for model in models:
        for uc in model.use_case.split(", "):
            use_cases.add(uc)
    return sorted(list(use_cases))


@router.get("/fit", response_model=List[ModelFit])
async def get_model_fits(
    search_text: str = "",
    providers: Optional[List[str]] = Query(None),
    fit_levels: Optional[List[str]] = Query(None),
    min_params: Optional[int] = None,
    max_params: Optional[int] = None,
    min_context: Optional[int] = None,
    use_cases: Optional[List[str]] = Query(None),
):
    specs = detect_system_specs()
    models = get_all_models()

    if search_text:
        models = [
            model for model in models
            if search_text.lower() in model.name.lower()
            or search_text.lower() in model.provider.lower()
            or search_text.lower() in model.use_case.lower()
        ]

    if providers:
        models = [model for model in models if model.provider in providers]

    if min_params:
        models = [model for model in models if model.parameter_count >= min_params]

    if max_params:
        models = [model for model in models if model.parameter_count <= max_params]

    if min_context:
        models = [model for model in models if model.context_length >= min_context]

    if use_cases:
        models = [
            model for model in models
            if any(uc in model.use_case for uc in use_cases)
        ]

    fits = [analyze_fit(model, specs) for model in models]

    if fit_levels:
        fits = [fit for fit in fits if fit.fit_level in fit_levels]

    ranked_fits = rank_models_by_fit(fits)
    return ranked_fits


@router.get("/export")
async def export_results(
    format: ExportFormat = ExportFormat.JSON,
    search_text: str = "",
    providers: Optional[List[str]] = Query(None),
    fit_levels: Optional[List[str]] = Query(None),
    min_params: Optional[int] = None,
    max_params: Optional[int] = None,
    min_context: Optional[int] = None,
    use_cases: Optional[List[str]] = Query(None),
):
    fits = await get_model_fits(
        search_text=search_text,
        providers=providers,
        fit_levels=fit_levels,
        min_params=min_params,
        max_params=max_params,
        min_context=min_context,
        use_cases=use_cases,
    )

    if format == ExportFormat.JSON:
        content = json.dumps([fit.model_dump() for fit in fits], indent=2)
        return StreamingResponse(
            iter([content]),
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="llmfit_results.json"'},
        )
    else:
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Model Name",
            "Provider",
            "Parameters",
            "Fit Level",
            "Run Mode",
            "Overall Score",
            "Quality Score",
            "Speed Score",
            "Context Score",
            "Context Length",
            "Quantization",
            "Use Case",
        ])
        for fit in fits:
            writer.writerow([
                fit.model.name,
                fit.model.provider,
                fit.model.parameter_count,
                fit.fit_level,
                fit.run_mode,
                f"{fit.overall_score:.2f}",
                f"{fit.quality_score:.2f}",
                f"{fit.speed_score:.2f}",
                f"{fit.context_score:.2f}",
                fit.model.context_length,
                fit.model.quantization,
                fit.model.use_case,
            ])
        content = output.getvalue()
        return StreamingResponse(
            iter([content]),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="llmfit_results.csv"'},
        )
