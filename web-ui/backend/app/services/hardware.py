import platform
import subprocess
import sys
from typing import List

import psutil
from cpuinfo import get_cpu_info

from app.models.schemas import GpuInfo, SystemSpecs


def detect_cpu() -> tuple[str, int]:
    cpu_info = get_cpu_info()
    cpu_name = cpu_info.get("brand_raw", "Unknown CPU")
    cpu_cores = psutil.cpu_count(logical=True)
    return cpu_name, cpu_cores


def detect_ram() -> tuple[float, float]:
    ram = psutil.virtual_memory()
    ram_total_gb = ram.total / (1024**3)
    ram_available_gb = ram.available / (1024**3)
    return ram_total_gb, ram_available_gb


def detect_gpus_windows() -> List[GpuInfo]:
    gpus = []
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total,memory.free", "--format=csv,noheader,nounits"],
            capture_output=True,
            text=True,
            check=True,
        )
        for line in result.stdout.strip().split("\n"):
            if line:
                name, total, free = line.split(", ")
                gpus.append(GpuInfo(
                    name=name.strip(),
                    vram_total_gb=float(total) / 1024,
                    vram_available_gb=float(free) / 1024,
                ))
    except (subprocess.SubprocessError, FileNotFoundError):
        pass
    return gpus


def detect_gpus_macos() -> List[GpuInfo]:
    gpus = []
    try:
        result = subprocess.run(
            ["system_profiler", "SPDisplaysDataType"],
            capture_output=True,
            text=True,
            check=True,
        )
        if "Apple M" in result.stdout or "Apple Silicon" in result.stdout:
            ram_total, _ = detect_ram()
            gpus.append(GpuInfo(
                name="Apple Silicon GPU",
                vram_total_gb=ram_total,
                vram_available_gb=ram_total * 0.8,
            ))
    except (subprocess.SubprocessError, FileNotFoundError):
        pass
    return gpus


def detect_gpus_linux() -> List[GpuInfo]:
    gpus = detect_gpus_windows()
    if not gpus:
        try:
            result = subprocess.run(
                ["rocm-smi", "--showmeminfo", "vram"],
                capture_output=True,
                text=True,
                check=True,
            )
        except (subprocess.SubprocessError, FileNotFoundError):
            pass
    return gpus


def detect_gpus() -> List[GpuInfo]:
    system = platform.system()
    if system == "Windows":
        return detect_gpus_windows()
    elif system == "Darwin":
        return detect_gpus_macos()
    else:
        return detect_gpus_linux()


def is_unified_memory() -> bool:
    system = platform.system()
    if system == "Darwin":
        try:
            result = subprocess.run(
                ["system_profiler", "SPDisplaysDataType"],
                capture_output=True,
                text=True,
                check=True,
            )
            return "Apple M" in result.stdout or "Apple Silicon" in result.stdout
        except (subprocess.SubprocessError, FileNotFoundError):
            pass
    return False


def detect_system_specs() -> SystemSpecs:
    cpu_name, cpu_cores = detect_cpu()
    ram_total_gb, ram_available_gb = detect_ram()
    gpus = detect_gpus()
    unified_memory = is_unified_memory()
    
    return SystemSpecs(
        cpu_name=cpu_name,
        cpu_cores=cpu_cores,
        ram_total_gb=ram_total_gb,
        ram_available_gb=ram_available_gb,
        gpus=gpus,
        unified_memory=unified_memory,
    )
